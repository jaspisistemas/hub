/**
 * Utilitários de validação centralizados
 * Elimina validações duplicadas no código
 */

import { VALIDATION_PATTERNS, FILE_CONSTANTS } from '../config/constants';
import { extname } from 'path';

/**
 * Valida se uma string é um UUID v4 válido
 * @param id - String a ser validada
 * @returns true se for um UUID válido
 * 
 * @example
 * ```typescript
 * if (!isValidUUID(productId)) {
 *   throw new HttpException('ID inválido', HttpStatus.BAD_REQUEST);
 * }
 * ```
 */
export function isValidUUID(id: string): boolean {
  return VALIDATION_PATTERNS.UUID.test(id);
}

/**
 * Valida extensão de arquivo de imagem
 * @param filename - Nome do arquivo com extensão
 * @param allowSvg - Se true, permite arquivos SVG (padrão: false)
 * @returns true se a extensão for permitida
 * 
 * @example
 * ```typescript
 * if (!validateImageExtension(file.originalname)) {
 *   throw new Error('Apenas imagens são permitidas!');
 * }
 * ```
 */
export function validateImageExtension(
  filename: string,
  allowSvg: boolean = false,
): boolean {
  const ext = extname(filename).toLowerCase().replace('.', '');
  const allowedExtensions = allowSvg
    ? FILE_CONSTANTS.ALLOWED_EXTENSIONS.IMAGES_WITH_SVG
    : FILE_CONSTANTS.ALLOWED_EXTENSIONS.IMAGES;
  
  return allowedExtensions.includes(ext);
}

/**
 * Valida MIME type de arquivo de imagem
 * @param mimetype - MIME type do arquivo
 * @param allowSvg - Se true, permite SVG (padrão: false)
 * @returns true se o MIME type for permitido
 * 
 * @example
 * ```typescript
 * if (!validateImageMimeType(file.mimetype)) {
 *   throw new Error('Tipo de arquivo não permitido!');
 * }
 * ```
 */
export function validateImageMimeType(
  mimetype: string,
  allowSvg: boolean = false,
): boolean {
  const allowedMimeTypes = allowSvg
    ? FILE_CONSTANTS.ALLOWED_MIME_TYPES.IMAGES_WITH_SVG
    : FILE_CONSTANTS.ALLOWED_MIME_TYPES.IMAGES;
  
  return allowedMimeTypes.includes(mimetype);
}

/**
 * Valida se um arquivo de imagem tem extensão e MIME type válidos
 * @param filename - Nome do arquivo
 * @param mimetype - MIME type do arquivo
 * @param allowSvg - Se true, permite SVG (padrão: false)
 * @returns true se o arquivo for uma imagem válida
 * 
 * @example
 * ```typescript
 * if (!validateImageFile(file.originalname, file.mimetype)) {
 *   return callback(new Error('Apenas imagens são permitidas!'), false);
 * }
 * callback(null, true);
 * ```
 */
export function validateImageFile(
  filename: string,
  mimetype: string,
  allowSvg: boolean = false,
): boolean {
  return (
    validateImageExtension(filename, allowSvg) &&
    validateImageMimeType(mimetype, allowSvg)
  );
}

/**
 * Valida extensão de arquivo XML
 * @param filename - Nome do arquivo com extensão
 * @returns true se for .xml
 */
export function validateXmlExtension(filename: string): boolean {
  const ext = extname(filename).toLowerCase().replace('.', '');
  return FILE_CONSTANTS.ALLOWED_EXTENSIONS.XML.includes(ext);
}

/**
 * Valida MIME type de arquivo XML
 * @param mimetype - MIME type do arquivo
 * @returns true se for XML
 */
export function validateXmlMimeType(mimetype: string): boolean {
  return FILE_CONSTANTS.ALLOWED_MIME_TYPES.XML.includes(mimetype);
}

/**
 * Valida email usando regex simples
 * @param email - Email a ser validado
 * @returns true se o email for válido
 */
export function isValidEmail(email: string): boolean {
  return VALIDATION_PATTERNS.EMAIL.test(email);
}
