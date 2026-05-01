-- crave. — rediseño del módulo de deudas (peer-to-peer + expense_groups)
-- Aplicar después de 0002_edit_delete.sql.
--
-- Cambios principales:
--   * movements queda sólo para la cuenta madre (drop source / paid_by_profile_id).
--   * debts pasa a ser peer-to-peer (profile → profile), siempre hijas de un expense_group.
--   * Se agrega expense_groups: "una socia paga algo y se reparte entre varias".
--   * RPC create_expense_group para crear grupo + N deudas atómicamente.
--   * Se elimina el flujo automático de bolsillo → deuda mother→socia.

-- ============================================================================
-- 1. Drop triggers viejos
-- ============================================================================
drop trigger if exists movements_after_insert_create_debt on public.movements;
drop trigger if exists movements_after_update_sync_debt  on public.movements;
drop trigger if exists movements_after_delete_sync_debt  on public.movements;
drop trigger if exists debt_payments_after_insert_settle    on public.debt_payments;
drop trigger if exists debt_payments_after_delete_recompute on public.debt_payments;
drop trigger if exists debt_payments_after_update_recompute on public.debt_payments;

-- ============================================================================
-- 2. Drop functions viejas
-- ============================================================================
drop function if exists public.movements_create_pocket_debt();
drop function if exists public.movements_sync_pocket_debt();
drop function if exists public.debts_settle_if_paid();
drop function if exists public.debts_recompute_after_payment_change();

-- ============================================================================
-- 3. Drop view (se recrea más abajo más simple)
-- ============================================================================
drop view if exists public.v_mother_balance;

-- ============================================================================
-- 4. Reset de datos de prueba
-- ============================================================================
truncate table public.debt_payments cascade;
truncate table public.debts          cascade;
truncate table public.movements      cascade;

-- ============================================================================
-- 5. Limpiar movements: drop columnas y constraint del modelo viejo
-- ============================================================================
alter table public.movements drop constraint if exists movements_source_paid_by_consistent;
drop index if exists public.movements_paid_by_profile_id_idx;
drop index if exists public.movements_source_idx;
alter table public.movements drop column if exists source;
alter table public.movements drop column if exists paid_by_profile_id;

-- ============================================================================
-- 6. Drop tabla debts vieja (se recrea con nuevo schema)
-- ============================================================================
drop table if exists public.debts cascade;

-- ============================================================================
-- 7. Drop enums obsoletos (mantener movement_type y debt_status)
-- ============================================================================
drop type if exists movement_source;
drop type if exists debtor_kind;

-- ============================================================================
-- 8. Recrear vista de saldo de la cuenta madre (ahora todo movement es cuenta madre)
-- ============================================================================
create view public.v_mother_balance as
select
  coalesce(
    sum(case when type = 'ingreso' then amount_cents else -amount_cents end),
    0
  )::bigint as balance_cents
from public.movements;

grant select on public.v_mother_balance to authenticated;

-- ============================================================================
-- 9. expense_groups — un gasto compartido que va a generar deudas hijas
-- ============================================================================
create table public.expense_groups (
  id                  uuid        primary key default gen_random_uuid(),
  payer_profile_id    uuid        not null references public.profiles(id),
  total_amount_cents  bigint      not null check (total_amount_cents > 0),
  description         text        not null,
  occurred_on         date        not null default current_date,
  split_kind          text        not null default 'equitativo',
  note                text,
  created_by          uuid        not null references public.profiles(id),
  created_at          timestamptz not null default now()
);

create index expense_groups_occurred_on_idx on public.expense_groups (occurred_on desc);
create index expense_groups_payer_idx       on public.expense_groups (payer_profile_id);

-- ============================================================================
-- 10. debts (nuevo modelo: peer-to-peer, hija de expense_group)
-- ============================================================================
create table public.debts (
  id                   uuid        primary key default gen_random_uuid(),
  expense_group_id     uuid        not null references public.expense_groups(id) on delete cascade,
  debtor_profile_id    uuid        not null references public.profiles(id),
  creditor_profile_id  uuid        not null references public.profiles(id),
  amount_cents         bigint      not null check (amount_cents > 0),
  status               debt_status not null default 'pendiente',
  settled_at           timestamptz,
  note                 text,
  created_at           timestamptz not null default now(),

  constraint debts_not_self check (debtor_profile_id <> creditor_profile_id),
  constraint debts_one_per_debtor_per_group unique (expense_group_id, debtor_profile_id)
);

create index debts_expense_group_idx on public.debts (expense_group_id);
create index debts_debtor_idx        on public.debts (debtor_profile_id);
create index debts_creditor_idx      on public.debts (creditor_profile_id);
create index debts_status_idx        on public.debts (status);

-- ============================================================================
-- 11. Trigger: marcar deuda saldada cuando los pagos cubren el monto.
-- ============================================================================
create or replace function public.debts_settle_if_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_paid  bigint;
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
-- 12. Trigger: recomputar status si se borra/edita un pago.
-- ============================================================================
create or replace function public.debts_recompute_after_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_paid  bigint;
  debt_amount bigint;
  target_id   uuid;
