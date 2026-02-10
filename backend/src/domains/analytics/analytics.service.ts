import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import {
  AnalyticsDashboardDto,
  SalesOverviewDto,
  SalesByPeriodDto,
  TopProductDto,
  MarketplacePerformanceDto,
  OrdersByStatusDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async getDashboardAnalytics(
    startDate?: Date,
    endDate?: Date,
    storeId?: string,
  ): Promise<AnalyticsDashboardDto> {
    this.logger.log('📊 Gerando analytics do dashboard');

    // Define período padrão: últimos 30 dias
    const end = endDate || new Date();
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Período anterior para comparação (mesmo tamanho)
    const periodDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousEnd = new Date(start.getTime() - 1);

    const [
      salesOverview,
      salesByPeriod,
      topProducts,
      marketplacePerformance,
      ordersByStatus,
    ] = await Promise.all([
      this.getSalesOverview(start, end, previousStart, previousEnd, storeId),
      this.getSalesByPeriod(start, end, storeId),
      this.getTopProducts(start, end, storeId, 10),
      this.getMarketplacePerformance(start, end, storeId),
      this.getOrdersByStatus(start, end, storeId),
    ]);

    return {
      salesOverview,
      salesByPeriod,
      topProducts,
      marketplacePerformance,
      ordersByStatus,
    };
  }

  private async getSalesOverview(
    start: Date,
    end: Date,
    previousStart: Date,
    previousEnd: Date,
    storeId?: string,
  ): Promise<SalesOverviewDto> {
    const whereClause: any = {
      createdAt: Between(start, end),
    };
    if (storeId) whereClause.storeId = storeId;

    const previousWhereClause: any = {
      createdAt: Between(previousStart, previousEnd),
    };
    if (storeId) previousWhereClause.storeId = storeId;

    // Período atual
    const currentOrders = await this.ordersRepository.find({ where: whereClause });
    const totalRevenue = currentOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = currentOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Período anterior
    const previousOrders = await this.ordersRepository.find({ where: previousWhereClause });
    const previousRevenue = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const previousOrdersCount = previousOrders.length;

    // Cálculo de crescimento
    const ordersGrowth = previousOrdersCount > 0
      ? ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100
      : 0;

    const revenueGrowth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      ordersGrowth: Math.round(ordersGrowth * 100) / 100,
      revenueGrowth: Math.round(revenueGrowth * 100) / 100,
    };
  }

  private async getSalesByPeriod(
    start: Date,
    end: Date,
    storeId?: string,
  ): Promise<SalesByPeriodDto[]> {
    const whereClause: any = {
      createdAt: Between(start, end),
    };
    if (storeId) whereClause.storeId = storeId;

    const orders = await this.ordersRepository.find({
      where: whereClause,
      order: { createdAt: 'ASC' },
    });

    // Agrupar por dia
    const groupedByDay = new Map<string, { revenue: number; orders: number }>();

    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const current = groupedByDay.get(date) || { revenue: 0, orders: 0 };

      groupedByDay.set(date, {
        revenue: current.revenue + Number(order.total),
        orders: current.orders + 1,
      });
    });

    return Array.from(groupedByDay.entries()).map(([date, data]) => ({
      date,
      revenue: Math.round(data.revenue * 100) / 100,
      orders: data.orders,
    }));
  }

  private async getTopProducts(
    start: Date,
    end: Date,
    storeId?: string,
    limit: number = 10,
  ): Promise<TopProductDto[]> {
    const whereClause: any = {
      createdAt: Between(start, end),
    };
    if (storeId) whereClause.storeId = storeId;

    const orders = await this.ordersRepository.find({ where: whereClause });

    // Extrair produtos dos pedidos (do campo rawData)
    const productSales = new Map<string, { name: string; sku: string; totalSold: number; revenue: number }>();

    for (const order of orders) {
      if (!order.rawData) continue;

      try {
        const rawData = typeof order.rawData === 'string' ? JSON.parse(order.rawData) : order.rawData;
        const items = rawData.order_items || [];

        items.forEach((item: any) => {
          const productId = item.item?.id || 'unknown';
          const productName = item.item?.title || 'Produto sem nome';
          const sku = item.item?.seller_sku || productId;
          const quantity = item.quantity || 1;
          const price = item.unit_price || 0;

          const current = productSales.get(productId) || {
            name: productName,
            sku: sku,
            totalSold: 0,
            revenue: 0,
          };

          productSales.set(productId, {
            name: current.name,
            sku: current.sku,
            totalSold: current.totalSold + quantity,
            revenue: current.revenue + (price * quantity),
          });
        });
      } catch (error) {
        this.logger.warn(`Erro ao processar rawData do pedido ${order.id}`);
      }
    }

    // Ordenar por quantidade vendida e limitar
    return Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        sku: data.sku,
        totalSold: data.totalSold,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  private async getMarketplacePerformance(
    start: Date,
    end: Date,
    storeId?: string,
  ): Promise<MarketplacePerformanceDto[]> {
    const whereClause: any = {
      createdAt: Between(start, end),
    };
    if (storeId) whereClause.storeId = storeId;

    const orders = await this.ordersRepository.find({ where: whereClause });

    const marketplaceStats = new Map<string, { orders: number; revenue: number }>();
    let totalRevenue = 0;

    orders.forEach((order) => {
      const marketplace = order.marketplace || 'Desconhecido';
      const revenue = Number(order.total);
      const current = marketplaceStats.get(marketplace) || { orders: 0, revenue: 0 };

      marketplaceStats.set(marketplace, {
        orders: current.orders + 1,
        revenue: current.revenue + revenue,
      });

      totalRevenue += revenue;
    });

    return Array.from(marketplaceStats.entries())
      .map(([marketplace, data]) => ({
        marketplace,
        orders: data.orders,
        revenue: Math.round(data.revenue * 100) / 100,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private async getOrdersByStatus(
    start: Date,
    end: Date,
    storeId?: string,
  ): Promise<OrdersByStatusDto[]> {
    const whereClause: any = {
      createdAt: Between(start, end),
    };
    if (storeId) whereClause.storeId = storeId;

    const orders = await this.ordersRepository.find({ where: whereClause });

    const statusCount = new Map<string, number>();
    const totalOrders = orders.length;

    orders.forEach((order) => {
      const status = order.status || 'unknown';
      statusCount.set(status, (statusCount.get(status) || 0) + 1);
    });

    return Array.from(statusCount.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 10000) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }
}
