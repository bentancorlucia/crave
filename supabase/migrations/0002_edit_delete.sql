-- crave. — habilitar edición y borrado de movimientos y pagos.
-- Aplicar después de 0001_init.sql.

-- ============================================================================
-- RLS: permitir update/delete autenticado
-- ============================================================================
create policy "auth update movements" on public.movements
  for update to authenticated using (true) with check (true);

create policy "auth delete movements" on public.movements
  for delete to authenticated using (true);

create policy "auth delete debts" on public.debts
  for delete to authenticated using (true);

create policy "auth update debt_payments" on public.debt_payments
  for update to authenticated using (true) with check (true);

create policy "auth delete debt_payments" on public.debt_payments
  for delete to authenticated using (true);

-- ============================================================================
-- Sincronizar la deuda asociada cuando un movimiento de bolsillo se edita o borra
-- ============================================================================
create or replace function public.movements_sync_pocket_debt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'DELETE') then
    delete from public.debts where origin_movement_id = old.id;
    return old;
  end if;

  if (tg_op = 'UPDATE') then
    -- Antes era bolsillo y ahora no → borrar la deuda
    if old.source = 'bolsillo' and (new.source <> 'bolsillo' or new.type <> 'egreso') then
      delete from public.debts where origin_movement_id = old.id;

    -- Antes no era bolsillo y ahora sí → crear la deuda
    elsif (old.source <> 'bolsillo' or old.type <> 'egreso')
          and new.source = 'bolsillo' and new.type = 'egreso' then
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

    -- Sigue siendo bolsillo → actualizar la deuda asociada
    elsif old.source = 'bolsillo' and new.source = 'bolsillo' then
      update public.debts
         set amount_cents = new.amount_cents,
             creditor_profile_id = new.paid_by_profile_id
       where origin_movement_id = old.id;

      -- Si bajó el monto y ya estaba pagada de más, asegurarse de marcarla saldada;
      -- si subió y los pagos no alcanzan, reabrirla.
      update public.debts d
         set status = case
              when (select coalesce(sum(amount_cents),0) from public.debt_payments where debt_id = d.id) >= d.amount_cents
                then 'saldado'::debt_status
              else 'pendiente'::debt_status
              end,
             settled_at = case
              when (select coalesce(sum(amount_cents),0) from public.debt_payments where debt_id = d.id) >= d.amount_cents
                then coalesce(d.settled_at, now())
              else null
              end
       where d.origin_movement_id = new.id;
    end if;

    return new;
  end if;

  return null;
end;
$$;

create trigger movements_after_update_sync_debt
after update on public.movements
for each row execute function public.movements_sync_pocket_debt();

create trigger movements_after_delete_sync_debt
after delete on public.movements
for each row execute function public.movements_sync_pocket_debt();

-- ============================================================================
-- Reabrir/saldar deuda cuando se borra un pago
-- ============================================================================
create or replace function public.debts_recompute_after_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total_paid bigint;
  debt_amount bigint;
  target_id uuid;
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
