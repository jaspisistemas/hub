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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...fetchOptions.headers,
  };

  if (needsAuth) {
    const authHeader = authService.getAuthHeader();
    Object.assign(headers, authHeader);
  }

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (response.status === 401) {
    authService.removeToken();
    if (!suppressAuthRedirect) {
      window.location.href = '/auth/login';
    }
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  const text = await response.text();
  if (!text) return null;
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
