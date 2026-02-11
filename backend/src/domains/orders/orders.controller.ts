import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get('metrics/dashboard')
  async getDashboardMetrics(@Query('days') days: string, @Request() req: any) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.ordersService.getDashboardMetrics(req.user.id, daysNumber);
  }

  @Get('metrics/store/:storeId')
  async getStoreMetrics(
    @Param('storeId') storeId: string,
    @Query('days') days: string,
    @Request() req: any
  ) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.ordersService.getStoreMetrics(storeId, req.user.id, daysNumber);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('paidOnly') paidOnly?: string,
    @Query('updatedSince') updatedSince?: string,
  ) {
    const statusList = status
      ? status.split(',').map((item) => item.trim()).filter(Boolean)
      : undefined;
    const paidOnlyFlag = paidOnly === 'true' || paidOnly === '1';

    return this.ordersService.listOrdersByUser(
      req.user.id,
      statusList,
      paidOnlyFlag,
      updatedSince,
    );
  }

  @Get('paid')
  async findPaid(
    @Request() req: any,
    @Query('updatedSince') updatedSince?: string,
  ) {
    return this.ordersService.listOrdersByUser(req.user.id, undefined, true, updatedSince);
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
