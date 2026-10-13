import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createApiRouter } from './routes.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

// Construye la app sin levantar el servidor (así se puede probar con supertest).
export function createApp(dependencies = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api', createApiRouter(dependencies));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
