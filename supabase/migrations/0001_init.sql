-- crave. — esquema inicial módulo Finanzas
-- Aplica con: supabase db push  (o pegando en SQL editor)

-- ============================================================================
-- Enums
-- ============================================================================
create type movement_type as enum ('ingreso', 'egreso');
create type movement_source as enum ('cuenta_madre', 'bolsillo');
create type debtor_kind as enum ('mother', 'profile');
create type debt_status as enum ('pendiente', 'saldado');

-- ============================================================================
-- profiles  (1:1 con auth.users — una fila por socia)
-- ============================================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  initial      text not null check (char_length(initial) between 1 and 2),
  color_hint   text,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- mother_account  (singleton)
-- ============================================================================
create table public.mother_account (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'crave.',
  created_at timestamptz not null default now()
);

insert into public.mother_account (name) values ('crave.');

-- ============================================================================
-- movements
-- ============================================================================
create table public.movements (
  id                  uuid primary key default gen_random_uuid(),
  type                movement_type   not null,
  amount_cents        bigint          not null check (amount_cents > 0),
  description         text            not null,
  category            text,
  occurred_on         date            not null default current_date,
  paid_by_profile_id  uuid            references public.profiles(id),
  source              movement_source not null,
  created_by          uuid            not null references public.profiles(id),
  created_at          timestamptz     not null default now(),

  -- si source='bolsillo' tiene que haber paid_by_profile_id; si es cuenta_madre no
  constraint movements_source_paid_by_consistent check (
    (source = 'bolsillo'    and paid_by_profile_id is not null) or
    (source = 'cuenta_madre' and paid_by_profile_id is null)
  )
);

create index movements_occurred_on_idx       on public.movements (occurred_on desc);
create index movements_paid_by_profile_id_idx on public.movements (paid_by_profile_id);
create index movements_source_idx            on public.movements (source);

-- ============================================================================
-- debts
-- ============================================================================
create table public.debts (
  id                   uuid        primary key default gen_random_uuid(),
  debtor_kind          debtor_kind not null,
  debtor_profile_id    uuid        references public.profiles(id),
  creditor_kind        debtor_kind not null,
  creditor_profile_id  uuid        references public.profiles(id),
  amount_cents         bigint      not null check (amount_cents > 0),
  status               debt_status not null default 'pendiente',
  origin_movement_id   uuid        references public.movements(id) on delete set null,
  note                 text,
  created_at           timestamptz not null default now(),
  settled_at           timestamptz,

  constraint debts_debtor_consistent check (
    (debtor_kind = 'profile' and debtor_profile_id is not null) or
    (debtor_kind = 'mother'  and debtor_profile_id is null)
  ),
  constraint debts_creditor_consistent check (
    (creditor_kind = 'profile' and creditor_profile_id is not null) or
    (creditor_kind = 'mother'  and creditor_profile_id is null)
  ),
  constraint debts_not_self check (
    debtor_kind <> creditor_kind
    or debtor_profile_id is distinct from creditor_profile_id
  )
);

create index debts_status_idx     on public.debts (status);
create index debts_debtor_idx     on public.debts (debtor_kind, debtor_profile_id);
create index debts_creditor_idx   on public.debts (creditor_kind, creditor_profile_id);

-- ============================================================================
-- debt_payments
-- ============================================================================
create table public.debt_payments (
  id            uuid        primary key default gen_random_uuid(),
  debt_id       uuid        not null references public.debts(id) on delete cascade,
  amount_cents  bigint      not null check (amount_cents > 0),
  paid_on       date        not null default current_date,
  registered_by uuid        not null references public.profiles(id),
  note          text,
  created_at    timestamptz not null default now()
);

create index debt_payments_debt_id_idx on public.debt_payments (debt_id);

-- ============================================================================
-- Trigger: si el movimiento es 'bolsillo', crear deuda mother → profile
-- ============================================================================
create or replace function public.movements_create_pocket_debt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'bolsillo' and new.type = 'egreso' then
    insert into public.debts (
      debtor_kind, debtor_profile_id,
      creditor_kind, creditor_profile_id,
      amount_cents, origin_movement_id, note
    ) values (
      'mother', null,
      'profile', new.paid_by_profile_id,
      new.amount_cents, new.id,
      'Auto: gasto de bolsillo'
    );
  end if;
  return new;
end;
$$;

create trigger movements_after_insert_create_debt
after insert on public.movements
for each row execute function public.movements_create_pocket_debt();

-- ============================================================================
-- Trigger: cuando los pagos cubren el monto de la deuda, marcarla saldada.
-- ============================================================================
create or replace function public.debts_settle_if_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_paid bigint;
  debt_amount bigint;
begin
  select coalesce(sum(amount_cents), 0) into total_paid
  from public.debt_payments where debt_id = new.debt_id;

  select amount_cents into debt_amount
  from public.debts where id = new.debt_id;

  if total_paid >= debt_amount then
    update public.debts
       set status = 'saldado', settled_at = now()
     where id = new.debt_id and status <> 'saldado';
  end if;
  return new;
end;
$$;

create trigger debt_payments_after_insert_settle
after insert on public.debt_payments
for each row execute function public.debts_settle_if_paid();

-- ============================================================================
-- RLS
-- ============================================================================
alter table public.profiles       enable row level security;
alter table public.mother_account enable row level security;
alter table public.movements      enable row level security;
alter table public.debts          enable row level security;
alter table public.debt_payments  enable row level security;

-- Cualquiera autenticada puede leer todo
create policy "auth read profiles"       on public.profiles       for select to authenticated using (true);
create policy "auth read mother_account" on public.mother_account for select to authenticated using (true);
create policy "auth read movements"      on public.movements      for select to authenticated using (true);
create policy "auth read debts"          on public.debts          for select to authenticated using (true);
create policy "auth read debt_payments"  on public.debt_payments  for select to authenticated using (true);

-- Cada socia puede actualizar su propio profile
create policy "self update profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Cualquiera autenticada puede crear movimientos / deudas / pagos (registrados a nombre propio)
create policy "auth insert movements" on public.movements
  for insert to authenticated with check (created_by = auth.uid());

create policy "auth insert debts" on public.debts
  for insert to authenticated with check (true);

create policy "auth update debts" on public.debts
  for update to authenticated using (true) with check (true);

create policy "auth insert debt_payments" on public.debt_payments
  for insert to authenticated with check (registered_by = auth.uid());

-- ============================================================================
-- Helper view: saldo de la cuenta madre
-- ============================================================================
create or replace view public.v_mother_balance as
select
  coalesce(sum(case when type = 'ingreso' then amount_cents else 0 end), 0)
  - coalesce(sum(case when type = 'egreso' and source = 'cuenta_madre' then amount_cents else 0 end), 0)
  as balance_cents
from public.movements;

grant select on public.v_mother_balance to authenticated;

-- ============================================================================
-- Bootstrap de profiles: cuando se crea un usuario en auth.users, crear profile placeholder
-- (el display_name y la inicial se completan después; un admin puede editarlo desde la app)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, initial)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data->>'display_name', new.email), 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
