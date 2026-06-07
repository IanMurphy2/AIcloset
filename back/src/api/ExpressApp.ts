import express, { json, urlencoded, Response as ExResponse, Request as ExRequest, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import { mkdirSync } from 'fs';
import path from 'path';
import config from '../Config';
import passport from '../passportInstance';
import { createUploadRouter } from './routes/upload';
import { createAuthGoogleRouter } from './routes/auth-google';
import { RegisterRoutes } from './tsoa/routes';

export const createExpressApp = () => {
  const app = express();

  const uploadDir = path.resolve(config.get('upload.dir') as string);
  mkdirSync(uploadDir, { recursive: true });

  // CORS: permite al frontend (otro origen) consumir la API desde el navegador.
  const frontendUrl = config.get('app.frontendUrl') as string;
  app.use((req: ExRequest, res: ExResponse, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', frontendUrl);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(passport.initialize());

  app.use('/uploads', express.static(uploadDir));
  app.use('/clothing', createUploadRouter());
  app.use('/auth', createAuthGoogleRouter());

  app.use('/docs', swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
    try {
      const swaggerDocument = await import('./tsoa/swagger.json');
      return res.send(swaggerUi.generateHTML(swaggerDocument));
    } catch (err) {
      return res.status(500).send('Swagger file not found. Run "npm run dev" first.');
    }
  });

  RegisterRoutes(app);

  app.use((err: any, _req: ExRequest, res: ExResponse, _next: any) => {
    const status = err?.statusCode ?? err?.status ?? 500;
    const message = err?.message ?? 'Internal Server Error';
    res.status(status).json({ message });
  });

  return app;
};