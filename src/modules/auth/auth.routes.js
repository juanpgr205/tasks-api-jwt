import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { createUsersRepository } from './users.repository.js';
import { createAuthService } from './auth.service.js';
import { createAuthController } from './auth.controller.js';
import { credentialsSchema } from './auth.schema.js';

export function createAuthRouter(repository = createUsersRepository(supabase)) {
  const controller = createAuthController(createAuthService(repository));
  const router = Router();
  router.post('/register', validate(credentialsSchema), controller.register);
  router.post('/login', validate(credentialsSchema), controller.login);
  router.get('/me', requireAuth, controller.me);
  return router;
}
