/**
 * Constantes globais da aplicação
 * Centraliza valores hardcoded repetidos no código
 */

/**
 * Configurações relacionadas a datas e períodos
 */
export const DATE_CONSTANTS = {
  /** Período padrão em dias para consultas históricas (usado em analytics, orders, support) */
  DEFAULT_DATE_RANGE_DAYS: 30,
  
  /** Milissegundos em um dia */
  MS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Configurações relacionadas a uploads de arquivos
 */
export const FILE_CONSTANTS = {
  /** Limite de tamanho de arquivo: 5MB */
  FILE_SIZE_LIMIT: 5 * 1024 * 1024,
  
  /** Caminhos relativos para diferentes tipos de upload */
  UPLOAD_PATHS: {
    AVATARS: './uploads/avatars',
    COMPANY_LOGOS: './uploads/company-logos',
    INVOICES: './uploads/invoices',
    PRODUCTS: './uploads',
  } as const,
  
  /** URLs públicas para acesso aos uploads */
  UPLOAD_URLS: {
    AVATARS: '/uploads/avatars/',
    COMPANY_LOGOS: '/uploads/company-logos/',
    INVOICES: '/uploads/invoices/',
    PRODUCTS: '/uploads/',
  } as const,
  
  /** Extensões permitidas para diferentes tipos de arquivo */
  ALLOWED_EXTENSIONS: {
    IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as readonly string[],
    IMAGES_WITH_SVG: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] as readonly string[],
    XML: ['xml'] as readonly string[],
  },
  
  /** MIME types permitidos */
  ALLOWED_MIME_TYPES: {
    IMAGES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ] as readonly string[],
    IMAGES_WITH_SVG: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ] as readonly string[],
    XML: ['application/xml', 'text/xml'] as readonly string[],
  },
} as const;

/**
 * Padrões de validação
 */
export const VALIDATION_PATTERNS = {
  /** Regex para validação de UUID v4 */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  /** Regex para validação de email */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

/**
 * Configurações de paginação
 */
export const PAGINATION_CONSTANTS = {
  /** Número padrão de itens por página */
  DEFAULT_PAGE_SIZE: 10,
  
  /** Número máximo de itens por página */
  MAX_PAGE_SIZE: 100,
} as const;
