import { apiFetch } from './api';

export interface Store {
  id: string;
  name: string;
  marketplace: string;
  status: string;
  productsCount?: number;
  ordersCount?: number;
  revenue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStoreInput {
  name: string;
  marketplace: string;
  status: string;
  productsCount?: number;
  ordersCount?: number;
  revenue?: number;
}

export const storesService = {
  getAll: async (): Promise<Store[]> => {
    return apiFetch<Store[]>('/stores');
  },

  getOne: async (id: string): Promise<Store> => {
    return apiFetch<Store>(`/stores/${id}`);
  },

  create: async (store: CreateStoreInput): Promise<Store> => {
    return apiFetch<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify(store),
    });
  },

  update: async (id: string, store: Partial<CreateStoreInput>): Promise<Store> => {
    return apiFetch<Store>(`/stores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(store),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/stores/${id}`, {
      method: 'DELETE',
    });
  },
};
