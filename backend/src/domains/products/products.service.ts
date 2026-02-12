import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { WebsocketGateway } from '../../infra/websocket/websocket.gateway';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(dto: CreateProductDto, userId: string, companyId?: string) {
    // Se temos companyId, buscar primeira loja da empresa
    // Senão, buscar primeira loja do usuário
    let store: any;
    
    if (companyId) {
      store = await this.productsRepository.manager.findOne('stores', {
        where: { companyId },
      } as any);
    } else {
      store = await this.productsRepository.manager.findOne('stores', {
        where: { userId },
      } as any);
    }
    
    const storeId: string = store?.id;
    
    const product = this.productsRepository.create({
      ...dto,
      storeId,
    });
    const saved = await this.productsRepository.save(product);
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductCreated(saved);
    
    return saved;
  }

  async findAll() {
    return this.productsRepository.find();
  }

  async findAllByUser(userId: string) {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('product.store', 'store')
      .where('store.userId = :userId', { userId })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async findAllByCompany(companyId: string) {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('product.store', 'store')
      .where('store.companyId = :companyId', { companyId })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    try {
      const product = await this.productsRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Produto com ID ${id} não encontrado`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar produto:', error);
      throw new NotFoundException(`Erro ao buscar produto com ID ${id}`);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const result = await this.productsRepository.update({ id }, dto);
    if (!result.affected) {
      throw new NotFoundException('Produto não encontrado');
    }
    const updated = await this.findOne(id);
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductUpdated(updated);
    
    return updated;
  }

  async remove(id: string) {
    const result = await this.productsRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Produto não encontrado');
    }
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductDeleted({ id });
    
    return { deleted: true };
  }

  async findBySku(sku: string) {
    return this.productsRepository.findOne({ where: { sku } });
  }
}
