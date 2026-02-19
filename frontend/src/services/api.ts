import { authService } from './authService';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiBaseUrl = () =>
  API_BASE_URL.startsWith('http') ? API_BASE_URL : `${window.location.origin}${API_BASE_URL}`;

export const getBackendOrigin = () => {
  const base = getApiBaseUrl();
  return base.endsWith('/api') ? base.slice(0, -4) : base;
};

/**
 * Configuração padrão para retry e timeout
 */
export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  timeoutMs?: number;
  retryableStatusCodes?: number[];
}

/**
 * Opções estendidas de fetch com suporte a retry e timeout
 */
export interface FetchOptions extends RequestInit {
  needsAuth?: boolean;
  suppressAuthRedirect?: boolean;
  retry?: RetryConfig;
}

/**
 * Configuração global padrão para retry/timeout
 */
const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  timeoutMs: 30000, // 30 segundos
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // timeout, rate limit, server errors
};

/**
 * Classe de erro customizada para timeout
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Requisição expirou') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Classe de erro customizada para retry
 */
export class RetryError extends Error {
  constructor(
    message: string,
    public lastError: Error,
    public attempts: number
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

/**
 * Verifica se um erro é retentável
 */
function isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
  // Network errors como ECONNREFUSED, DNS failure são retentáveis
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }

  // Timeout é retentável
  if (error instanceof TimeoutError) {
    return true;
  }

  return false;
}

/**
 * Verifica se um status HTTP é retentável
 */
function isRetryableStatusCode(status: number, retryableStatusCodes: number[]): boolean {
  return retryableStatusCodes.includes(status);
}

/**
 * Calcula o delay com exponential backoff
 */
function getBackoffDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  const delay = Math.min(
    initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
    maxDelayMs
  );
  // Adiciona jitter (±10%) para evitar thundering herd
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.max(delay + jitter, 0);
}

/**
 * Aguarda um tempo especificado
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Cria uma promise que rejeita após um timeout
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  })
    .finally(() => clearTimeout(timeoutId))
    .catch((error) => {
      // DOMException com name 'AbortError' significa timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(
          `Requisição para ${url} expirou após ${timeoutMs}ms`
        );
      }
      throw error;
    });
}

/**
 * Faz uma requisição com suporte a retry automático e timeout
 */
async function apiFetchWithRetry<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    needsAuth = true,
    suppressAuthRedirect = false,
    retry: userRetryConfig = {},
    ...fetchOptions
  } = options;

  // Mescla configuração do usuário com padrão
  const retryConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...userRetryConfig,
  };

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      // Adiciona delay para tentativas posteriores
      if (attempt > 1) {
        const delay = getBackoffDelay(
          attempt - 1,
          retryConfig.initialDelayMs,
          retryConfig.maxDelayMs,
          retryConfig.backoffMultiplier
        );
        await sleep(delay);
      }

      const headers = new Headers({
        'ngrok-skip-browser-warning': 'true',
        ...fetchOptions.headers,
      });

      // Só adicionar Content-Type se não for FormData
      if (!(fetchOptions.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
      }

      // Adicionar headers de auth
      if (needsAuth) {
        const authHeader = authService.getAuthHeader();
        Object.entries(authHeader).forEach(([key, value]) => {
          headers.set(key, value as string);
        });
      }

      const url = `${getApiBaseUrl()}${endpoint}`;

      // Faz a requisição com timeout
      const response = await fetchWithTimeout(url, {
        ...fetchOptions,
        headers,
      }, retryConfig.timeoutMs);

      lastResponse = response;

      // Verifica erros de autenticação (não deve fazer retry)
      if (response.status === 401) {
        authService.removeToken();
        if (!suppressAuthRedirect) {
          window.location.href = '/login?reason=expired';
        }
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Se resposta não é OK, verifica se é retentável
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
        const errorMessage = error.message || `Erro ${response.status}`;

        // Se é um erro client-side (4xx), não faz retry
        if (response.status >= 400 && response.status < 500) {
          throw new Error(errorMessage);
        }

        // Se é servidor error (5xx) e está na lista de retentáveis
        if (isRetryableStatusCode(response.status, retryConfig.retryableStatusCodes)) {
          lastError = new Error(errorMessage);

          // Se foi a última tentativa, lança erro
          if (attempt > retryConfig.maxRetries) {
            throw new RetryError(
              `Requisição ${endpoint} falhou após ${attempt} tentativas: ${errorMessage}`,
              lastError,
              attempt
            );
          }

          continue; // Tenta novamente
        }

        // Outro erro - não retenta
        throw new Error(errorMessage);
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
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Se é um erro não retentável ou foi a última tentativa
      if (!isRetryableError(error, retryConfig.retryableStatusCodes)) {
        throw error;
      }

      // Se foi a última tentativa, lança RetryError
      if (attempt > retryConfig.maxRetries) {
        throw new RetryError(
          `Requisição ${endpoint} falhou após ${attempt} tentativas`,
          lastError,
          attempt
        );
      }

      // Continua o loop para próxima tentativa
      continue;
    }
  }

  // Nunca deve chegar aqui, mas por segurança
  throw new RetryError(
    `Requisição ${endpoint} falhou de forma inesperada`,
    lastError || new Error('Erro desconhecido'),
    retryConfig.maxRetries + 1
  );
}

/**
 * Interface pública para requisições à API
 * Suporta retry automático e timeout
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  return apiFetchWithRetry<T>(endpoint, options);
}
