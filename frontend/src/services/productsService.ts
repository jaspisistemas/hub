import { apiFetch } from './api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export const productsService = {
  getAll: async (): Promise<Product[]> => {
    return apiFetch<Product[]>('/products');
  },

  getOne: async (id: string): Promise<Product> => {
    return apiFetch<Product>(`/products/${id}`);
  },

  create: async (product: CreateProductInput): Promise<Product> => {
    return apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  update: async (id: string, product: Partial<CreateProductInput>): Promise<Product> => {
    return apiFetch<Product>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
