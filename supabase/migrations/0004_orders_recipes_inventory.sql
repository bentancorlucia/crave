-- crave. — módulos de pedidos, recetas e inventario (LIFO).
-- Aplicar después de 0003_redesign.sql.
--
-- Resumen:
--   * products / ingredients / recipes para catálogo de productos vendibles + recetas.
--   * ingredient_purchases = lotes (cada compra es un lote con stock restante y costo unitario).
--   * ingredient_consumptions = auditoría de cada consumo, valuado contra el lote (LIFO).
--   * v_ingredient_stock = stock actual y precio de consumo actual derivados de los lotes.
--   * customers / orders / order_items / order_cooks / order_deliverers para pedidos.
--   * Funciones consume_ingredient() y revert_consumption() para descontar/devolver stock.

-- ============================================================================
-- 1. Enums
-- ============================================================================
create type ingredient_unit       as enum ('kg', 'g', 'l', 'ml', 'unidad');
create type order_status          as enum ('preparando', 'realizado', 'entregado', 'cancelado');
create type order_delivery_kind   as enum ('envio', 'retira');
create type consumption_source    as enum ('order', 'adjustment');

-- ============================================================================
-- 2. Catálogo: ingredientes y productos
-- ============================================================================
create table public.ingredients (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null unique,
  unit                  ingredient_unit not null,
  low_stock_threshold   numeric(14,3) not null default 0 check (low_stock_threshold >= 0),
  note                  text,
  created_by            uuid not null references public.profiles(id),
  created_at            timestamptz not null default now()
);

create index ingredients_name_idx on public.ingredients (lower(name));

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  description       text,
  sale_price_cents  bigint not null check (sale_price_cents >= 0),
  active            boolean not null default true,
  created_by        uuid not null references public.profiles(id),
  created_at        timestamptz not null default now()
);

create index products_active_idx on public.products (active, name);

