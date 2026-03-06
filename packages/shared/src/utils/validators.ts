/**
 * Funções de validação compartilhadas
 */

import { VALIDATION_PATTERNS } from '../constants';

export function isValidUUID(value: string): boolean {
  return VALIDATION_PATTERNS.UUID.test(value);
}

export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return VALIDATION_PATTERNS.PHONE_BR.test(cleaned);
}

export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (!VALIDATION_PATTERNS.CPF.test(cleaned)) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (!VALIDATION_PATTERNS.CNPJ.test(cleaned)) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(12))) return false;

  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cleaned.charAt(13))) return false;

  return true;
}

export function isValidURL(url: string): boolean {
  return VALIDATION_PATTERNS.URL.test(url);
}
