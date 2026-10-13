import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiSpec } from './openapi.js';

const spec = buildOpenApiSpec();

export const docsRouter = Router();

docsRouter.get('/openapi.json', (_req, res) => res.json(spec));

docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(spec, { swaggerOptions: { persistAuthorization: true } }));
