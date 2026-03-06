/**
 * Funções de validação para formulários
 * Re-exporta validações comuns de @hub/shared + validações específicas do frontend
 */

// Re-exporta validações do package compartilhado
export {
  isValidEmail,
  isValidPhone,
  isValidCPF,
  isValidCNPJ,
  isValidURL,
} from '@hub/shared';

/**
 * Valida se uma senha atende aos critérios mínimos
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }
  
  // Mínimo 6 caracteres, pelo menos uma letra e um número
  const hasMinLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasMinLength && hasLetter && hasNumber;
}

/**
 * Valida se um campo é obrigatório (não vazio)
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
}

/**
 * Valida se um número está dentro de um intervalo
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Mensagens de validação padronizadas
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Telefone inválido. Use o formato (11) 98765-4321',
  INVALID_PASSWORD: 'Senha deve ter no mínimo 6 caracteres, incluindo letras e números',
  INVALID_CPF: 'CPF inválido',
  INVALID_CNPJ: 'CNPJ inválido',
  INVALID_URL: 'URL inválida',
  MIN_LENGTH: (min: number) => `Deve ter no mínimo ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Deve ter no máximo ${max} caracteres`,
  MIN_VALUE: (min: number) => `Deve ser no mínimo ${min}`,
  MAX_VALUE: (max: number) => `Deve ser no máximo ${max}`,
} as const;
