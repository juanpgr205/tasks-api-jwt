import { Router } from 'express';
import { docsRouter } from './docs/docs.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { createTasksRouter } from './modules/tasks/tasks.routes.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';

export function createApiRouter({ tasksRepository, usersRepository } = {}) {
  const apiRouter = Router();

  apiRouter.use('/docs', docsRouter);
  apiRouter.use('/health', healthRouter);
  apiRouter.use('/auth', createAuthRouter(usersRepository));
  apiRouter.use('/tasks', createTasksRouter(tasksRepository));
  return apiRouter;
}
