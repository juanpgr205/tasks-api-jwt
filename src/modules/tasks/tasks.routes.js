import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { createTasksRepository } from './tasks.repository.js';
import { createTasksService } from './tasks.service.js';
import { createTasksController } from './tasks.controller.js';
import { createTaskSchema, taskIdParams, updateTaskSchema } from './tasks.schema.js';

export function createTasksRouter(repository = createTasksRepository(supabase)) {
  const service = createTasksService(repository);
  const controller = createTasksController(service);

  const tasksRouter = Router();
  tasksRouter.use(requireAuth);

  tasksRouter.get('/', controller.list);
  tasksRouter.get('/:id', validate(taskIdParams, 'params'), controller.getById);
  tasksRouter.post('/', validate(createTaskSchema), controller.create);
  tasksRouter.patch('/:id', validate(taskIdParams, 'params'), validate(updateTaskSchema), controller.update);
  tasksRouter.delete('/:id', validate(taskIdParams, 'params'), controller.remove);
  return tasksRouter;
}
