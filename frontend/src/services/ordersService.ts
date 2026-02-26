import { apiFetch, getApiBaseUrl } from './api';
import { authService } from './authService';

export interface Order {
  id: string;
  externalId: string;
  externalOrderId?: string;
  externalShipmentId?: string;
  externalPackId?: string;
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

  sync: async (): Promise<{ imported: number; updated: number }> => {
    return apiFetch<{ imported: number; updated: number }>(
      '/marketplace/mercadolivre/sync-orders',
      {
        method: 'POST',
        suppressAuthRedirect: true,
      },
    );
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

  getLabelPdf: async (orderId: string): Promise<Blob> => {
    const baseUrl = getApiBaseUrl();
    const token = authService.getToken();

    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    const response = await fetch(`${baseUrl}/orders/${orderId}/label`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Falha ao baixar etiqueta');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const errorText = await response.text();
      throw new Error(errorText || 'Resposta invalida ao baixar etiqueta');
    }

    const blob = await response.blob();
    if (!blob.size || blob.size < 200) {
      throw new Error('Etiqueta vazia retornada pelo Mercado Livre');
    }

    return blob;
  },
};
