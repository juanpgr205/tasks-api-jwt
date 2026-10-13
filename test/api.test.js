import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import SwaggerParser from '@apidevtools/swagger-parser';

// Los tests nunca cargan .env ni acceden al proyecto real de Supabase.
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-key';
process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters';
process.env.JWT_EXPIRES_IN = '1h';
const { createApp } = await import('../src/app.js');
const { HttpError } = await import('../src/utils/http-error.js');
const { buildOpenApiSpec } = await import('../src/docs/openapi.js');
const { createUsersRepository } = await import('../src/modules/auth/users.repository.js');

function fixture() {
  const users = new Map();
  const tasks = new Map();
  let nextId = 1;
  const usersRepository = {
    async findByEmail(email) { return users.get(email) ?? null; },
    async create({ email, passwordHash }) {
      if (users.has(email)) throw HttpError.conflict('El email ya está registrado');
      const user = { id: randomUUID(), email, created_at: new Date().toISOString() };
      users.set(email, { ...user, password_hash: passwordHash });
      return user;
    },
  };
  const tasksRepository = {
    async findAll() { return [...tasks.values()]; },
    async findById(id) { return tasks.get(id) ?? null; },
    async create(data) {
      const task = { id: nextId++, description: null, done: false, created_at: new Date().toISOString(), ...data };
      tasks.set(task.id, task);
      return task;
    },
    async update(id, changes) {
      const task = tasks.get(id);
      if (!task) return null;
      const updated = { ...task, ...changes };
      tasks.set(id, updated);
      return updated;
    },
    async remove(id) { return tasks.delete(id); },
  };
  return { app: createApp({ usersRepository, tasksRepository }), users };
}

const credentials = { email: 'ana@test.com', password: 'supersecreta' };
async function authenticate(app) {
  await request(app).post('/api/auth/register').send(credentials).expect(201);
  const login = await request(app).post('/api/auth/login').send(credentials).expect(200);
  return `Bearer ${login.body.accessToken}`;
}

test('registro normaliza email, guarda bcrypt y no expone contraseñas; duplicado da 409', async () => {
  const { app, users } = fixture();
  const registered = await request(app).post('/api/auth/register')
    .send({ ...credentials, email: '  ANA@Test.com  ' }).expect(201);
  assert.equal(registered.body.email, credentials.email);
  assert.equal(registered.body.password_hash, undefined);
  assert.equal(registered.body.password, undefined);
  assert.ok(await bcrypt.compare(credentials.password, users.get(credentials.email).password_hash));
  await request(app).post('/api/auth/register').send(credentials).expect(409);
});

test('login rechaza usuario inexistente y contraseña incorrecta con el mismo error', async () => {
  const { app } = fixture();
  const missing = await request(app).post('/api/auth/login').send(credentials).expect(401);
  await request(app).post('/api/auth/register').send(credentials).expect(201);
  const wrong = await request(app).post('/api/auth/login').send({ ...credentials, password: 'incorrecta' }).expect(401);
  assert.deepEqual(wrong.body, missing.body);
});

test('login emite JWT firmado y me devuelve el usuario del token', async () => {
  const { app } = fixture();
  const authorization = await authenticate(app);
  const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
  assert.equal(payload.email, credentials.email);
  assert.equal(payload.exp - payload.iat, 3600);
  assert.equal(payload.password_hash, undefined);
  const me = await request(app).get('/api/auth/me').set('Authorization', authorization).expect(200);
  assert.deepEqual(me.body, { id: payload.sub, email: credentials.email });
});

test('todas las operaciones de tareas y me requieren autenticación', async () => {
  const { app } = fixture();
  for (const [method, path] of [['get', '/tasks'], ['get', '/tasks/1'], ['post', '/tasks'],
    ['patch', '/tasks/1'], ['delete', '/tasks/1'], ['get', '/auth/me']]) {
    const res = await request(app)[method](`/api${path}`).expect(401);
    assert.equal(typeof res.body.error.message, 'string');
  }
});

