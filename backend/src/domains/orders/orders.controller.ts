import { Controller, Post, Body, Get, Param, Patch, UseGuards, Request, Query, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketplaceService } from '../../integrations/marketplace/marketplace.service';
import { StoresService } from '../stores/stores.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly marketplaceService: MarketplaceService,
    private readonly storesService: StoresService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get('metrics/dashboard')
  async getDashboardMetrics(@Query('days') days: string, @Request() req: any) {
    const daysNumber = days ? parseInt(days) : 30;
    // Se usuário tem company, retorna métricas da empresa
    if (req.user.companyId) {
      return this.ordersService.getDashboardMetricsByCompany(req.user.companyId, daysNumber);
    }
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

    // Se usuário tem company, retorna pedidos da empresa
    if (req.user.companyId) {
      return this.ordersService.listOrdersByCompany(
        req.user.companyId,
        statusList,
        paidOnlyFlag,
        updatedSince,
      );
    }

    // Senão retorna pedidos do usuário
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

  @Get(':id/label')
  async getShippingLabel(@Param('id') id: string, @Res() res: Response) {
    const order = await this.ordersService.getOrderById(id);

    if (!order || order.marketplace?.toLowerCase() !== 'mercadolivre') {
      throw new BadRequestException('Etiqueta disponível apenas para pedidos do Mercado Livre');
    }

    if (!order.externalShipmentId) {
      throw new BadRequestException('Shipment ID não encontrado para este pedido');
    }

    if (!order.storeId) {
      throw new BadRequestException('Loja não encontrada para este pedido');
    }

    const store = await this.storesService.findOne(order.storeId);

    if (!store.mlAccessToken) {
      throw new BadRequestException('Token do Mercado Livre não configurado para a loja');
    }

    const label = await this.marketplaceService.getMercadoLivreShipmentLabel(
      order.externalShipmentId,
      store.mlAccessToken,
    );

    res.setHeader('Content-Type', label.contentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="etiqueta-${order.externalShipmentId}.pdf"`);
    return res.send(label.buffer);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateOrderDto>) {
    return this.ordersService.updateOrder(id, dto);
  }
}
