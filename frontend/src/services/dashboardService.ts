import { apiFetch } from './api';

export interface DashboardMetrics {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalStores: number;
  };
  salesByPeriod: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  salesByStore: Array<{
    storeId: string;
    storeName: string;
    marketplace: string;
    revenue: number;
    orders: number;
    products: number;
    lastSync: string | null;
  }>;
  recentOrders: Array<{
    id: string;
    externalId: string;
    customerName: string;
    marketplace: string;
    status: string;
    total: number;
    createdAt: string;
    orderDate?: string;
  }>;
}

export interface StoreMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalProducts: number;
  salesByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
}

export const dashboardService = {
  async getDashboardMetrics(days: number = 30): Promise<DashboardMetrics> {
    return apiFetch<DashboardMetrics>(`/orders/metrics/dashboard?days=${days}`);
  },

  async getStoreMetrics(storeId: string, days: number = 30): Promise<StoreMetrics> {
    return apiFetch<StoreMetrics>(`/orders/metrics/store/${storeId}?days=${days}`);
  },
};