-- ============================================================================
-- 3. Recetas (producto ↔ ingrediente)
-- ============================================================================
create table public.recipes (
  product_id    uuid not null references public.products(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  quantity      numeric(14,3) not null check (quantity > 0),
  primary key (product_id, ingredient_id)
);

create index recipes_ingredient_idx on public.recipes (ingredient_id);

-- ============================================================================
-- 4. Compras de insumos = lotes (LIFO)
-- ============================================================================
create table public.ingredient_purchases (
  id                  uuid primary key default gen_random_uuid(),
  ingredient_id       uuid not null references public.ingredients(id) on delete restrict,
  quantity_purchased  numeric(14,3) not null check (quantity_purchased > 0),
  quantity_remaining  numeric(14,3) not null check (quantity_remaining >= 0),
  total_cost_cents    bigint not null check (total_cost_cents >= 0),
  unit_cost_cents     bigint not null check (unit_cost_cents >= 0),
  purchased_on        date not null default current_date,
  movement_id         uuid references public.movements(id) on delete set null,
  registered_by       uuid not null references public.profiles(id),
  note                text,
  created_at          timestamptz not null default now()
);

create index ingredient_purchases_lifo_idx
  on public.ingredient_purchases (ingredient_id, purchased_on desc, created_at desc);
create index ingredient_purchases_remaining_idx
  on public.ingredient_purchases (ingredient_id) where quantity_remaining > 0;

-- ============================================================================
-- 5. Consumos de ingredientes (auditoría con valuación LIFO)
-- ============================================================================
create table public.ingredient_consumptions (
  id                uuid primary key default gen_random_uuid(),
  ingredient_id     uuid not null references public.ingredients(id) on delete restrict,
  lot_id            uuid not null references public.ingredient_purchases(id) on delete restrict,
  quantity          numeric(14,3) not null check (quantity > 0),
  unit_cost_cents   bigint not null check (unit_cost_cents >= 0),
  total_cost_cents  bigint not null check (total_cost_cents >= 0),
  source_type       consumption_source not null,
  source_id         uuid not null,
  source_detail     text,
  consumed_at       timestamptz not null default now(),
  registered_by     uuid not null references public.profiles(id)
);

create index ingredient_consumptions_source_idx
  on public.ingredient_consumptions (source_type, source_id);
create index ingredient_consumptions_ingredient_idx
  on public.ingredient_consumptions (ingredient_id, consumed_at desc);

-- ============================================================================
-- 6. Vista: stock y costo unitario actual (LIFO) por ingrediente
-- ============================================================================
create view public.v_ingredient_stock as
select
  i.id                              as ingredient_id,
  coalesce(sum(p.quantity_remaining), 0)::numeric(14,3) as current_stock,
  (
    select p2.unit_cost_cents
    from public.ingredient_purchases p2
    where p2.ingredient_id = i.id
      and p2.quantity_remaining > 0
    order by p2.purchased_on desc, p2.created_at desc
    limit 1
  ) as last_unit_cost_cents
from public.ingredients i
left join public.ingredient_purchases p on p.ingredient_id = i.id
group by i.id;

grant select on public.v_ingredient_stock to authenticated;

-- ============================================================================
-- 7. Clientes (recurrentes)
-- ============================================================================
create table public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact     text,
  notes       text,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index customers_name_idx on public.customers (lower(name));

-- ============================================================================
-- 8. Pedidos
-- ============================================================================
create table public.orders (
  id                          uuid primary key default gen_random_uuid(),
  customer_id                 uuid references public.customers(id) on delete set null,
  customer_name_snapshot      text not null,
  customer_contact_snapshot   text,
  status                      order_status not null default 'preparando',
  delivery_kind               order_delivery_kind not null default 'retira',
  order_date                  date not null default current_date,
  due_date                    date,
  total_cents                 bigint not null default 0 check (total_cents >= 0),
  total_cost_cents            bigint not null default 0 check (total_cost_cents >= 0),
  paid_cents                  bigint not null default 0 check (paid_cents >= 0),
  paid_at                     timestamptz,
  payment_method              text,
  movement_id                 uuid references public.movements(id) on delete set null,
  low_stock_warnings          jsonb,
  notes                       text,
  created_by                  uuid not null references public.profiles(id),
  created_at                  timestamptz not null default now()
);

create index orders_status_idx     on public.orders (status);
create index orders_order_date_idx on public.orders (order_date desc);
create index orders_due_date_idx   on public.orders (due_date);

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  product_id        uuid not null references public.products(id) on delete restrict,
  product_name_snapshot text not null,
  quantity          numeric(14,3) not null check (quantity > 0),
  unit_price_cents  bigint not null check (unit_price_cents >= 0),
  subtotal_cents    bigint not null check (subtotal_cents >= 0),
  cost_cents        bigint not null default 0 check (cost_cents >= 0),
  created_at        timestamptz not null default now()
);

