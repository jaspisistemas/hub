/**
 * Configuração centralizada para uploads usando Multer
 * Elimina duplicação de configurações de upload em múltiplos controllers
 */

import { diskStorage } from 'multer';
import { extname } from 'path';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { FILE_CONSTANTS } from './constants';
import { validateImageFile, validateXmlExtension, validateXmlMimeType } from '../utils/validators';

/**
 * Tipo de upload suportado
 */
export type UploadType = 'avatars' | 'company-logos' | 'invoices' | 'products';

/**
 * Gera nome único para arquivo
 * @param prefix - Prefixo do arquivo (ex: 'avatar', 'logo', 'invoice')
 * @param file - Arquivo original
 * @returns Nome único com timestamp e sufixo aleatório
 */
function generateUniqueFilename(prefix: string, file: Express.Multer.File): string {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = extname(file.originalname);
  return `${prefix}-${uniqueSuffix}${ext}`;
}

/**
 * Cria configuração de multer para upload de imagens
 * @param uploadType - Tipo de upload (avatars, company-logos, products)
 * @param allowSvg - Se true, permite arquivos SVG (padrão: false)
 * @returns Configuração completa do Multer
 * 
 * @example
 * ```typescript
 * // Em um controller:
 * @UseInterceptors(FileInterceptor('file', createImageUploadConfig('avatars')))
 * async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
 *   // ...
 * }
 * ```
 */
export function createImageUploadConfig(
  uploadType: Extract<UploadType, 'avatars' | 'company-logos' | 'products'>,
  allowSvg: boolean = false,
): MulterOptions {
  // Mapeamento de tipo para prefixo de arquivo e destino
  const config = {
    avatars: {
      prefix: 'avatar',
      destination: FILE_CONSTANTS.UPLOAD_PATHS.AVATARS,
    },
    'company-logos': {
      prefix: 'logo',
      destination: FILE_CONSTANTS.UPLOAD_PATHS.COMPANY_LOGOS,
    },
    products: {
      prefix: 'product',
      destination: FILE_CONSTANTS.UPLOAD_PATHS.PRODUCTS,
    },
  };

  const { prefix, destination } = config[uploadType];

  return {
    storage: diskStorage({
      destination,
      filename: (req, file, callback) => {
        const filename = generateUniqueFilename(prefix, file);
        callback(null, filename);
      },
    }),
    fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
      // Valida extensão e MIME type
      if (!validateImageFile(file.originalname, file.mimetype, allowSvg)) {
        const allowedExtensions = allowSvg
          ? FILE_CONSTANTS.ALLOWED_EXTENSIONS.IMAGES_WITH_SVG.join(', ')
          : FILE_CONSTANTS.ALLOWED_EXTENSIONS.IMAGES.join(', ');
        
        return callback(
          new Error(`Apenas imagens são permitidas (${allowedExtensions})`),
          false,
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: FILE_CONSTANTS.FILE_SIZE_LIMIT,
    },
  };
}

/**
 * Cria configuração de multer para upload de XML (invoices)
 * @returns Configuração completa do Multer para arquivos XML
 * 
 * @example
 * ```typescript
 * @UseInterceptors(FileInterceptor('file', createXmlUploadConfig()))
 * async uploadInvoice(@UploadedFile() file: Express.Multer.File) {
 *   // ...
 * }
 * ```
 */
export function createXmlUploadConfig(): MulterOptions {
  return {
    storage: diskStorage({
      destination: FILE_CONSTANTS.UPLOAD_PATHS.INVOICES,
      filename: (req, file, callback) => {
        const filename = generateUniqueFilename('invoice', file);
        callback(null, filename);
      },
    }),
    fileFilter: (req: any, file: Express.Multer.File, callback: any) => {
      // Valida extensão e MIME type XML
      if (
        !validateXmlExtension(file.originalname) ||
        !validateXmlMimeType(file.mimetype)
      ) {
        return callback(
          new Error('Apenas arquivos XML são permitidos'),
          false,
        );
      }
      callback(null, true);
    },
    limits: {
      fileSize: FILE_CONSTANTS.FILE_SIZE_LIMIT,
    },
  };
}

/**
 * Configuração de multer para múltiplas imagens (ex: galeria de produtos)
 * @param uploadType - Tipo de upload
 * @param maxCount - Número máximo de arquivos (padrão: 10)
 * @param allowSvg - Se true, permite SVG (padrão: false)
 * @returns Configuração do Multer
 */
export function createMultipleImagesUploadConfig(
  uploadType: Extract<UploadType, 'avatars' | 'company-logos' | 'products'>,
  maxCount: number = 10,
  allowSvg: boolean = false,
): MulterOptions & { maxCount: number } {
  return {
    ...createImageUploadConfig(uploadType, allowSvg),
    maxCount,
  };
}
