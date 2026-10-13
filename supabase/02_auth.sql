-- Usuarios de la API; las contraseñas se guardan como hashes bcrypt.

create table if not exists public.users (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  password_hash text        not null,
  created_at    timestamptz not null default now()
);

-- Sin políticas RLS: la API accede con service_role.
alter table public.users enable row level security;
grant select, insert, update, delete on public.users to service_role;
