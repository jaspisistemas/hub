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
   */
  async findOrCreateMercadoLivreStore(mlUserId: string, tokenData: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }) {
    // Buscar loja existente pelo mlUserId
    let store = await this.storesRepository.findOne({
      where: { mlUserId },
    });

    const expiresAt = Date.now() + tokenData.expiresIn * 1000;

    if (store) {
      // Atualizar tokens
      await this.storesRepository.update(
        { id: store.id },
        {
          mlAccessToken: tokenData.accessToken,
          mlRefreshToken: tokenData.refreshToken,
          mlTokenExpiresAt: expiresAt,
        },
      );
      return this.findOne(store.id);
    }

    // Criar nova loja
    store = this.storesRepository.create({
      name: `Loja Mercado Livre - ${mlUserId}`,
      marketplace: 'MercadoLivre',
      status: 'active',
      mlAccessToken: tokenData.accessToken,
      mlRefreshToken: tokenData.refreshToken,
      mlTokenExpiresAt: expiresAt,
      mlUserId,
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
}
