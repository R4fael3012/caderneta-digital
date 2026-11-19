-- =====================================================================
-- Caderneta Digital · banco de dados (Supabase / Postgres)
--
-- Como usar: Supabase › SQL Editor › colar este arquivo inteiro › Run.
-- Pode ser executado mais de uma vez: ele cria o que falta e recria as
-- regras sem apagar dados.
--
-- Regras de negócio (SPEC.md) garantidas AQUI, no banco, e não só na tela:
--   RN01  valor do lançamento > 0, com no máximo 2 casas decimais
--   RN02  pagamento não pode passar da dívida atual
--   RN03  compra não pode fazer a dívida passar do limite de fiado
--   RN04  um comerciante nunca lê, altera nem apaga dados de outro (RLS)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tabelas
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome       text not null,
  telefone   text,
  limite     numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.clientes add column if not exists telefone text;

alter table public.clientes drop constraint if exists clientes_nome_ck;
alter table public.clientes add constraint clientes_nome_ck
  check (char_length(btrim(nome)) between 1 and 80);

alter table public.clientes drop constraint if exists clientes_telefone_ck;
alter table public.clientes add constraint clientes_telefone_ck
  check (telefone is null or char_length(telefone) <= 20);

alter table public.clientes drop constraint if exists clientes_limite_ck;
alter table public.clientes add constraint clientes_limite_ck
  check (limite >= 0 and limite = round(limite, 2) and limite <= 9999999.99);

create table if not exists public.lancamentos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  tipo       text not null,
  valor      numeric not null,
  descricao  text,
  data       date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.lancamentos drop constraint if exists lancamentos_tipo_ck;
alter table public.lancamentos add constraint lancamentos_tipo_ck
  check (tipo in ('compra', 'pagamento'));

-- RN01: maior que zero e no máximo 2 casas decimais
alter table public.lancamentos drop constraint if exists lancamentos_valor_ck;
alter table public.lancamentos add constraint lancamentos_valor_ck
  check (valor > 0 and valor = round(valor, 2) and valor <= 9999999.99);

alter table public.lancamentos drop constraint if exists lancamentos_descricao_ck;
alter table public.lancamentos add constraint lancamentos_descricao_ck
  check (descricao is null or char_length(descricao) <= 120);

create index if not exists lancamentos_cliente_idx on public.lancamentos (cliente_id);
create index if not exists lancamentos_user_idx    on public.lancamentos (user_id);
create index if not exists clientes_user_idx       on public.clientes (user_id);

-- ---------------------------------------------------------------------
-- 2. Função auxiliar: formata dinheiro nas mensagens de erro (R$ 30,00)
-- ---------------------------------------------------------------------
create or replace function public.moeda(v numeric)
returns text
language sql
immutable
as $$
  select 'R$ ' || replace(to_char(v, 'FM9999999990.00'), '.', ',')
$$;

-- ---------------------------------------------------------------------
-- 3. RN02 e RN03: validação de todo lançamento (criar, editar, excluir)
--    O saldo é sempre derivado dos lançamentos (compras - pagamentos).
-- ---------------------------------------------------------------------
create or replace function public.validar_lancamento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_cliente_id    uuid;
  v_limite        numeric;
  v_saldo_atual   numeric;
  v_efeito_antigo numeric := 0;
  v_efeito_novo   numeric := 0;
  v_saldo_novo    numeric;
