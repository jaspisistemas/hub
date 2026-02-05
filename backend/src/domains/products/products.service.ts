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

  async create(dto: CreateProductDto) {
    const product = this.productsRepository.create(dto);
    const saved = await this.productsRepository.save(product);
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductCreated(saved);
    
    return saved;
  }

  async findAll() {
    return this.productsRepository.find();
  }

  async findOne(id: string) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }
    return product;
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
