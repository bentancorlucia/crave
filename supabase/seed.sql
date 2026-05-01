-- Datos demo para desarrollo local. Ejecutar DESPUÉS de crear las usuarias en Auth.
-- Reemplazar los UUIDs por los de auth.users reales si se quiere correr.

-- (Ejemplo) — descomentar y reemplazar con UUIDs reales:
-- update public.profiles set display_name = 'Juli', initial = 'J' where id = '<uuid-juli>';
-- update public.profiles set display_name = 'Ana',  initial = 'A' where id = '<uuid-ana>';

-- Movimiento ingreso de prueba
-- insert into public.movements (type, amount_cents, description, occurred_on, source, created_by)
-- values ('ingreso', 4500000, 'Venta pedido cumple Flor', current_date, 'cuenta_madre', '<uuid-juli>');

-- Movimiento de bolsillo (genera deuda automática)
-- insert into public.movements (type, amount_cents, description, occurred_on, source, paid_by_profile_id, created_by)
-- values ('egreso', 840000, 'Compra harina y manteca', current_date, 'bolsillo', '<uuid-juli>', '<uuid-juli>');
