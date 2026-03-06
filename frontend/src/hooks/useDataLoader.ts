/**
 * Hook customizado para carregamento de dados
 * Elimina padrão duplicado de loading/error/data em múltiplas páginas
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Opções para configuração do hook
 */
export interface UseDataLoaderOptions<T> {
  /** Se true, carrega dados automaticamente no mount (padrão: true) */
  autoLoad?: boolean;
  
  /** Callback executado após sucesso no carregamento */
  onSuccess?: (data: T) => void;
  
  /** Callback executado após erro no carregamento */
  onError?: (error: Error) => void;
  
  /** Dependências para recarregar dados automaticamente */
  dependencies?: any[];
}

/**
 * Estado retornado pelo hook
 */
export interface UseDataLoaderResult<T> {
  /** Dados carregados */
  data: T | null;
  
  /** Se está carregando */
  loading: boolean;
  
  /** Mensagem de erro, se houver */
  error: string | null;
  
  /** Função para recarregar dados */
  refetch: (silent?: boolean) => Promise<void>;
  
  /** Função para atualizar dados manualmente */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  
  /** Função para limpar erro */
  clearError: () => void;
}

/**
 * Hook para gerenciar carregamento de dados com loading/error/refetch
 * 
 * @param fetchFn - Função assíncrona que retorna os dados
 * @param options - Opções de configuração
 * @returns Estado e funções para gerenciar o carregamento
 * 
 * @example
 * ```typescript
 * // Uso básico
 * const { data, loading, error, refetch } = useDataLoader(
 *   () => productsService.getAll()
 * );
 * 
 * // Com callbacks
 * const { data, loading, error } = useDataLoader(
 *   () => ordersService.getAll(),
 *   {
 *     onSuccess: (orders) => console.log('Loaded', orders.length, 'orders'),
 *     onError: (err) => showNotification(err.message, 'error'),
 *   }
 * );
 * 
 * // Sem auto-load (carregamento manual)
 * const { data, loading, refetch } = useDataLoader(
 *   () => analyticsService.getDashboard(),
 *   { autoLoad: false }
 * );
 * 
 * // Com dependências (recarrega quando mudarem)
 * const { data, loading } = useDataLoader(
 *   () => ordersService.getByStore(storeId),
 *   { dependencies: [storeId] }
 * );
 * ```
 */
export function useDataLoader<T = any>(
  fetchFn: () => Promise<T>,
  options: UseDataLoaderOptions<T> = {}
): UseDataLoaderResult<T> {
  const {
    autoLoad = true,
    onSuccess,
    onError,
    dependencies = [],
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  /**
   * Função para carregar dados
   * @param silent - Se true, não exibe loading spinner (útil para refresh em background)
   */
  const loadData = useCallback(
    async (silent: boolean = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setError(null);

        const result = await fetchFn();
        setData(result);

        if (onSuccess) {
          onSuccess(result);
        }
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Erro ao carregar dados';
        
        setError(errorMessage);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [fetchFn, onSuccess, onError]
  );

  // Carrega dados automaticamente no mount ou quando dependências mudarem
  useEffect(() => {
    if (autoLoad) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, ...dependencies]);

  /**
   * Limpa mensagem de erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: loadData,
    setData,
    clearError,
  };
}