begin
  v_cliente_id := case when tg_op = 'DELETE' then old.cliente_id else new.cliente_id end;

  -- RN01 primeiro (os CHECKs da tabela só rodam depois deste gatilho, então a
  -- mensagem certa precisa sair daqui). Os CHECKs continuam como rede de segurança.
  if tg_op in ('INSERT', 'UPDATE') then
    if new.tipo is null or new.tipo not in ('compra', 'pagamento') then
      raise exception 'Tipo de lançamento inválido.' using errcode = 'P0001', hint = 'RN01';
    end if;
    if new.valor is null or new.valor <= 0 then
      raise exception 'O valor deve ser maior que zero.' using errcode = 'P0001', hint = 'RN01';
    end if;
    if new.valor <> round(new.valor, 2) then
      raise exception 'Use no máximo 2 casas decimais.' using errcode = 'P0001', hint = 'RN01';
    end if;
  end if;

  if tg_op = 'UPDATE' and new.cliente_id <> old.cliente_id then
    raise exception 'Não é possível mover um lançamento para outro cliente.'
      using errcode = 'P0001', hint = 'RN04';
  end if;

  -- Trava a linha do cliente: duas gravações simultâneas não furam a regra.
  -- Com RLS, um cliente de outro comerciante simplesmente não é encontrado.
  select limite into v_limite from public.clientes where id = v_cliente_id for update;
  if not found then
    if tg_op = 'DELETE' then
      return old;  -- o cliente está sendo excluído (cascata): nada a validar
    end if;
    raise exception 'Cliente não encontrado.' using errcode = 'P0001', hint = 'RN04';
  end if;

  select coalesce(sum(case tipo when 'compra' then valor else -valor end), 0)
    into v_saldo_atual
    from public.lancamentos
   where cliente_id = v_cliente_id;

  if tg_op in ('UPDATE', 'DELETE') then
    v_efeito_antigo := case old.tipo when 'compra' then old.valor else -old.valor end;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_efeito_novo := case new.tipo when 'compra' then new.valor else -new.valor end;
  end if;

  v_saldo_novo := v_saldo_atual - v_efeito_antigo + v_efeito_novo;

  -- RN02: o saldo nunca fica negativo (pagamento maior que a dívida)
  if v_saldo_novo < 0 then
    if tg_op = 'INSERT' then
      raise exception 'O pagamento não pode ser maior que a dívida atual (%).', public.moeda(v_saldo_atual)
        using errcode = 'P0001', hint = 'RN02';
    end if;
    raise exception 'Não é possível: os pagamentos registrados ficariam maiores que a dívida do cliente.'
      using errcode = 'P0001', hint = 'RN02';
  end if;

  -- RN03: a dívida não passa do limite. Só bloqueia mudanças que AUMENTAM a
  -- dívida (assim, reduzir o limite abaixo do saldo não trava o histórico).
  if v_saldo_novo > v_limite and v_saldo_novo > v_saldo_atual then
    raise exception '% ultrapassa o limite de fiado (%). Valor disponível: %.',
      case when tg_op = 'INSERT' then 'Esta compra' else 'Esta alteração' end,
      public.moeda(v_limite),
      public.moeda(greatest(v_limite - v_saldo_atual, 0))
      using errcode = 'P0001', hint = 'RN03';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lancamentos_validar on public.lancamentos;
create trigger lancamentos_validar
  before insert or update or delete on public.lancamentos
  for each row execute function public.validar_lancamento();

-- ---------------------------------------------------------------------
-- 4. Excluir cliente com dívida é bloqueado (decisão 4 do SPEC)
-- ---------------------------------------------------------------------
create or replace function public.validar_exclusao_cliente()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_saldo numeric;
begin
  select coalesce(sum(case tipo when 'compra' then valor else -valor end), 0)
    into v_saldo
    from public.lancamentos
   where cliente_id = old.id;

  if v_saldo > 0 then
    raise exception 'Este cliente ainda deve %. Registre o pagamento antes de excluir.', public.moeda(v_saldo)
      using errcode = 'P0001', hint = 'RF03';
  end if;
  return old;
end;
$$;

drop trigger if exists clientes_validar_exclusao on public.clientes;
create trigger clientes_validar_exclusao
  before delete on public.clientes
  for each row execute function public.validar_exclusao_cliente();

-- ---------------------------------------------------------------------
-- 5. RN04: RLS. Cada comerciante só enxerga e altera as próprias linhas.
--    Sem política para uma operação, ela é proibida.
-- ---------------------------------------------------------------------
alter table public.clientes    enable row level security;
alter table public.lancamentos enable row level security;

drop policy if exists "dono acessa os proprios clientes" on public.clientes;
drop policy if exists clientes_dono on public.clientes;
create policy clientes_dono on public.clientes
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists lancamentos_dono on public.lancamentos;
create policy lancamentos_dono on public.lancamentos
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.clientes c
       where c.id = cliente_id and c.user_id = (select auth.uid())
    )
  );

-- Quem não fez login (anon) não tem nenhuma permissão nestas tabelas.
revoke all on public.clientes    from anon, public;
revoke all on public.lancamentos from anon, public;
grant select, insert, update, delete on public.clientes    to authenticated;
grant select, insert, update, delete on public.lancamentos to authenticated;

-- ---------------------------------------------------------------------
-- 6. Visão com o saldo de cada cliente (RF05). security_invoker faz a
--    visão respeitar o RLS de quem consulta.
-- ---------------------------------------------------------------------
create or replace view public.clientes_com_saldo
with (security_invoker = true) as
select c.id,
       c.user_id,
       c.nome,
       c.telefone,
       c.limite,
       c.created_at,
       coalesce(sum(case when l.tipo = 'compra' then l.valor else -l.valor end), 0) as saldo
  from public.clientes c
  left join public.lancamentos l on l.cliente_id = c.id
 group by c.id;

revoke all on public.clientes_com_saldo from anon, public;
grant select on public.clientes_com_saldo to authenticated;
