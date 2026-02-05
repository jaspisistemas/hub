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

  connectMercadoLivre: () => {
    // Pegar o userId do usuário logado
    const userStr = localStorage.getItem('user');
    console.log('User no localStorage:', userStr);
    
    if (!userStr) {
      throw new Error('Usuário não autenticado');
    }
    
    const user = JSON.parse(userStr);
    console.log('User parseado:', user);
    console.log('User ID:', user.id);
    
    if (!user.id) {
      throw new Error('ID do usuário não encontrado');
    }
    
    // Redireciona para o endpoint de autorização OAuth do backend passando o userId
    const authUrl = `https://uneducated-georgiann-personifiant.ngrok-free.dev/marketplace/mercadolivre/auth?userId=${user.id}`;
    console.log('Redirecionando para:', authUrl);
    window.location.href = authUrl;
  },
};
