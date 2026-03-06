/**
 * Utilitários para manipulação de arquivos
 * Centraliza lógica duplicada de operações com arquivos
 */

import * as fs from 'fs';
import * as path from 'path';
import { FILE_CONSTANTS } from '../config/constants';

/**
 * Constrói o caminho completo de um arquivo a partir do caminho relativo
 * @param relativePath - Caminho relativo do arquivo (ex: './uploads/avatars/file.jpg')
 * @returns Caminho absoluto completo
 * 
 * @example
 * ```typescript
 * const fullPath = buildFullPath(invoice.pdfUrl);
 * // Retorna: /workspace/uploads/invoices/invoice-123.pdf
 * ```
 */
export function buildFullPath(relativePath: string): string {
  return path.join(process.cwd(), relativePath);
}

/**
 * Deleta um arquivo se ele existir
 * @param relativePath - Caminho relativo do arquivo
 * @returns Promise que resolve quando o arquivo for deletado (ou se não existir)
 * 
 * @example
 * ```typescript
 * await deleteFile(invoice.pdfUrl);
 * await deleteFile('./uploads/avatars/old-avatar.jpg');
 * ```
 */
export async function deleteFile(relativePath: string): Promise<void> {
  const fullPath = buildFullPath(relativePath);
  
  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
  }
}

/**
 * Deleta um arquivo de forma síncrona se ele existir
 * @param relativePath - Caminho relativo do arquivo
 * 
 * @example
 * ```typescript
 * deleteFileSync(product.imageUrl);
 * ```
 */
export function deleteFileSync(relativePath: string): void {
  const fullPath = buildFullPath(relativePath);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

/**
 * Constrói a URL pública para acesso a um arquivo uploadado
 * @param folder - Tipo de upload (avatars, company-logos, invoices, products)
 * @param filename - Nome do arquivo
 * @returns URL relativa para acesso público (ex: '/uploads/avatars/file.jpg')
 * 
 * @example
 * ```typescript
 * const avatarUrl = buildUploadUrl('avatars', 'avatar-123.jpg');
 * // Retorna: '/uploads/avatars/avatar-123.jpg'
 * 
 * const logoUrl = buildUploadUrl('company-logos', 'logo-456.png');
 * // Retorna: '/uploads/company-logos/logo-456.png'
 * ```
 */
export function buildUploadUrl(
  folder: keyof typeof FILE_CONSTANTS.UPLOAD_URLS,
  filename: string,
): string {
  const baseUrl = FILE_CONSTANTS.UPLOAD_URLS[folder];
  return `${baseUrl}${filename}`;
}

/**
 * Verifica se um arquivo existe
 * @param relativePath - Caminho relativo do arquivo
 * @returns true se o arquivo existir
 * 
 * @example
 * ```typescript
 * if (fileExists(oldImagePath)) {
 *   await deleteFile(oldImagePath);
 * }
 * ```
 */
export function fileExists(relativePath: string): boolean {
  const fullPath = buildFullPath(relativePath);
  return fs.existsSync(fullPath);
}

/**
 * Garante que um diretório existe, criando-o se necessário
 * @param dirPath - Caminho do diretório
 * 
 * @example
 * ```typescript
 * ensureDirectoryExists('./uploads/temp');
 * ```
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
