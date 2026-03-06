/**
 * Constantes globais compartilhadas entre backend e frontend
 */

export const DATE_CONSTANTS = {
  DEFAULT_DATE_RANGE_DAYS: 30,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_MINUTE: 60 * 1000,
} as const;

export const VALIDATION_PATTERNS = {
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_BR: /^\d{10,11}$/,
  CPF: /^\d{11}$/,
  CNPJ: /^\d{14}$/,
  URL: /^https?:\/\/.+/i,
} as const;

export const MARKETPLACE_NAMES = {
  MERCADOLIVRE: 'mercadolivre',
  MERCADO_LIVRE: 'mercado_livre',
  SHOPEE: 'shopee',
  OUTRO: 'outro',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PREPARING: 'preparing',
  READY_TO_SHIP: 'ready_to_ship',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  CANCELED: 'canceled',
  CANCELADO: 'cancelado',
} as const;
