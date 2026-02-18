import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
  ) {}

  async create(dto: CreateStoreDto) {
    const store = this.storesRepository.create(dto);
    return this.storesRepository.save(store);
  }

  async findAll() {
    return this.storesRepository.find();
  }

  async findAllByUser(userId: string) {
    return this.storesRepository.find({
      where: { userId },
      relations: ['company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByCompany(companyId: string) {
    return this.storesRepository.find({
      where: { companyId },
      relations: ['company', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const store = await this.storesRepository.findOne({ where: { id } });
    if (!store) {
      throw new NotFoundException('Loja não encontrada');
    }
    return store;
  }

  async update(id: string, dto: UpdateStoreDto) {
    const result = await this.storesRepository.update({ id }, dto);
    if (!result.affected) {
      throw new NotFoundException('Loja não encontrada');
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.storesRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Loja não encontrada');
    }
    return { deleted: true };
  }

  /**
   * Atualiza os tokens do Mercado Livre de uma loja
   */
  async updateMercadoLivreTokens(
    storeId: string,
    tokenData: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      userId: string;
    },
  ) {
    const expiresAt = Date.now() + tokenData.expiresIn * 1000;
    
    await this.storesRepository.update(
      { id: storeId },
      {
        mlAccessToken: tokenData.accessToken,
        mlRefreshToken: tokenData.refreshToken,
        mlTokenExpiresAt: expiresAt,
        mlUserId: tokenData.userId,
      },
    );
    
    return this.findOne(storeId);
  }

  /**
   * Busca ou cria uma loja para o usuário do Mercado Livre
   * IMPORTANTE: 
   * - Mesma conta ML (mlUserId) = ATUALIZA o registro (não cria novo)
   * - Contas ML DIFERENTES = CRIA novo registro
   * - Nunca sobrescreve tokens de outro usuário hub
   */
  async findOrCreateMercadoLivreStore(
    mlUserId: string, 
    userId: string,
    companyId: string,
    tokenData: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    },
    storeName?: string, // Nome (nickname) da loja no ML
  ) {
    // Verificar se esta conta ML já está conectada
    const existingStore = await this.storesRepository.findOne({
      where: { mlUserId, companyId },
    });

    const expiresAt = Date.now() + tokenData.expiresIn * 1000;
    const name = storeName ? `${storeName} - ${mlUserId}` : `Loja Mercado Livre - ${mlUserId}`;

    // ✅ SE MESMA CONTA ML: ATUALIZA (não cria novo)
    if (existingStore) {
      console.log('✅ Atualizando tokens da loja já conectada:', existingStore.name);
      
      await this.storesRepository.update(
        { id: existingStore.id },
        {
          mlAccessToken: tokenData.accessToken,
          mlRefreshToken: tokenData.refreshToken,
          mlTokenExpiresAt: expiresAt,
          mlNickname: storeName || existingStore.mlNickname,
          status: 'active',
          name,
          userId,
          companyId,
        },
      );
      return this.findOne(existingStore.id);
    }

    // ✅ SE NOVA CONTA ML: CRIA novo registro
    console.log('✨ Criando novo registro de loja ML:', name);
    const store = this.storesRepository.create({
      name,
      marketplace: 'MercadoLivre',
      status: 'active',
      userId,
      companyId,
      mlUserId,
      mlNickname: storeName,
      mlAccessToken: tokenData.accessToken,
      mlRefreshToken: tokenData.refreshToken,
      mlTokenExpiresAt: expiresAt,
    });

    return this.storesRepository.save(store);
  }

  /**
   * Busca uma loja pelo mlUserId
   */
  async findByMercadoLivreUserId(mlUserId: string) {
    return this.storesRepository.findOne({
      where: { mlUserId },
    });
  }

  /**
   * Desconecta uma loja do Mercado Livre (marca como revogada)
   */
  async disconnectMercadoLiveStore(
    storeId: string,
    access: { userId?: string; companyId?: string },
  ) {
    const store = await this.findOne(storeId);
    
    const hasCompanyAccess = access.companyId && store.companyId === access.companyId;
    const hasUserAccess = access.userId && store.userId === access.userId;
    if (!hasCompanyAccess && !hasUserAccess) {
      throw new Error('Você não tem permissão para desconectar esta loja');
    }

    if (!store.mlUserId) {
      throw new Error('Esta loja não está conectada ao Mercado Livre');
    }

    // Limpar tokens e marcar como inativo
    await this.storesRepository.update(
      { id: storeId },
      {
        status: 'disconnected',
        mlAccessToken: undefined,
        mlRefreshToken: undefined,
        mlTokenExpiresAt: undefined,
      },
    );

    return this.findOne(storeId);
  }

  /**
   * Busca todas as lojas ML conectadas de um usuário
   */
  async findAllMercadoLivreStores(companyId: string) {
    return this.storesRepository.find({
      where: { 
        companyId,
        marketplace: 'MercadoLivre',
      },
      order: { createdAt: 'DESC' },
    });
  }
}
