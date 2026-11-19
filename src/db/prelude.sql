-- Simula o mínimo do Supabase para testar o schema.sql num Postgres comum.
-- Usado só nos testes (src/db/schema.test.ts). Não rode no Supabase.
create schema if not exists auth;

create table auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text
);

create role anon nologin;
create role authenticated nologin;

-- no Supabase, auth.uid() lê o usuário do token (JWT) da requisição
create function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

-- o Supabase concede acesso às tabelas novas por padrão; o schema.sql revoga
alter default privileges in schema public grant all on tables to anon, authenticated;
