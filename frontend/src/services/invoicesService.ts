import { apiFetch, getApiBaseUrl } from './api';
import { authService } from './authService';

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
      if (
        error.message?.includes('404') ||
        error.message?.includes('não encontrada') ||
        error.message?.includes('Resposta vazia do servidor')
      ) {
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
    const token = authService.getToken();

    console.log('Upload de nota fiscal:', {
      baseUrl,
      orderId,
      fileName: file.name,
      hasToken: !!token,
    });

    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }
    
    const response = await fetch(`${baseUrl}/invoices/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    console.log('Response upload:', {
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Erro ao fazer upload' };
      }
      
      if (response.status === 401) {
        authService.removeToken();
        throw new Error('Token expirado. Por favor, faça login novamente.');
      }

      console.error('Erro no upload:', errorData);
      throw new Error(errorData.message || `Erro ao fazer upload (${response.status})`);
    }

    return await response.json();
  },

  async sendToMarketplace(
    invoiceId: string,
    mlOrderId?: string,
    packId?: string,
  ): Promise<any> {
    return await apiFetch<any>(`/invoices/${invoiceId}/send-to-marketplace`, {
      method: 'POST',
      body: JSON.stringify({
        mlOrderId,
        packId,
      }),
    });
  },
};

export default invoicesService;
