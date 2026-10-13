import { errorResponse, jsonBody, jsonResponse, secure, toSchema } from '../../docs/helpers.js';
import { credentialsSchema, registeredUserSchema, userSchema, tokenSchema } from './auth.schema.js';

const credentials = { $ref: '#/components/schemas/Credentials' };

export const authDocs = {
  tags: [{ name: 'Auth', description: 'Registro, login y usuario actual' }],
  schemas: {
    Credentials: toSchema(credentialsSchema),
    User: toSchema(userSchema, 'output'),
    RegisteredUser: toSchema(registeredUserSchema, 'output'),
    AccessToken: toSchema(tokenSchema, 'output'),
  },
  paths: {
    '/auth/register': { post: {
      tags: ['Auth'], summary: 'Registrar un usuario', requestBody: jsonBody(credentials),
      responses: {
        201: jsonResponse('Usuario creado (sin contraseña ni hash)', { $ref: '#/components/schemas/RegisteredUser' }),
        400: errorResponse('Datos inválidos'), 409: errorResponse('El email ya está registrado'),
      },
    } },
    '/auth/login': { post: {
      tags: ['Auth'], summary: 'Iniciar sesión y obtener un JWT', requestBody: jsonBody(credentials),
      responses: {
        200: jsonResponse('Token de acceso', { $ref: '#/components/schemas/AccessToken' }),
        400: errorResponse('Datos inválidos'), 401: errorResponse('Credenciales inválidas'),
      },
    } },
    ...secure({ '/auth/me': { get: {
      tags: ['Auth'], summary: 'Usuario dueño del token',
      responses: { 200: jsonResponse('Usuario autenticado', { $ref: '#/components/schemas/User' }) },
    } } }),
  },
};
