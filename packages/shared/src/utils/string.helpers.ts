/**
 * Funções de manipulação de strings compartilhadas
 */

import { MARKETPLACE_NAMES, ORDER_STATUS } from '../constants';

/**
 * Normaliza o nome do marketplace
 */
export function normalizeMarketplace(marketplace?: string): string {
  if (!marketplace) return MARKETPLACE_NAMES.OUTRO;
  
  const normalized = marketplace.toLowerCase().trim();
  
  if (normalized.includes('mercado') || normalized.includes('meli')) {
    return MARKETPLACE_NAMES.MERCADOLIVRE;
  }
  if (normalized.includes('shopee')) {
    return MARKETPLACE_NAMES.SHOPEE;
  }
  
  return normalized;
}

/**
 * Normaliza o status do pedido
 */
export function normalizeStatus(status?: string): string {
  if (!status) return ORDER_STATUS.PENDING;
  return status.toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Verifica se o status representa cancelamento
 */
export function matchesCancelledStatus(status?: string): boolean {
  if (!status) return false;
  const normalized = normalizeStatus(status);
  return normalized === ORDER_STATUS.CANCELLED || 
         normalized === ORDER_STATUS.CANCELED || 
         normalized === ORDER_STATUS.CANCELADO;
}

/**
 * Remove acentos de uma string
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Converte string para slug (URL-friendly)
 */
export function slugify(str: string): string {
  return removeAccents(str)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Trunca string mantendo palavras inteiras
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  
  const truncated = str.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Capitaliza primeira letra de cada palavra
 */
export function capitalizeWords(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