create index order_items_order_idx   on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_cooks (
  order_id   uuid not null references public.orders(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  primary key (order_id, profile_id)
);

create table public.order_deliverers (
  order_id   uuid not null references public.orders(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  primary key (order_id, profile_id)
);

-- ============================================================================
-- 9. Función: consume_ingredient (LIFO)
-- ============================================================================
-- Descuenta `p_quantity` del ingrediente recorriendo los lotes más recientes con stock,
-- crea filas en ingredient_consumptions y devuelve un JSON con
-- { consumed_quantity, total_cost_cents, shortage_quantity }.
create or replace function public.consume_ingredient(
  p_ingredient_id uuid,
  p_quantity      numeric,
  p_source_type   consumption_source,
  p_source_id     uuid,
  p_source_detail text,
  p_registered_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining_to_consume numeric := p_quantity;
  lot                  record;
  take                 numeric;
  cost                 bigint;
  total_consumed       numeric := 0;
  total_cost           bigint  := 0;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Cantidad a consumir debe ser positiva';
  end if;

  for lot in
    select id, quantity_remaining, unit_cost_cents
    from public.ingredient_purchases
    where ingredient_id = p_ingredient_id
      and quantity_remaining > 0
    order by purchased_on desc, created_at desc
    for update
  loop
    exit when remaining_to_consume <= 0;

    take := least(lot.quantity_remaining, remaining_to_consume);
    cost := round(take * lot.unit_cost_cents)::bigint;

    update public.ingredient_purchases
       set quantity_remaining = quantity_remaining - take
     where id = lot.id;

    insert into public.ingredient_consumptions (
      ingredient_id, lot_id, quantity, unit_cost_cents, total_cost_cents,
      source_type, source_id, source_detail, registered_by
    ) values (
      p_ingredient_id, lot.id, take, lot.unit_cost_cents, cost,
      p_source_type, p_source_id, p_source_detail, p_registered_by
    );

    remaining_to_consume := remaining_to_consume - take;
    total_consumed       := total_consumed + take;
    total_cost           := total_cost + cost;
  end loop;

  return jsonb_build_object(
    'consumed_quantity', total_consumed,
    'total_cost_cents',  total_cost,
    'shortage_quantity', greatest(remaining_to_consume, 0)
  );
end;
$$;

grant execute on function public.consume_ingredient(uuid, numeric, consumption_source, uuid, text, uuid)
  to authenticated;

-- ============================================================================
-- 10. Función: revert_consumption — devuelve cantidades a sus lotes originales.
-- ============================================================================
create or replace function public.revert_consumption(
  p_source_type consumption_source,
  p_source_id   uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
begin
  for c in
    select id, lot_id, quantity
    from public.ingredient_consumptions
    where source_type = p_source_type
      and source_id   = p_source_id
  loop
    update public.ingredient_purchases
       set quantity_remaining = quantity_remaining + c.quantity
     where id = c.lot_id;
  end loop;

  delete from public.ingredient_consumptions
   where source_type = p_source_type
     and source_id   = p_source_id;
end;
$$;

grant execute on function public.revert_consumption(consumption_source, uuid) to authenticated;

-- ============================================================================
-- 11. Función: confirm_order — pasar a 'realizado' descontando stock LIFO.
-- ============================================================================
-- Para cada order_item: suma quantity * recipes.quantity por ingrediente,
-- llama consume_ingredient() y guarda cost_cents en cada item. Acumula warnings
-- (stock bajo / faltante) en orders.low_stock_warnings.
create or replace function public.confirm_order(
  p_order_id     uuid,
  p_registered_by uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item                record;
  ing                 record;
  consumed_total      numeric;
  shortage            numeric;
  cost_result         jsonb;
  item_cost           bigint;
  order_cost_total    bigint := 0;
  warnings            jsonb := '[]'::jsonb;
  current_status      order_status;
begin
  select status into current_status from public.orders where id = p_order_id for update;
  if current_status is null then
    raise exception 'Pedido no encontrado';
  end if;
  if current_status = 'realizado' or current_status = 'entregado' then
    raise exception 'El pedido ya fue confirmado';
  end if;
  if current_status = 'cancelado' then
    raise exception 'El pedido está cancelado';
  end if;

  for item in
    select id, product_id, quantity, product_name_snapshot
    from public.order_items
    where order_id = p_order_id
  loop
    item_cost := 0;

    for ing in
      select r.ingredient_id,
             (item.quantity * r.quantity)::numeric(14,3) as needed_quantity,
             i.name as ingredient_name,
             i.low_stock_threshold
      from public.recipes r
      join public.ingredients i on i.id = r.ingredient_id
      where r.product_id = item.product_id
    loop
      cost_result := public.consume_ingredient(
        ing.ingredient_id,
        ing.needed_quantity,
        'order'::consumption_source,
        item.id,
        item.product_name_snapshot,
        p_registered_by
      );
      consumed_total := (cost_result->>'consumed_quantity')::numeric;
      shortage       := (cost_result->>'shortage_quantity')::numeric;
      item_cost      := item_cost + ((cost_result->>'total_cost_cents')::bigint);

      if shortage > 0 then
        warnings := warnings || jsonb_build_object(
          'ingredient_id', ing.ingredient_id,
          'ingredient_name', ing.ingredient_name,
          'kind', 'shortage',
          'needed', ing.needed_quantity,
          'consumed', consumed_total,
          'missing', shortage
        );
      else
        -- chequear stock bajo umbral después del consumo
        perform 1 from public.v_ingredient_stock vs
          where vs.ingredient_id = ing.ingredient_id
            and vs.current_stock < ing.low_stock_threshold;
        if found then
          warnings := warnings || jsonb_build_object(
            'ingredient_id', ing.ingredient_id,
            'ingredient_name', ing.ingredient_name,
            'kind', 'low_stock'
          );
        end if;
      end if;
    end loop;

    update public.order_items set cost_cents = item_cost where id = item.id;
    order_cost_total := order_cost_total + item_cost;
  end loop;

  update public.orders
     set status = 'realizado',
         total_cost_cents = order_cost_total,
         low_stock_warnings = case when jsonb_array_length(warnings) = 0 then null else warnings end
   where id = p_order_id;

  return jsonb_build_object(
    'total_cost_cents', order_cost_total,
    'warnings', warnings
  );
end;
$$;

grant execute on function public.confirm_order(uuid, uuid) to authenticated;

-- ============================================================================
-- 12. Función: revert_order — devuelve stock y limpia costos.
-- ============================================================================
create or replace function public.revert_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  for item in
    select id from public.order_items where order_id = p_order_id
  loop
    perform public.revert_consumption('order'::consumption_source, item.id);
    update public.order_items set cost_cents = 0 where id = item.id;
  end loop;

  update public.orders
     set total_cost_cents = 0,
         low_stock_warnings = null
   where id = p_order_id;
end;
$$;

grant execute on function public.revert_order(uuid) to authenticated;

-- ============================================================================
-- 13. RLS — todas las socias autenticadas leen y escriben (mismo patrón existente)
-- ============================================================================
alter table public.ingredients              enable row level security;
alter table public.products                 enable row level security;
alter table public.recipes                  enable row level security;
alter table public.ingredient_purchases     enable row level security;
alter table public.ingredient_consumptions  enable row level security;
alter table public.customers                enable row level security;
alter table public.orders                   enable row level security;
alter table public.order_items              enable row level security;
alter table public.order_cooks              enable row level security;
alter table public.order_deliverers         enable row level security;

-- read all
create policy "auth read ingredients"             on public.ingredients              for select to authenticated using (true);
create policy "auth read products"                on public.products                 for select to authenticated using (true);
create policy "auth read recipes"                 on public.recipes                  for select to authenticated using (true);
create policy "auth read ingredient_purchases"    on public.ingredient_purchases     for select to authenticated using (true);
create policy "auth read ingredient_consumptions" on public.ingredient_consumptions  for select to authenticated using (true);
create policy "auth read customers"               on public.customers                for select to authenticated using (true);
create policy "auth read orders"                  on public.orders                   for select to authenticated using (true);
create policy "auth read order_items"             on public.order_items              for select to authenticated using (true);
create policy "auth read order_cooks"             on public.order_cooks              for select to authenticated using (true);
create policy "auth read order_deliverers"        on public.order_deliverers         for select to authenticated using (true);

-- write all
create policy "auth write ingredients"          on public.ingredients          for all to authenticated using (true) with check (true);
create policy "auth write products"             on public.products             for all to authenticated using (true) with check (true);
create policy "auth write recipes"              on public.recipes              for all to authenticated using (true) with check (true);
create policy "auth write ingredient_purchases" on public.ingredient_purchases for all to authenticated using (true) with check (true);
create policy "auth write customers"            on public.customers            for all to authenticated using (true) with check (true);
create policy "auth write orders"               on public.orders               for all to authenticated using (true) with check (true);
create policy "auth write order_items"          on public.order_items          for all to authenticated using (true) with check (true);
create policy "auth write order_cooks"          on public.order_cooks          for all to authenticated using (true) with check (true);
create policy "auth write order_deliverers"     on public.order_deliverers     for all to authenticated using (true) with check (true);
-- ingredient_consumptions: solo se mutan vía las funciones SECURITY DEFINER consume_ingredient/revert_consumption.
