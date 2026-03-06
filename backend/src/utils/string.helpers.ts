/**
 * Utilitários para normalização e manipulação de strings
 * Elimina funções duplicadas de normalização no código
 */

/**
 * Normaliza um status para comparação
 * Remove espaços extras e converte para lowercase
 * 
 * @param value - Status a ser normalizado
 * @returns String normalizada ou string vazia se undefined/null
 * 
 * @example
 * ```typescript
 * const normalized = normalizeStatus('  PENDING  '); // 'pending'
 * const normalized = normalizeStatus(undefined); // ''
 * ```
 */
export function normalizeStatus(value?: string): string {
  return (value || '').toLowerCase().trim();
}

/**
 * Normaliza um nome de marketplace para comparação
 * Remove caracteres não-alfanuméricos e converte para lowercase
 * 
 * @param value - Nome do marketplace
 * @returns String normalizada (apenas letras e números) ou string vazia
 * 
 * @example
 * ```typescript
 * const normalized = normalizeMarketplace('Mercado Livre'); // 'mercadolivre'
 * const normalized = normalizeMarketplace('shopee.com.br'); // 'shopeeecombr'
 * ```
 */
export function normalizeMarketplace(value?: string): string {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Verifica se um status corresponde a "cancelado"
 * Aceita múltiplas variações: cancelled, canceled, cancelado
 * 
 * @param status - Status a ser verificado
 * @returns true se o status indicar cancelamento
 * 
 * @example
 * ```typescript
 * matchesCancelledStatus('CANCELLED'); // true
 * matchesCancelledStatus('canceled'); // true
 * matchesCancelledStatus('Cancelado'); // true
 * matchesCancelledStatus('pending'); // false
 * ```
 */
export function matchesCancelledStatus(status?: string): boolean {
  const normalized = normalizeStatus(status);
  return (
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'cancelado'
  );
}

/**
 * Trunca uma string adicionando reticências se ultrapassar o limite
 * 
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo (padrão: 50)
 * @returns String truncada com '...' se necessário
 * 
 * @example
 * ```typescript
 * truncateString('Lorem ipsum dolor sit amet', 10); // 'Lorem ipsu...'
 * truncateString('Short', 10); // 'Short'
 * ```
 */
export function truncateString(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza a primeira letra de cada palavra
 * 
 * @param text - Texto a ser capitalizado
 * @returns String com primeira letra de cada palavra em maiúscula
 * 
 * @example
 * ```typescript
 * capitalizeWords('mercado livre'); // 'Mercado Livre'
 * capitalizeWords('john doe'); // 'John Doe'
 * ```
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Remove acentos de uma string (útil para buscas)
 * 
 * @param text - Texto com acentos
 * @returns String sem acentos
 * 
 * @example
 * ```typescript
 * removeAccents('José María'); // 'Jose Maria'
 * removeAccents('São Paulo'); // 'Sao Paulo'
 * ```
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gera um slug a partir de um texto
 * 
 * @param text - Texto original
 * @returns Slug (lowercase, sem acentos, separado por hífens)
 * 
 * @example
 * ```typescript
 * slugify('Meu Produto Incrível!'); // 'meu-produto-incrivel'
 * slugify('São Paulo - Brasil'); // 'sao-paulo-brasil'
 * ```
 */
export function slugify(text: string): string {
  return removeAccents(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
