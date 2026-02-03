import { authService } from './authService';

const API_URL = 'http://localhost:3000';

export interface FetchOptions extends RequestInit {
  needsAuth?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { needsAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (needsAuth) {
    const authHeader = authService.getAuthHeader();
    Object.assign(headers, authHeader);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    authService.removeToken();
    window.location.href = '/auth/login';
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  return response.json();
}
