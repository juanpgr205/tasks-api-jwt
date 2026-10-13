-- Tabla de tareas.

create table if not exists public.tasks (
  id          bigint generated always as identity primary key,
  title       text        not null check (char_length(title) between 1 and 200),
  description text,
  done        boolean     not null default false,
  created_at  timestamptz not null default now()
);

-- Sin políticas RLS: la API accede con service_role.
alter table public.tasks enable row level security;
grant select, insert, update, delete on public.tasks to service_role;

insert into public.tasks (title, description) values
  ('Crear la base de datos', 'Proyecto en Supabase + tabla tasks'),
  ('Crear la API', 'Express estructurado por capas'),
  ('Agregar autenticación', 'JWT en el header Authorization');
