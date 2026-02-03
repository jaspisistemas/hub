import { apiFetch } from './api';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
}

export const customersService = {
  getAll: async (): Promise<Customer[]> => {
    return apiFetch<Customer[]>('/customers');
  },

  getOne: async (id: string): Promise<Customer> => {
    return apiFetch<Customer>(`/customers/${id}`);
  },

  create: async (customer: CreateCustomerInput): Promise<Customer> => {
    return apiFetch<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },

  update: async (id: string, customer: Partial<CreateCustomerInput>): Promise<Customer> => {
    return apiFetch<Customer>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(customer),
    });
  },

  delete: async (id: string): Promise<void> => {
    return apiFetch<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};