test('rechaza JWT alterado, expirado, con firma incorrecta, algoritmo distinto y sin claims', async () => {
  const { app } = fixture();
  const authorization = await authenticate(app);
  const [header, payload, signature] = authorization.slice(7).split('.');
  const changedSignature = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
  const claims = { email: credentials.email, sub: randomUUID() };
  const invalidTokens = [
    `${header}.${payload}.${changedSignature}`, 'no-es-un-jwt',
    jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: -1 }),
    jwt.sign(claims, 'otro-secreto', { expiresIn: '1h' }),
    jwt.sign(claims, process.env.JWT_SECRET, { algorithm: 'HS384', expiresIn: '1h' }),
    jwt.sign({ email: credentials.email }, process.env.JWT_SECRET, { expiresIn: '1h' }),
    jwt.sign(claims, process.env.JWT_SECRET),
  ];
  for (const token of invalidTokens) {
    await request(app).get('/api/tasks').set('Authorization', `Bearer ${token}`).expect(401);
  }
  await request(app).get('/api/tasks').set('Authorization', `${authorization} extra`).expect(401);
});

test('valida email, longitud de contraseña y límite de bcrypt en bytes UTF-8', async () => {
  const { app } = fixture();
  for (const body of [{ ...credentials, email: 'invalido' }, { ...credentials, password: '123' },
    { ...credentials, password: 'á'.repeat(37) }]) {
    const res = await request(app).post('/api/auth/register').send(body).expect(400);
    assert.ok(Array.isArray(res.body.error.details));
  }
});

test('CRUD autenticado: limpiar, crear, listar, leer, actualizar, eliminar y 404', async () => {
  const { app } = fixture();
  const auth = await authenticate(app);
  const created = await request(app).post('/api/tasks').set('Authorization', auth)
    .send({ title: '  Preparar la demo  ', description: ' Ensayar ' }).expect(201);
  assert.equal(created.body.title, 'Preparar la demo');
  assert.equal(created.body.description, 'Ensayar');
  const id = created.body.id;
  const listed = await request(app).get('/api/tasks').set('Authorization', auth).expect(200);
  assert.equal(listed.body.length, 1);
  await request(app).get(`/api/tasks/${id}`).set('Authorization', auth).expect(200);
  const updated = await request(app).patch(`/api/tasks/${id}`).set('Authorization', auth).send({ done: true }).expect(200);
  assert.equal(updated.body.done, true);
  const deleted = await request(app).delete(`/api/tasks/${id}`).set('Authorization', auth).expect(204);
  assert.equal(deleted.text, '');
  await request(app).get(`/api/tasks/${id}`).set('Authorization', auth).expect(404);
  await request(app).patch(`/api/tasks/${id}`).set('Authorization', auth).send({ done: false }).expect(404);
  await request(app).delete(`/api/tasks/${id}`).set('Authorization', auth).expect(404);
});

test('tareas inválidas devuelven 400 con detalles', async () => {
  const { app } = fixture();
  const auth = await authenticate(app);
  for (const body of [{ title: '' }, { title: '   ' }, { title: 'x'.repeat(201) }, { title: 'Tarea', done: 'true' }]) {
    const res = await request(app).post('/api/tasks').set('Authorization', auth).send(body).expect(400);
    assert.ok(res.body.error.details.length);
  }
  await request(app).patch('/api/tasks/1').set('Authorization', auth).send({}).expect(400);
  for (const id of ['abc', '0', '-1', '1.5']) {
    await request(app).get(`/api/tasks/${id}`).set('Authorization', auth).expect(400);
  }
});

test('health, Swagger y OpenAPI son públicos; OpenAPI 3.1 válido documenta seguridad', async () => {
  const { app } = fixture();
  await request(app).get('/api/health').expect(200);
  const ui = await request(app).get('/api/docs/').expect(200);
  assert.match(ui.text, /swagger-ui/);
  const spec = (await request(app).get('/api/docs/openapi.json').expect(200)).body;
  await SwaggerParser.validate(structuredClone(spec));
  for (const path of ['/tasks', '/tasks/{id}', '/auth/me']) {
    for (const [method, operation] of Object.entries(spec.paths[path])) {
      if (method === 'parameters') continue;
      assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
      assert.ok(operation.responses['401']);
    }
  }
  assert.equal(spec.paths['/auth/register'].post.security, undefined);
  assert.equal(spec.components.schemas.CreateTask.properties.title.maxLength, 200);
  assert.equal(buildOpenApiSpec().components.schemas.UpdateTask.minProperties, 1);
});

test('una violación UNIQUE concurrente se convierte en 409 en el repositorio', async () => {
  const db = { from: () => ({ insert: () => ({ select: () => ({
    single: async () => ({ data: null, error: { code: '23505', message: 'duplicate key' } }),
  }) }) }) };
  await assert.rejects(createUsersRepository(db).create({ email: credentials.email, passwordHash: 'hash' }),
    error => error.status === 409);
});
