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
}
