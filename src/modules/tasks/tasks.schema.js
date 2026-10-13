import { z } from 'zod';

// Los schemas se comparten entre la validación y OpenAPI.
export const taskIdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).meta({ example: 'Preparar la demo' }),
  description: z.string().trim().max(2000).optional().meta({ example: 'Ensayar cada paso' }),
  done: z.boolean().optional().meta({ example: false }),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Debe enviar al menos un campo' });

// Schema de respuesta para OpenAPI.
export const taskSchema = z.object({
  id: z.number().int().meta({ example: 1 }),
  title: z.string().meta({ example: 'Preparar la demo' }),
  description: z.string().nullable().meta({ example: 'Ensayar cada paso' }),
  done: z.boolean().meta({ example: false }),
  created_at: z.string().meta({ format: 'date-time', example: '2026-10-01T12:00:00Z' }),
});
