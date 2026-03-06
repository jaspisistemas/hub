/**
 * Helpers para status de pedidos e atendimentos
 * Re-exporta funções comuns de @hub/shared + mapeamentos UI específicos
 */

// Re-exporta funções de normalização do package compartilhado
export {
  normalizeStatus,
  normalizeMarketplace,
  matchesCancelledStatus,
} from '@hub/shared';

/**
 * Configuração de badge de marketplace
 */
export interface MarketplaceBadge {
  label: string;
  text: string;
  bg: string;
  color: string;
}

/**
 * Mapeamento de status para labels em português
 */
const STATUS_LABELS: Record<string, string> = {
  // Pedidos
  pending: 'Pendente',
  paid: 'Pago',
  approved: 'Aprovado',
  processing: 'Processando',
  shipped: 'Enviado',
  delivered: 'Entregue',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  cancelado: 'Cancelado',
  refunded: 'Reembolsado',
  failed: 'Falhou',
  
  // Atendimentos
  unanswered: 'Não Respondido',
  answered: 'Respondido',
  closed: 'Fechado',
  open: 'Aberto',
  
  // Genérico
  active: 'Ativo',
  inactive: 'Inativo',
};

/**
 * Mapeamento de status para cores (MUI)
 */
const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  // Pendentes/Em aberto
  pending: 'warning',
  processing: 'info',
  open: 'warning',
  unanswered: 'error',
  
  // Sucesso
  paid: 'success',
  approved: 'success',
  delivered: 'success',
  completed: 'success',
  answered: 'success',
  closed: 'success',
  active: 'success',
  
  // Em trânsito
  shipped: 'info',
  
  // Cancelados/Erros
  cancelled: 'error',
  canceled: 'error',
  cancelado: 'error',
  failed: 'error',
  refunded: 'error',
  inactive: 'default',
};

/**
 * Retorna o label traduzido para um status
 * 
 * @param status - Status original (em inglês ou português)
 * @returns Label em português ou o status original se não encontrado
 * 
 * @example
 * ```typescript
 * getStatusLabel('paid'); // "Pago"
 * getStatusLabel('cancelled'); // "Cancelado"
 * getStatusLabel('custom_status'); // "custom_status"
 * ```
 */
export function getStatusLabel(status: string): string {
  if (!status) return '-';
  
  const normalized = status.toLowerCase().trim();
  return STATUS_LABELS[normalized] || status;
}

/**
 * Retorna a cor apropriada para um status
 * 
 * @param status - Status do pedido/atendimento
 * @returns Nome da cor do MUI
 * 
 * @example
 * ```typescript
 * getStatusColor('paid'); // "success"
 * getStatusColor('pending'); // "warning"
 * getStatusColor('cancelled'); // "error"
 * ```
 */
export function getStatusColor(
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' {
  if (!status) return 'default';
  
  const normalized = status.toLowerCase().trim();
  return STATUS_COLORS[normalized] || 'default';
}

/**
 * Retorna configuração de badge para um marketplace
 * 
 * @param marketplace - Nome do marketplace
 * @returns Configuração do badge (label, texto, cores)
 * 
 * @example
 * ```typescript
 * const badge = getMarketplaceBadge('mercado_livre');
 * // { label: 'Mercado Livre', text: 'ML', bg: '#fff3c2', color: '#1e3a8a' }
 * 
 * const badge = getMarketplaceBadge('shopee');
 * // { label: 'Shopee', text: 'SH', bg: '#ffe1d6', color: '#9a3412' }
 * ```
 */
export function getMarketplaceBadge(marketplace?: string): MarketplaceBadge {
  if (!marketplace) {
    return {
      label: 'Desconhecido',
      text: '?',
      bg: '#e5e7eb',
      color: '#6b7280',
    };
  }
  
  // Normaliza para comparação (lowercase, remove espaços e caracteres especiais)
  const normalized = marketplace
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  
  // Mercado Livre
  if (normalized.includes('mercado') || normalized.includes('meli')) {
    return {
      label: 'Mercado Livre',
      text: 'ML',
      bg: '#fff3c2',
      color: '#1e3a8a',
    };
  }
  
  // Shopee
  if (normalized.includes('shopee')) {
    return {
      label: 'Shopee',
      text: 'SH',
      bg: '#ffe1d6',
      color: '#9a3412',
    };
  }
  
  // Amazon
  if (normalized.includes('amazon')) {
    return {
      label: 'Amazon',
      text: 'AM',
      bg: '#fef3c7',
      color: '#92400e',
    };
  }
  
  // Magalu
  if (normalized.includes('magalu') || normalized.includes('magazineluiza')) {
    return {
      label: 'Magalu',
      text: 'MG',
      bg: '#dbeafe',
      color: '#1e3a8a',
    };
  }
  
  // B2W (Americanas, Submarino, Shoptime)
  if (normalized.includes('b2w') || normalized.includes('americanas') || 
      normalized.includes('submarino') || normalized.includes('shoptime')) {
    return {
      label: 'B2W',
      text: 'B2W',
      bg: '#fce7f3',
      color: '#9f1239',
    };
  }
  
  // Via Varejo (Casas Bahia, Ponto Frio)
  if (normalized.includes('casasbahia') || normalized.includes('pontofrio') || 
      normalized.includes('viavarejo') || normalized.includes('via')) {
    return {
      label: 'Via',
      text: 'VIA',
      bg: '#e0e7ff',
      color: '#3730a3',
    };
  }
  
  // Outros/Genérico
  return {
    label: marketplace,
    text: marketplace.substring(0, 2).toUpperCase(),
    bg: '#e5e7eb',
    color: '#374151',
  };
}

/**
 * Retorna o label traduzido para uma origem de atendimento
 * 
 * @param origin - Origem do atendimento
 * @returns Label em português
 * 
 * @example
 * ```typescript
 * getOriginLabel('mercado_livre'); // "Mercado Livre"
 * getOriginLabel('shopee'); // "Shopee"
 * ```
 */
export function getOriginLabel(origin: string): string {
  const badge = getMarketplaceBadge(origin);
  return badge.label;
}

/**
 * Verifica se um status representa um cancelamento
 * 
 * @param status - Status a verificar
 * @returns true se o status indicar cancelamento
 * 
 * @example
 * ```typescript
 * isCancelledStatus('cancelled'); // true
 * isCancelledStatus('canceled'); // true
 * isCancelledStatus('cancelado'); // true
 * isCancelledStatus('paid'); // false
 * ```
 */
export function isCancelledStatus(status?: string): boolean {
  if (!status) return false;
  
  const normalized = status.toLowerCase().trim();
  return (
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'cancelado'
  );
}

/**
 * Retorna ícone emoji apropriado para um status
 * 
 * @param status - Status do pedido
 * @returns Emoji representativo
 */
export function getStatusEmoji(status: string): string {
  const normalized = status.toLowerCase().trim();
  
  if (normalized === 'pending') return '⏳';
  if (normalized === 'paid' || normalized === 'approved') return '✅';
  if (normalized === 'processing') return '⚙️';
  if (normalized === 'shipped') return '🚚';
  if (normalized === 'delivered' || normalized === 'completed') return '📦';
  if (isCancelledStatus(normalized)) return '❌';
  if (normalized === 'refunded') return '💰';
  
  return '📋';
}
