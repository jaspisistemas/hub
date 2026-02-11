import { apiFetch, getApiBaseUrl } from './api';

export interface Invoice {
  id: string;
  orderId: string;
  number: string;
  series: string;
  accessKey: string;
  xmlContent?: string;
  pdfUrl?: string;
  issueDate: string;
  status: string;
  errorMessage?: string;
  sentToMarketplace: boolean;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  orderId: string;
  number?: string;
  series?: string;
  accessKey?: string;
  xmlContent?: string;
  pdfUrl?: string;
  issueDate?: string;
}

const invoicesService = {
  async getAll(): Promise<Invoice[]> {
    return await apiFetch<Invoice[]>('/invoices');
  },

  async getByOrderId(orderId: string): Promise<Invoice | null> {
    try {
      return await apiFetch<Invoice>(`/invoices/order/${orderId}`);
    } catch (error: any) {
      if (error.message?.includes('404') || error.message?.includes('não encontrada')) {
        return null;
      }
      throw error;
    }
  },

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    return await apiFetch<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async markAsSent(id: string): Promise<Invoice> {
    return await apiFetch<Invoice>(`/invoices/${id}/mark-sent`, {
      method: 'POST',
    });
  },

  async markAsFailed(id: string, errorMessage: string): Promise<Invoice> {
    return await apiFetch<Invoice>(`/invoices/${id}/mark-failed`, {
      method: 'POST',
      body: JSON.stringify({ errorMessage }),
    });
  },

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadFile(orderId: string, file: File): Promise<Invoice> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('orderId', orderId);

    const baseUrl = getApiBaseUrl();
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${baseUrl}/invoices/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro ao fazer upload' }));
      throw new Error(error.message || 'Erro ao fazer upload da nota fiscal');
    }

    return await response.json();
  },
};

export default invoicesService;
