/**
 * Funções utilitárias de formatação
 * Re-exporta funções comuns de @hub/shared + funções específicas do frontend
 */

// Re-exporta funções comuns do package compartilhado
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatDocument,
  truncateText,
  formatOrderId,
} from '@hub/shared';

/**
 * Formata um ID curto com prefixo # para exibição
 */
export function formatShortId(id: string, length: number = 6): string {
  if (!id) return '-';
  return `#${id.substring(0, length)}`;
}

/**
 * Copia texto para a área de transferência do navegador
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
    return;
  }
  
  await navigator.clipboard.writeText(text);
}
