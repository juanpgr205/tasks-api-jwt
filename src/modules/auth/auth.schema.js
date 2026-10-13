import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()).meta({ format: 'email', example: 'ana@test.com' }),
  password: z.string().min(8).max(72)
    .refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'La contraseña no puede superar 72 bytes UTF-8')
    .meta({ example: 'supersecreta' }),
});

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
});

export const registeredUserSchema = userSchema.extend({
  created_at: z.string().meta({ format: 'date-time' }),
});

export const tokenSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.string().meta({ example: '1h' }),
});
