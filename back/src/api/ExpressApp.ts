import express, { json, urlencoded, Response as ExResponse, Request as ExRequest } from 'express';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from './tsoa/routes';

export const createExpressApp = () => {
  const app = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());

  app.use('/docs', swaggerUi.serve, async (_req: ExRequest, res: ExResponse) => {
    try {
      const swaggerDocument = await import('./tsoa/swagger.json');
      return res.send(swaggerUi.generateHTML(swaggerDocument));
    } catch (err) {
      return res.status(500).send('Swagger file not found. Run "npm run dev" first.');
    }
  });

  RegisterRoutes(app);

  return app;
};