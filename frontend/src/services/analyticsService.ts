import { apiFetch } from './api';

export interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  ordersGrowth: number;
  revenueGrowth: number;
}

export interface SalesByPeriod {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  sku: string;
  totalSold: number;
  revenue: number;
}

export interface MarketplacePerformance {
  marketplace: string;
  orders: number;
  revenue: number;
  percentage: number;
}

export interface OrdersByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface AnalyticsDashboard {
  salesOverview: SalesOverview;
  salesByPeriod: SalesByPeriod[];
  topProducts: TopProduct[];
  marketplacePerformance: MarketplacePerformance[];
  ordersByStatus: OrdersByStatus[];
}

export interface AnalyticsQuery {
  startDate?: string;
  endDate?: string;
  storeId?: string;
}

const analyticsService = {
  getDashboard: async (params?: AnalyticsQuery): Promise<AnalyticsDashboard> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.storeId) queryParams.append('storeId', params.storeId);

    const query = queryParams.toString();
    const url = query ? `/analytics/dashboard?${query}` : '/analytics/dashboard';

    return apiFetch<AnalyticsDashboard>(url);
  },
};

export default analyticsService;
