import { apiFetch } from './api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
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

  createWithImage: async (formData: FormData): Promise<Product> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:3000/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Erro ao criar produto');
    return response.json();
  },

  updateWithImage: async (id: string, formData: FormData): Promise<Product> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`http://localhost:3000/products/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Erro ao atualizar produto');
    return response.json();
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

  exportToMarketplace: async (productIds: string[], marketplace: string): Promise<any> => {
    return apiFetch<any>('/products/export', {
      method: 'POST',
      body: JSON.stringify({ productIds, marketplace }),
    });
  },
};
