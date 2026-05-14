import express, { json, urlencoded, Response as ExResponse, Request as ExRequest } from 'express';
import swaggerUi from 'swagger-ui-express';
import { mkdirSync } from 'fs';
import path from 'path';
import config from '../Config';
import passport from '../passportInstance';
import { createUploadRouter } from './routes/upload';
import { RegisterRoutes } from './tsoa/routes';

export const createExpressApp = () => {
  const app = express();

  const uploadDir = path.resolve(config.get('upload.dir') as string);
  mkdirSync(uploadDir, { recursive: true });

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(passport.initialize());

  app.use('/uploads', express.static(uploadDir));
  app.use('/clothing', createUploadRouter());

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