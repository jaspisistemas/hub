import { apiFetch } from './api';

export interface Support {
  id: string;
  origin: 'mercado_livre' | 'shopee' | 'amazon' | 'outros';
  type: 'pergunta' | 'avaliacao' | 'mensagem_venda';
  status: 'nao_respondido' | 'respondido' | 'fechado';
  externalId: string;
  productExternalId?: string;
  productTitle?: string;
  orderExternalId?: string;
  packId?: string;
  customerName?: string;
  customerExternalId?: string;
  question: string;
  answer?: string;
  questionDate: string;
  answerDate?: string;
  canAnswer: boolean;
  metadata?: any;
  storeId?: string;
  productId?: string;
  store?: {
    id: string;
    name: string;
  };
  product?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SupportFilters {
  origin?: string;
  type?: string;
  status?: string;
  storeId?: string;
  productId?: string;
  search?: string;
  daysRange?: number; // Número de dias para filtrar (ex: 7, 30, 90, ou null para todos)
}

export interface AnswerSupportDto {
  answer: string;
}

export const supportService = {
  async getAll(filters?: SupportFilters): Promise<Support[]> {
    const params = new URLSearchParams();
    if (filters?.origin) params.append('origin', filters.origin);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.daysRange !== undefined) params.append('daysRange', filters.daysRange.toString());

    console.log(`[SUPPORT-SERVICE] Enviando filtros:`, filters);
    console.log(`[SUPPORT-SERVICE] URL Query:`, params.toString());

    return apiFetch<Support[]>(`/supports?${params.toString()}`);
  },

  async getById(id: string): Promise<Support> {
    return apiFetch<Support>(`/supports/${id}`);
  },

  async answer(id: string, data: AnswerSupportDto): Promise<Support> {
    return apiFetch<Support>(`/supports/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async sync(storeId: string): Promise<{ imported: number; updated: number }> {
    return apiFetch<{ imported: number; updated: number }>(`/supports/sync/${storeId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  async delete(id: string): Promise<void> {
    return apiFetch<void>(`/supports/${id}`, {
      method: 'DELETE',
    });
  },
};
