import { apiFetch } from './api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  brand?: string;
  model?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  externalId?: string;
  marketplace?: string;
  mlCategoryId?: string;
  mlAttributes?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  brand?: string;
  model?: string;
  description?: string;
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
    const response = await fetch('https://uneducated-georgiann-personifiant.ngrok-free.dev/products', {
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
    const response = await fetch(`https://uneducated-georgiann-personifiant.ngrok-free.dev/products/${id}`, {
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

  publishToMarketplace: async (productIds: string[], marketplace: string, brand?: string, model?: string): Promise<any> => {
    const endpoint = marketplace === 'MercadoLivre' 
      ? '/marketplace/mercadolivre/publish-products'
      : '/marketplace/shopee/publish-products';
    
    return apiFetch<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify({ productIds, brand, model }),
    });
  },

  getMercadoLivreCategories: async (): Promise<{ id: string; name: string }[]> => {
    const response = await apiFetch<{ success: boolean; categories: { id: string; name: string }[] }>(
      '/marketplace/mercadolivre/categories'
    );
    return response.categories || [];
  },

  getMercadoLivreSubcategories: async (categoryId: string): Promise<{ id: string; name: string }[]> => {
    const response = await apiFetch<{ success: boolean; subcategories: { id: string; name: string }[] }>(
      `/marketplace/mercadolivre/categories/${categoryId}?categoryId=${categoryId}`
    );
    return response.subcategories || [];
  },
};
