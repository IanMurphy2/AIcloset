import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import config from '../../Config';
import { expressAuthentication } from '../middlewares/authentication';
import { HttpError } from '../../lib/errors/HttpError';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export function createUploadRouter(): Router {
  const router = Router();
  const uploadDir = config.get('upload.dir') as string;
  const maxSize = config.get('upload.maxSizeBytes') as number;
  const allowedMimes = config.get('upload.allowedMimeTypes') as string[];

  const authMiddleware = async (req: Request, _res: Response, next: (err?: any) => void) => {
    try {
      (req as any).user = await expressAuthentication(req, 'jwt');
      next();
    } catch (err) {
      next(err);
    }
  };

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const ext = MIME_EXT[file.mimetype] || path.extname(file.originalname) || '.bin';
      cb(null, `${randomUUID()}${ext}`);
    },
  });

  const upload = multer({
    storage,
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new HttpError(400, `Invalid file type. Allowed: ${allowedMimes.join(', ')}`));
      }
    },
  });

  router.post(
    '/upload',
    authMiddleware,
    (req: Request, res: Response, next: (err?: any) => void) => {
      upload.single('image')(req, res, (err: any) => {
        if (err) {
          if (err instanceof HttpError) return next(err);
          if (err.code === 'LIMIT_FILE_SIZE') return next(new HttpError(400, 'File too large'));
          return next(err);
        }
        next();
      });
    },
    (req: Request, res: Response) => {
      if (!req.file) {
        throw new HttpError(400, 'No image file provided. Use field name "image".');
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      res.status(201).json({ imageUrl });
    }
  );

  return router;
}
