export interface SalesOverviewDto {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersGrowth: number; // Percentual de crescimento
  revenueGrowth: number;
}

export interface SalesByPeriodDto {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductDto {
  productId: string;
  productName: string;
  sku: string;
  totalSold: number;
  revenue: number;
}

export interface MarketplacePerformanceDto {
  marketplace: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface OrdersByStatusDto {
  status: string;
  count: number;
  percentage: number;
}

export interface AnalyticsDashboardDto {
  salesOverview: SalesOverviewDto;
  salesByPeriod: SalesByPeriodDto[];
  topProducts: TopProductDto[];
  marketplacePerformance: MarketplacePerformanceDto[];
  ordersByStatus: OrdersByStatusDto[];
}
