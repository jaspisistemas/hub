import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductDto) {
    const product = this.productsRepository.create(dto);
    return this.productsRepository.save(product);
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
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.productsRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Produto não encontrado');
    }
    return { deleted: true };
  }
}
