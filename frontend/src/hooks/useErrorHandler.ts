/**
 * Hook customizado para tratamento de erros
 * Extrai mensagens de erro de forma consistente
 */

import { useCallback } from 'react';

/**
 * Estrutura de resposta de erro da API
 */
interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      statusCode?: number;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
}

/**
 * Hook para tratamento consistente de erros
 * 
 * @returns Função para extrair mensagem de erro
 * 
 * @example
 * ```typescript
 * const { handleError } = useErrorHandler();
 * 
 * try {
 *   await productsService.create(data);
 * } catch (err) {
 *   const message = handleError(err);
 *   setError(message);
 *   showNotification(message, 'error');
 * }
 * ```
 */
export function useErrorHandler() {
  /**
   * Extrai mensagem de erro de diferentes formatos
   * 
   * @param err - Erro capturado
   * @param defaultMessage - Mensagem padrão se não conseguir extrair (padrão: 'Erro desconhecido')
   * @returns Mensagem de erro formatada
   */
  const handleError = useCallback((err: unknown, defaultMessage: string = 'Erro desconhecido'): string => {
    // Se é uma string, retorna diretamente
    if (typeof err === 'string') {
      return err;
    }

    // Se é um erro JavaScript padrão
    if (err instanceof Error) {
      // Verifica se tem resposta da API (Axios ou fetch)
      const apiError = err as ApiError;
      
      if (apiError.response?.data?.message) {
        return apiError.response.data.message;
      }
      
      if (apiError.response?.data?.error) {
        return apiError.response.data.error;
      }
      
      if (apiError.response?.statusText) {
        return apiError.response.statusText;
      }
      
      // Retorna a mensagem do erro
      return err.message || defaultMessage;
    }

    // Se é um objeto com mensagem
    if (typeof err === 'object' && err !== null) {
      const objError = err as any;
      
      if (objError.message) {
        return objError.message;
      }
      
      if (objError.error) {
        return objError.error;
      }
      
      if (objError.response?.data?.message) {
        return objError.response.data.message;
      }
    }

    // Fallback para mensagem padrão
    return defaultMessage;
  }, []);

  /**
   * Extrai código de status HTTP do erro
   * 
   * @param err - Erro capturado
   * @returns Código de status HTTP ou null
   */
  const getStatusCode = useCallback((err: unknown): number | null => {
    if (typeof err === 'object' && err !== null) {
      const apiError = err as ApiError;
      
      if (apiError.response?.data?.statusCode) {
        return apiError.response.data.statusCode;
      }
      
      if (apiError.response?.status) {
        return apiError.response.status;
      }
    }
    
    return null;
  }, []);

  /**
   * Verifica se é um erro de autenticação (401)
   * 
   * @param err - Erro capturado
   * @returns true se for erro 401
   */
  const isAuthError = useCallback((err: unknown): boolean => {
    const status = getStatusCode(err);
    return status === 401;
  }, [getStatusCode]);

  /**
   * Verifica se é um erro de permissão (403)
   * 
   * @param err - Erro capturado
   * @returns true se for erro 403
   */
  const isForbiddenError = useCallback((err: unknown): boolean => {
    const status = getStatusCode(err);
    return status === 403;
  }, [getStatusCode]);

  /**
   * Verifica se é um erro de não encontrado (404)
   * 
   * @param err - Erro capturado
   * @returns true se for erro 404
   */
  const isNotFoundError = useCallback((err: unknown): boolean => {
    const status = getStatusCode(err);
    return status === 404;
  }, [getStatusCode]);

  /**
   * Verifica se é um erro de validação (400)
   * 
   * @param err - Erro capturado
   * @returns true se for erro 400
   */
  const isValidationError = useCallback((err: unknown): boolean => {
    const status = getStatusCode(err);
    return status === 400;
  }, [getStatusCode]);

  return {
    handleError,
    getStatusCode,
    isAuthError,
    isForbiddenError,
    isNotFoundError,
    isValidationError,
  };
}

/**
 * Mensagens de erro padrão para códigos HTTP comuns
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos. Verifique as informações e tente novamente.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito. Este recurso já existe.',
  422: 'Dados não processáveis. Verifique as informações.',
  429: 'Muitas requisições. Aguarde alguns segundos e tente novamente.',
  500: 'Erro no servidor. Tente novamente mais tarde.',
  502: 'Serviço temporariamente indisponível.',
  503: 'Serviço em manutenção. Tente novamente mais tarde.',
};

/**
 * Retorna mensagem de erro amigável baseada no código HTTP
 * 
 * @param statusCode - Código de status HTTP
 * @returns Mensagem amigável
 */
export function getHttpErrorMessage(statusCode: number): string {
  return HTTP_ERROR_MESSAGES[statusCode] || `Erro ${statusCode}. Tente novamente.`;
}
