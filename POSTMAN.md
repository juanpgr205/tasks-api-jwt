# Pruebas y captura en Postman

1. Iniciar la API con `npm run dev`. Deben existir `public.tasks` y `public.users` en Supabase.
2. En Postman, usar **Use resources or import → Import** (Ctrl+O) y seleccionar `postman/Tasks-API.postman_collection.json`.
3. Opcionalmente importar `postman/Local.postman_environment.json` y seleccionar **Tasks API - Local**. También funciona con **No Environment**: la colección incluye `baseUrl`.
4. Abrir **Tarea JWT + Usuarios - Tasks API** y usar **Run** / **Run collection**.
5. Ejecutar las 26 peticiones en orden, con una iteración. Registro genera un email de prueba; login guarda `token`; crear tarea guarda `taskId`. Las rutas protegidas heredan Bearer de la colección; las públicas y las pruebas sin token usan No Auth.
6. Verificar que todas las comprobaciones pasan. Un 400, 401, 404 o 409 es correcto en las peticiones que lo indican en su nombre.
7. Expandir las carpetas del panel izquierdo y tomar una captura donde se vea la colección y el resultado del Runner. Evitar mostrar Variables con el token o `.env`.

La ejecución crea un usuario ficticio y una tarea de prueba. Solo elimina la tarea creada en esa ejecución; conserva las tareas originales.

## Token vencido (demo del paso 7.4)

1. Cambiar `JWT_EXPIRES_IN=30s` en `.env` y reiniciar la API.
2. Enviar **09 - Login y guardar token** y después **10 - Usuario autenticado** antes de 30 segundos: responde 200.
3. Esperar más de 30 segundos y reenviar **10 - Usuario autenticado**: responde 401 con `Token inválido o expirado`. La comprobación HTTP 200 de esa petición fallará deliberadamente en esta demo manual.
4. Restaurar `JWT_EXPIRES_IN=1h`, reiniciar y hacer login de nuevo antes de ejecutar la colección completa.

El token vencido también se verifica automáticamente en `npm test`, sin esperar ni cambiar la configuración real.

## Entrega

- Enlace a un repositorio público con la API, SQL, `.env.example` y colección.
- Captura real de la colección de peticiones HTTP en Postman.

Referencia: [importar datos en Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/).
