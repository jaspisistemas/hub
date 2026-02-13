import { apiFetch } from './api';

interface CompanyData {
  name: string;
  cnpj?: string;
  address?: string;
  logoUrl?: string;
}

export const companyService = {
  // Criar empresa
  createCompany: async (data: CompanyData) => {
    return await apiFetch('/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  // Obter empresa do usuário
  getMyCompany: async () => {
    return await apiFetch('/companies/my-company', {
      method: 'GET',
    });
  },

  // Atualizar empresa
  updateCompany: async (id: string, data: Partial<CompanyData>) => {
    return await apiFetch(`/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
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
