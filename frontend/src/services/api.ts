import { authService } from './authService';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiBaseUrl = () =>
  API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;

export const getBackendOrigin = () => {
  const base = getApiBaseUrl();
  return base.endsWith('/api') ? base.slice(0, -4) : base;
};

export interface FetchOptions extends RequestInit {
  needsAuth?: boolean;
  suppressAuthRedirect?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { needsAuth = true, suppressAuthRedirect = false, ...fetchOptions } = options;

  const headers = new Headers({
    'ngrok-skip-browser-warning': 'true',
    ...fetchOptions.headers,
  });

  // Só adicionar Content-Type se não for FormData
  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (needsAuth) {
    const authHeader = authService.getAuthHeader();
    Object.entries(authHeader).forEach(([key, value]) => {
      headers.set(key, value as string);
    });
  }

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    authService.removeToken();
    if (!suppressAuthRedirect) {
      window.location.href = '/login?reason=expired';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    throw new Error('Resposta vazia do servidor.');
  }
  
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
