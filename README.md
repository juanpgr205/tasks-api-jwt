# Tasks API - JWT + Usuarios

Tarea de Diseño de Software: pasos **5 (CRUD y validación), 6 (Swagger) y 7 (JWT)**. Basada en [JonathanSolisP/design-course, Semana 9/tasks-api](https://github.com/JonathanSolisP/design-course/tree/main/Semana%209/tasks-api). El tutorial original se conserva en [TUTORIAL.md](TUTORIAL.md).

## Ejecutar

1. Instalar Node.js 22 o superior.
2. En el SQL Editor de Supabase, ejecutar `supabase/01_tasks.sql` y `supabase/02_auth.sql`. Si `tasks` ya existe con los datos iniciales, ejecutar solo el segundo script: el primero vuelve a insertar ejemplos.
3. Configurar `SUPABASE_URL` y `SUPABASE_SECRET_KEY` en `.env`.
4. Generar `JWT_SECRET` con `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` y guardarlo en `.env`. Usar `JWT_EXPIRES_IN=1h`.
5. Ejecutar `npm ci` y luego `npm run dev`.

API: `http://localhost:3000/api`. Swagger: `http://localhost:3000/api/docs`. OpenAPI: `http://localhost:3000/api/docs/openapi.json`.

## Endpoints

| Método | Ruta | Acceso | Resultado |
|---|---|---|---|
| GET | `/api/health` | Público | Estado de la API |
| GET | `/api/health/db` | Público | Conexión a Supabase |
| GET | `/api/docs` | Público | Swagger UI |
| GET | `/api/docs/openapi.json` | Público | OpenAPI 3.1 |
| POST | `/api/auth/register` | Público | Usuario, 201; duplicado, 409 |
| POST | `/api/auth/login` | Público | JWT, 200; credenciales incorrectas, 401 |
| GET | `/api/auth/me` | JWT | ID y email del usuario |
| GET | `/api/tasks` | JWT | Lista de tareas |
| GET | `/api/tasks/:id` | JWT | Tarea, 200; inexistente, 404 |
| POST | `/api/tasks` | JWT | Crear tarea, 201 |
| PATCH | `/api/tasks/:id` | JWT | Actualizar tarea, 200 |
| DELETE | `/api/tasks/:id` | JWT | Eliminar, 204; inexistente, 404 |

Registro y login reciben `{ "email": "ana@test.com", "password": "supersecreta" }`. El email se normaliza; las contraseñas se almacenan como hashes bcrypt. Login devuelve `accessToken`, `tokenType` y `expiresIn`. Las rutas protegidas requieren `Authorization: Bearer <accessToken>`; tokens ausentes, alterados o vencidos devuelven 401.

Validación Zod: título de 1 a 200 caracteres después de trim, descripción de hasta 2000, `done` booleano, ID entero positivo y PATCH con al menos un campo. Contraseña de 8 a 72 caracteres y hasta 72 bytes UTF-8 por el límite de bcrypt. Errores con `{ "error": { "message": "...", "details": [...] } }`; `details` aparece cuando aplica.

## Diseño

`routes → controller → service → repository → Supabase`. Factories e inyección de dependencias construyen los módulos. `requireAuth` protege todas las rutas de tareas. JWT está aislado en `src/lib/jwt.js`; cada módulo aporta su documentación y los schemas Zod generan JSON Schema. Las tareas son compartidas por los usuarios autenticados, como indica el paso 7 del tutorial.

## Pruebas y entrega

`npm test` ejecuta diez pruebas con `node:test` y Supertest: registro/bcrypt, login, tokens válidos/alterados/vencidos, protección de todos los métodos, CRUD, validación, duplicados concurrentes y OpenAPI. Usan repositorios en memoria; no leen `.env` ni modifican Supabase.

La colección de 26 peticiones está en `postman/Tasks-API.postman_collection.json`. Sigue [POSTMAN.md](POSTMAN.md) para ejecutarla contra Supabase.

Los archivos de configuración de entorno, `node_modules` y los reportes que pueden contener tokens están excluidos de Git. La colección distribuida solo contiene datos ficticios de prueba.
