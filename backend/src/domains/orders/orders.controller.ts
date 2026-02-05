import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  async findAll() {
    return this.ordersService.listOrders();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateOrderDto>) {
    return this.ordersService.updateOrder(id, dto);
  }
}