begin
  target_id := coalesce((case when tg_op = 'DELETE' then old.debt_id else new.debt_id end), null);
  if target_id is null then return null; end if;

  select coalesce(sum(amount_cents), 0) into total_paid
  from public.debt_payments where debt_id = target_id;

  select amount_cents into debt_amount
  from public.debts where id = target_id;

  if debt_amount is null then return coalesce(new, old); end if;

  if total_paid >= debt_amount then
    update public.debts
       set status = 'saldado', settled_at = coalesce(settled_at, now())
     where id = target_id and status <> 'saldado';
  else
    update public.debts
       set status = 'pendiente', settled_at = null
     where id = target_id and status <> 'pendiente';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger debt_payments_after_delete_recompute
after delete on public.debt_payments
for each row execute function public.debts_recompute_after_payment_change();

create trigger debt_payments_after_update_recompute
after update on public.debt_payments
for each row execute function public.debts_recompute_after_payment_change();

-- ============================================================================
-- 13. RLS
-- ============================================================================
alter table public.expense_groups enable row level security;
alter table public.debts          enable row level security;
-- (debt_payments y movements ya tenían RLS; sólo recrear policies que se perdieron al droppear cosas relacionadas, en caso necesario)

create policy "auth read expense_groups"   on public.expense_groups for select to authenticated using (true);
create policy "auth insert expense_groups" on public.expense_groups for insert to authenticated with check (true);
create policy "auth update expense_groups" on public.expense_groups for update to authenticated using (true) with check (true);
create policy "auth delete expense_groups" on public.expense_groups for delete to authenticated using (true);

create policy "auth read debts"   on public.debts for select to authenticated using (true);
create policy "auth insert debts" on public.debts for insert to authenticated with check (true);
create policy "auth update debts" on public.debts for update to authenticated using (true) with check (true);
create policy "auth delete debts" on public.debts for delete to authenticated using (true);

-- ============================================================================
-- 14. Vista resumen de gastos compartidos (para listados con progreso)
-- ============================================================================
create view public.v_expense_groups_summary as
select
  g.id                               as expense_group_id,
  g.total_amount_cents               as total_cents,
  coalesce(sum(d.amount_cents), 0)::bigint as debts_total_cents,
  coalesce(sum(p.amount_cents), 0)::bigint as paid_cents,
  count(d.id)                        as debts_count,
  count(d.id) filter (where d.status = 'pendiente') as debts_pending_count
from public.expense_groups g
left join public.debts d on d.expense_group_id = g.id
left join public.debt_payments p on p.debt_id = d.id
group by g.id;

grant select on public.v_expense_groups_summary to authenticated;

-- ============================================================================
-- 15. RPC: create_expense_group — atómico (grupo + N deudas + redondeo correcto)
-- ============================================================================
create or replace function public.create_expense_group(
  p_payer        uuid,
  p_total_cents  bigint,
  p_description  text,
  p_occurred_on  date,
  p_participants uuid[],
  p_include_payer boolean,
  p_note         text,
  p_created_by   uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id   uuid;
  deudores uuid[];
  n_split  int;   -- personas que consumen el gasto
  n_debts  int;   -- deudores (siempre = participantes sin el pagador)
  share    bigint;
  extra    bigint;
  i        int;
  monto    bigint;
begin
  if p_total_cents is null or p_total_cents <= 0 then
    raise exception 'El monto total debe ser mayor a cero';
  end if;
  if p_payer is null then
    raise exception 'Falta el pagador';
  end if;
  if p_participants is null or array_length(p_participants, 1) is null then
    raise exception 'Hay que elegir al menos un participante';
  end if;

  -- Deudores = participantes únicos sin el pagador (el pagador nunca se debe a sí mismo).
  select array_agg(distinct x order by x)
    into deudores
  from unnest(p_participants) as x
  where x <> p_payer;

  n_debts := coalesce(array_length(deudores, 1), 0);
  if n_debts = 0 then
    raise exception 'No hay deudores que generen deuda (¿el pagador es el único participante?)';
  end if;

  -- Cantidad total de personas entre las que se reparte el consumo del gasto.
  -- include_payer=true → pagador también consume su parte; total dividido entre n_debts + 1.
  -- include_payer=false → sólo los deudores consumen; total dividido entre n_debts.
  if p_include_payer then
    n_split := n_debts + 1;
  else
    n_split := n_debts;
  end if;

  share := p_total_cents / n_split;
  extra := p_total_cents - share * n_split;

  insert into public.expense_groups (
    payer_profile_id, total_amount_cents, description, occurred_on, split_kind, note, created_by
  ) values (
    p_payer, p_total_cents, p_description, coalesce(p_occurred_on, current_date), 'equitativo', p_note, p_created_by
  )
  returning id into new_id;

  -- Cada deudor debe `share`. Si include_payer=false el primer deudor absorbe el residuo
  -- (en include_payer=true el residuo lo asume el pagador, que ya puso el dinero).
  for i in 1..n_debts loop
    if (not p_include_payer) and i = 1 then
      monto := share + extra;
    else
      monto := share;
    end if;

    insert into public.debts (
      expense_group_id, debtor_profile_id, creditor_profile_id, amount_cents
    ) values (
      new_id, deudores[i], p_payer, monto
    );
  end loop;

  return new_id;
end;
$$;

grant execute on function public.create_expense_group(uuid, bigint, text, date, uuid[], boolean, text, uuid) to authenticated;
