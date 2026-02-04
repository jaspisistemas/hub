import { apiFetch } from './api';

export interface Order {
  id: string;
  externalId: string;
  marketplace: string;
  status: string;
  total: number;
  rawData?: string;
  createdAt?: string;
  updatedAt?: string;
  // Dados do cliente
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCity?: string;
  customerState?: string;
  customerAddress?: string;
  customerZipCode?: string;
}

export interface CreateOrderInput {
  externalId: string;
  marketplace: string;
  status: string;
  total: number;
  rawData?: string;
}

export const ordersService = {
  getAll: async (): Promise<Order[]> => {
    return apiFetch<Order[]>('/orders');
  },

  getOne: async (id: string): Promise<Order> => {
    return apiFetch<Order>(`/orders/${id}`);
  },

  create: async (order: CreateOrderInput): Promise<Order> => {
    return apiFetch<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  },

  update: async (id: string, order: Partial<CreateOrderInput>): Promise<Order> => {
    return apiFetch<Order>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(order),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};
