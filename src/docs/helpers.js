import { z } from 'zod';

// Convierte un schema de zod en JSON Schema para OpenAPI (sin la clave $schema).
export function toSchema(zodSchema, io = 'input') {
  const { $schema, ...jsonSchema } = z.toJSONSchema(zodSchema, { io });
  return jsonSchema;
}

export const jsonBody = (schema) => ({
  required: true,
  content: { 'application/json': { schema } },
});

export const jsonResponse = (description, schema) => ({
  description,
  content: { 'application/json': { schema } },
});

export const errorResponse = (description) => jsonResponse(description, { $ref: '#/components/schemas/Error' });

export const idParam = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

export function secure(paths) {
  const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace']);
  return Object.fromEntries(Object.entries(paths).map(([path, item]) => [path,
    Object.fromEntries(Object.entries(item).map(([key, value]) => [key, methods.has(key) ? {
      ...value,
      security: [{ bearerAuth: [] }],
      responses: { ...value.responses, 401: errorResponse('Token faltante, inválido o expirado') },
    } : value])),
  ]));
}
