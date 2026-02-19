import { apiFetch } from './api';

interface CompanyData {
  name: string;
  cnpj?: string;
  address?: string;
  logoUrl?: string;
}

type CompanyInput = CompanyData | FormData;

export const companyService = {
  // Criar empresa
  createCompany: async (data: CompanyInput) => {
    const isFormData = data instanceof FormData;
    return await apiFetch('/companies', {
      method: 'POST',
      ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  // Obter empresa do usuário
  getMyCompany: async () => {
    return await apiFetch('/companies/my-company', {
      method: 'GET',
    });
  },

  // Atualizar empresa
  updateCompany: async (id: string, data: CompanyInput) => {
    const isFormData = data instanceof FormData;
    return await apiFetch(`/companies/${id}`, {
      method: 'PUT',
      ...(isFormData ? {} : { headers: { 'Content-Type': 'application/json' } }),
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  // Deletar empresa
  deleteCompany: async (id: string) => {
    return await apiFetch(`/companies/${id}`, {
      method: 'DELETE',
    });
  },

  // Obter detalhes da empresa
  getCompany: async (id: string) => {
    return await apiFetch(`/companies/${id}`, {
      method: 'GET',
    });
  },
};
