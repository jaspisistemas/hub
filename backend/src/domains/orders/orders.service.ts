import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In, IsNull } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderCreatedEvent, OrderIntegrationFailedEvent } from './events';
import { Order } from './entities/order.entity';
import { WebsocketGateway } from '../../infra/websocket/websocket.gateway';
import { Store } from '../stores/entities/store.entity';

/**
 * OrdersService: contém APENAS regras de negócio.
 * - NÃO conhece APIs externas ou adapters.
 * - Publica eventos para outros subsistemas.
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(Store)
    private readonly storesRepository: Repository<Store>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  private normalizeMarketplace(value?: string) {
    return (value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  async createOrder(dto: CreateOrderDto) {
    // exemplo de regra de negócio: garantir total >= 0
    if (dto.total < 0) {
      const err: OrderIntegrationFailedEvent = {
        orderId: 'unknown',
        reason: 'Invalid total',
      };
      // emitir evento para fila ou barramento de eventos (simulado)
      this.handleIntegrationFailure(err);
      throw new Error('Invalid order total');
    }

    const order = this.ordersRepository.create({
      externalId: dto.externalId,
      marketplace: dto.marketplace,
      status: dto.raw?.status || 'created',
      total: dto.total,
      rawData: dto.raw ? JSON.stringify(dto.raw) : undefined,
      storeId: dto.storeId,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerCity: dto.customerCity,
      customerState: dto.customerState,
      customerAddress: dto.customerAddress,
      customerZipCode: dto.customerZipCode,
    });

    const saved = await this.ordersRepository.save(order);

    const createdEvent: OrderCreatedEvent = {
      orderId: saved.id,
      marketplace: saved.marketplace,
      occurredAt: new Date(),
    };

    // emitir o evento (simulado) - em app real usar EventEmitter/BullMQ
    this.emitOrderCreated(createdEvent);

    return saved;
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }
    return order;
  }

  async listOrders() {
    return this.ordersRepository.find();
  }

  async listOrdersByUser(userId: string) {
    const stores = await this.storesRepository.find({ where: { userId } });
    const storeIds = stores.map((s) => s.id);

    const baseOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.store', 'store')
      .where(storeIds.length ? 'order.storeId IN (:...storeIds)' : '1=0', { storeIds })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    if (stores.length === 1) {
      const store = stores[0];
      const normalizedStoreMarketplace = this.normalizeMarketplace(store.marketplace);

      const orphanOrders = await this.ordersRepository.find({
        where: { storeId: IsNull() },
        order: { createdAt: 'DESC' },
      });

      const matchedOrphans = orphanOrders.filter((order) =>
        this.normalizeMarketplace(order.marketplace) === normalizedStoreMarketplace,
      );

      if (matchedOrphans.length) {
        await this.ordersRepository.update(
          { id: In(matchedOrphans.map((o) => o.id)) },
          { storeId: store.id },
        );

        matchedOrphans.forEach((order) => {
          order.storeId = store.id;
          order.store = store;
        });
      }

      const combined = [...matchedOrphans, ...baseOrders];
      return combined.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return baseOrders;
  }

  async updateOrder(id: string, dto: UpdateOrderDto) {
    const order = await this.getOrderById(id);
    
    const updated = Object.assign(order, {
      status: dto.status || order.status,
      customerName: dto.customerName || order.customerName,
      customerEmail: dto.customerEmail || order.customerEmail,
      customerPhone: dto.customerPhone || order.customerPhone,
      customerCity: dto.customerCity || order.customerCity,
      customerState: dto.customerState || order.customerState,
      customerAddress: dto.customerAddress || order.customerAddress,
      customerZipCode: dto.customerZipCode || order.customerZipCode,
      total: dto.total !== undefined ? dto.total : order.total,
    });

    const saved = await this.ordersRepository.save(updated);

    // Emitir evento de atualização
    this.websocketGateway.emitOrderUpdated({
      id: saved.id,
      status: saved.status,
    });

    return saved;
  }

  async upsertFromMarketplace(dto: CreateOrderDto) {
    const existing = await this.ordersRepository.findOne({
      where: { externalId: dto.externalId },
    });

    if (existing) {
      const updated = Object.assign(existing, {
        marketplace: dto.marketplace || existing.marketplace,
        status: dto.raw?.status || existing.status,
        total: dto.total !== undefined ? dto.total : existing.total,
        rawData: dto.raw ? JSON.stringify(dto.raw) : existing.rawData,
        storeId: dto.storeId || existing.storeId,
        customerName: dto.customerName || existing.customerName,
        customerEmail: dto.customerEmail || existing.customerEmail,
        customerPhone: dto.customerPhone || existing.customerPhone,
        customerCity: dto.customerCity || existing.customerCity,
        customerState: dto.customerState || existing.customerState,
        customerAddress: dto.customerAddress || existing.customerAddress,
        customerZipCode: dto.customerZipCode || existing.customerZipCode,
      });

      const saved = await this.ordersRepository.save(updated);
      this.websocketGateway.emitOrderUpdated({
        id: saved.id,
        status: saved.status,
      });

      return { order: saved, updated: true };
    }

    const created = await this.createOrder(dto);
    return { order: created, updated: false };
  }

  private emitOrderCreated(event: OrderCreatedEvent) {
    // Emitir via WebSocket para clientes conectados
    this.websocketGateway.emitOrderCreated(event);
    console.log('[event] order.created', event);
  }

  private handleIntegrationFailure(event: OrderIntegrationFailedEvent) {
    console.warn('[event] order.integration_failed', event);
  }

  async getDashboardMetrics(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Buscar todos os pedidos do período
    const orders = await this.ordersRepository.find({
      where: {
        createdAt: MoreThan(startDate),
      },
      relations: ['store'],
    });

    // Calcular overview
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const uniqueStores = new Set(orders.map(o => o.store?.id).filter(Boolean));
    const totalStores = uniqueStores.size;

    // Vendas por período (por dia)
    const salesByPeriod = this.calculateSalesByPeriod(orders, days);

    // Pedidos por status
    const ordersByStatus = this.calculateOrdersByStatus(orders);

    // Vendas por loja
    const salesByStore = await this.calculateSalesByStore(orders);

    // Pedidos recentes (últimos 10)
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(order => ({
        id: order.id,
        externalId: order.externalId,
        customerName: order.customerName || 'Cliente não informado',
        marketplace: order.marketplace,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
      }));

    return {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalStores,
      },
      salesByPeriod,
      ordersByStatus,
      salesByStore,
      recentOrders,
    };
  }

  async getStoreMetrics(storeId: string, userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.ordersRepository.find({
      where: {
        store: { id: storeId },
        createdAt: MoreThan(startDate),
      },
      relations: ['items', 'items.product'],
    });

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Contar produtos únicos
    const uniqueProducts = new Set();
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.product?.id) uniqueProducts.add(item.product.id);
      });
    });
    const totalProducts = uniqueProducts.size;

    // Vendas por dia
    const salesByDay = this.calculateSalesByPeriod(orders, days);

    // Top produtos
    const productSales = new Map<string, { id: string; name: string; sales: number; revenue: number }>();
    orders.forEach(order => {
      order.items?.forEach(item => {
        if (item.product) {
          const existing = productSales.get(item.product.id) || {
            id: item.product.id,
            name: item.product.name,
            sales: 0,
            revenue: 0,
          };
          existing.sales += item.quantity;
          existing.revenue += Number(item.unitPrice) * item.quantity;
          productSales.set(item.product.id, existing);
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalProducts,
      salesByDay,
      topProducts,
    };
  }

  private calculateSalesByPeriod(orders: Order[], days: number) {
    const salesMap = new Map<string, { revenue: number; orders: number }>();
    
    // Inicializar todos os dias com 0
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      salesMap.set(dateKey, { revenue: 0, orders: 0 });
    }

    // Preencher com dados reais
    orders.forEach(order => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      const existing = salesMap.get(dateKey);
      if (existing) {
        existing.revenue += Number(order.total);
        existing.orders += 1;
      }
    });

    // Converter para array e ordenar
    return Array.from(salesMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateOrdersByStatus(orders: Order[]) {
    const statusMap = new Map<string, number>();
    orders.forEach(order => {
      const count = statusMap.get(order.status) || 0;
      statusMap.set(order.status, count + 1);
    });

    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));
  }

  private async calculateSalesByStore(orders: Order[]) {
    const storeMap = new Map<string, {
      storeId: string;
      storeName: string;
      marketplace: string;
      revenue: number;
      orders: number;
      products: number;
      lastSync: Date | null;
    }>();

    orders.forEach(order => {
      if (order.store) {
        const existing = storeMap.get(order.store.id) || {
          storeId: order.store.id,
          storeName: order.store.name,
          marketplace: order.store.marketplace,
          revenue: 0,
          orders: 0,
          products: 0,
          lastSync: order.store.lastSyncAt,
        };
        existing.revenue += Number(order.total);
        existing.orders += 1;
        storeMap.set(order.store.id, existing);
      }
    });

    return Array.from(storeMap.values());
  }
}
