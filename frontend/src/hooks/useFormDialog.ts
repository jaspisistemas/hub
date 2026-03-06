/**
 * Hook customizado para gerenciar estado de diálogos com formulários
 * Elimina padrão duplicado de open/close/saving em múltiplas páginas
 */

import { useState, useCallback } from 'react';

/**
 * Opções para configuração do hook
 */
export interface UseFormDialogOptions<T> {
  /** Valores iniciais padrão do formulário */
  defaultValues?: Partial<T>;
  
  /** Callback executado antes de salvar (validação adicional) */
  onBeforeSave?: (data: T) => boolean | Promise<boolean>;
  
  /** Callback executado após salvar com sucesso */
  onSuccess?: (data: T) => void;
  
  /** Callback executado após erro ao salvar */
  onError?: (error: Error) => void;
}

/**
 * Estado retornado pelo hook
 */
export interface UseFormDialogResult<T> {
  /** Se o diálogo está aberto */
  open: boolean;
  
  /** Dados do formulário */
  formData: Partial<T>;
  
  /** Se está salvando */
  saving: boolean;
  
  /** Mensagem de erro, se houver */
  error: string | null;
  
  /** Abre o diálogo (para criar ou editar) */
  handleOpen: (item?: Partial<T>) => void;
  
  /** Fecha o diálogo e reseta o formulário */
  handleClose: () => void;
  
  /** Atualiza um campo do formulário */
  handleChange: (field: keyof T, value: any) => void;
  
  /** Atualiza múltiplos campos do formulário */
  setFormData: React.Dispatch<React.SetStateAction<Partial<T>>>;
  
  /** Salva o formulário (executa função de save fornecida) */
  handleSave: (saveFn: (data: Partial<T>) => Promise<any>) => Promise<void>;
  
  /** Limpa mensagem de erro */
  clearError: () => void;
}

/**
 * Hook para gerenciar estado de diálogos com formulários
 * 
 * @param options - Opções de configuração
 * @returns Estado e funções para gerenciar o diálogo
 * 
 * @example
 * ```typescript
 * interface Product {
 *   id?: string;
 *   name: string;
 *   price: number;
 *   stock: number;
 * }
 * 
 * // Uso básico
 * const dialog = useFormDialog<Product>({
 *   defaultValues: { name: '', price: 0, stock: 0 }
 * });
 * 
 * // Abrir para criar
 * <Button onClick={() => dialog.handleOpen()}>
 *   Criar Produto
 * </Button>
 * 
 * // Abrir para editar
 * <Button onClick={() => dialog.handleOpen(product)}>
 *   Editar
 * </Button>
 * 
 * // Formulário dentro do diálogo
 * <Dialog open={dialog.open} onClose={dialog.handleClose}>
 *   <TextField
 *     value={dialog.formData.name || ''}
 *     onChange={(e) => dialog.handleChange('name', e.target.value)}
 *   />
 *   <Button
 *     onClick={() => dialog.handleSave(
 *       (data) => productsService.create(data)
 *     )}
 *     disabled={dialog.saving}
 *   >
 *     {dialog.saving ? 'Salvando...' : 'Salvar'}
 *   </Button>
 * </Dialog>
 * 
 * // Com validação customizada
 * const dialog = useFormDialog<Product>({
 *   defaultValues: { name: '', price: 0 },
 *   onBeforeSave: (data) => {
 *     if (!data.name) {
 *       alert('Nome é obrigatório');
 *       return false;
 *     }
 *     return true;
 *   },
 *   onSuccess: () => {
 *     showNotification('Produto salvo!', 'success');
 *     refetchProducts();
 *   },
 * });
 * ```
 */
export function useFormDialog<T = any>(
  options: UseFormDialogOptions<T> = {}
): UseFormDialogResult<T> {
  const {
    defaultValues = {} as Partial<T>,
    onBeforeSave,
    onSuccess,
    onError,
  } = options;

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Abre o diálogo
   * @param item - Se fornecido, popula o formulário para edição
   */
  const handleOpen = useCallback(
    (item?: Partial<T>) => {
      if (item) {
        setFormData({ ...defaultValues, ...item });
      } else {
        setFormData(defaultValues);
      }
      setError(null);
      setOpen(true);
    },
    [defaultValues]
  );

  /**
   * Fecha o diálogo e reseta o formulário
   */
  const handleClose = useCallback(() => {
    setOpen(false);
    setFormData(defaultValues);
    setError(null);
    setSaving(false);
  }, [defaultValues]);

  /**
   * Atualiza um campo específico do formulário
   * @param field - Nome do campo
   * @param value - Novo valor
   */
  const handleChange = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Salva o formulário executando a função de save fornecida
   * @param saveFn - Função assíncrona que salva os dados
   */
  const handleSave = useCallback(
    async (saveFn: (data: Partial<T>) => Promise<any>) => {
      try {
        setSaving(true);
        setError(null);

        // Validação customizada antes de salvar
        if (onBeforeSave) {
          const canSave = await onBeforeSave(formData as T);
          if (!canSave) {
            setSaving(false);
            return;
          }
        }

        // Executa a função de save
        await saveFn(formData);

        // Callback de sucesso
        if (onSuccess) {
          onSuccess(formData as T);
        }

        // Fecha o diálogo
        handleClose();
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Erro ao salvar';
        
        setError(errorMessage);

        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
      } finally {
        setSaving(false);
      }
    },
    [formData, onBeforeSave, onSuccess, onError, handleClose]
  );

  /**
   * Limpa mensagem de erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    open,
    formData,
    saving,
    error,
    handleOpen,
    handleClose,
    handleChange,
    setFormData,
    handleSave,
    clearError,
  };
}
