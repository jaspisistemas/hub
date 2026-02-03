import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto) {
    const customer = this.customersRepository.create(dto);
    return this.customersRepository.save(customer);
  }

  async findAll() {
    return this.customersRepository.find();
  }

  async findOne(id: string) {
    const customer = await this.customersRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const result = await this.customersRepository.update({ id }, dto);
    if (!result.affected) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.customersRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return { deleted: true };
  }
}
