import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerInvoiceConfig = {
  storage: diskStorage({
    destination: './uploads/invoices',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `invoice-${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),
  fileFilter: (req: any, file: any, callback: any) => {
    if (!file.originalname.match(/\.(pdf|xml)$/i)) {
      return callback(new Error('Apenas arquivos PDF ou XML são permitidos!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
