import { createClient } from "@/lib/supabase/server";

export * from "./cocina";
export * from "./pedidos";

export async function listProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, initial")
    .order("display_name");
  if (error) throw error;
  return data ?? [];
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, initial")
    .eq("id", user.id)
    .single();
  return data;
}

export async function getMotherBalance(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("v_mother_balance").select("balance_cents").single();
  if (error) {
    return 0;
  }
  return Number(data?.balance_cents ?? 0);
}

function monthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const fmt = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

export async function getMonthlyStats() {
  const supabase = await createClient();
  const { start, end } = monthRange();
  const { data, error } = await supabase
    .from("movements")
    .select("type, amount_cents")
    .gte("occurred_on", start)
    .lt("occurred_on", end);
  if (error) throw error;

  let ingresos = 0;
  let egresos = 0;
  for (const m of data ?? []) {
    if (m.type === "ingreso") ingresos += m.amount_cents;
    else if (m.type === "egreso") egresos += m.amount_cents;
  }
  return {
    ingresosCents: ingresos,
    egresosCents: egresos,
    netoCents: ingresos - egresos,
  };
}

export async function listRecentMovements(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select(
      `id, type, amount_cents, description, category, occurred_on,
       created_by_profile:profiles!movements_created_by_fkey ( display_name, initial )`,
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getMovementById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("id, type, amount_cents, description, category, occurred_on, created_by, created_at")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function listAllMovements(filter: { month?: string; type?: "ingreso" | "egreso" } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("movements")
    .select(
      `id, type, amount_cents, description, category, occurred_on,
       created_by_profile:profiles!movements_created_by_fkey ( display_name, initial )`,
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter.type) q = q.eq("type", filter.type);
  if (filter.month) {
    const [y, m] = filter.month.split("-").map(Number);
    const start = `${y}-${String(m).padStart(2, "0")}-01`;
    const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    q = q.gte("occurred_on", start).lt("occurred_on", next);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

// =============================================================================
// Evolución de la cuenta madre (saldo acumulado + flujo mensual)
// =============================================================================

export type DailyBalancePoint = { date: string; balance_cents: number; ingresos_cents: number; egresos_cents: number };
export type MonthlyFlowPoint = { month: string; ingresos_cents: number; egresos_cents: number; neto_cents: number };
export type EvolutionData = {
  dailyBalance: DailyBalancePoint[];
  monthlyFlow: MonthlyFlowPoint[];
  stats: {
    avgMonthlyIncome: number;
    avgMonthlyExpense: number;
    bestMonth: MonthlyFlowPoint | null;
    worstMonth: MonthlyFlowPoint | null;
    totalIngresos: number;
    totalEgresos: number;
    movementsCount: number;
  };
};

export async function getMovementsEvolution(monthsBack = 12): Promise<EvolutionData> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movements")
    .select("type, amount_cents, occurred_on")
    .order("occurred_on", { ascending: true });
  if (error) throw error;
  const movements = data ?? [];

  // Saldo acumulado por día (sólo días con movimientos).
  const byDay = new Map<string, { ingresos: number; egresos: number }>();
  for (const m of movements) {
    const day = m.occurred_on as string;
    const cur = byDay.get(day) ?? { ingresos: 0, egresos: 0 };
    if (m.type === "ingreso") cur.ingresos += Number(m.amount_cents);
    else cur.egresos += Number(m.amount_cents);
    byDay.set(day, cur);
  }
  const sortedDays = Array.from(byDay.keys()).sort();
  let running = 0;
  const dailyBalance: DailyBalancePoint[] = sortedDays.map((date) => {
    const { ingresos, egresos } = byDay.get(date)!;
    running += ingresos - egresos;
    return { date, balance_cents: running, ingresos_cents: ingresos, egresos_cents: egresos };
  });

  // Flujo mensual — ventana fija de los últimos `monthsBack` meses (incluye actual).
  const now = new Date();
  const monthlyFlow: MonthlyFlowPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyFlow.push({ month: key, ingresos_cents: 0, egresos_cents: 0, neto_cents: 0 });
  }
  const monthIdx = new Map(monthlyFlow.map((m, i) => [m.month, i]));
  for (const m of movements) {
    const key = (m.occurred_on as string).slice(0, 7);
    const idx = monthIdx.get(key);
    if (idx === undefined) continue;
    if (m.type === "ingreso") monthlyFlow[idx].ingresos_cents += Number(m.amount_cents);
    else monthlyFlow[idx].egresos_cents += Number(m.amount_cents);
  }
  monthlyFlow.forEach((m) => {
    m.neto_cents = m.ingresos_cents - m.egresos_cents;
  });

  // Stats: promedios sobre meses con actividad para no diluir con meses vacíos.
  const activeMonths = monthlyFlow.filter((m) => m.ingresos_cents + m.egresos_cents > 0);
  const avgMonthlyIncome = activeMonths.length
    ? Math.round(activeMonths.reduce((acc, m) => acc + m.ingresos_cents, 0) / activeMonths.length)
    : 0;
  const avgMonthlyExpense = activeMonths.length
    ? Math.round(activeMonths.reduce((acc, m) => acc + m.egresos_cents, 0) / activeMonths.length)
    : 0;
  const bestMonth = activeMonths.length
    ? activeMonths.reduce((best, m) => (m.neto_cents > best.neto_cents ? m : best))
    : null;
  const worstMonth = activeMonths.length
    ? activeMonths.reduce((worst, m) => (m.neto_cents < worst.neto_cents ? m : worst))
    : null;
  const totalIngresos = movements.reduce(
    (a, m) => a + (m.type === "ingreso" ? Number(m.amount_cents) : 0),
    0,
  );
  const totalEgresos = movements.reduce(
    (a, m) => a + (m.type === "egreso" ? Number(m.amount_cents) : 0),
    0,
  );

  return {
    dailyBalance,
    monthlyFlow,
    stats: {
      avgMonthlyIncome,
      avgMonthlyExpense,
      bestMonth,
      worstMonth,
      totalIngresos,
      totalEgresos,
      movementsCount: movements.length,
    },
  };
}

// =============================================================================
// Gastos compartidos (expense_groups + debts peer-to-peer)
// =============================================================================

export type ExpenseGroupRow = Awaited<ReturnType<typeof listExpenseGroups>>[number];

export async function listExpenseGroups(limit = 50) {
  const supabase = await createClient();
  const { data: groups, error } = await supabase
    .from("expense_groups")
    .select(
      `id, total_amount_cents, description, occurred_on, note, created_at,
       payer:profiles!expense_groups_payer_profile_id_fkey ( id, display_name, initial )`,
    )
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!groups?.length) return [];

  const ids = groups.map((g) => g.id);
  const { data: summary } = await supabase
    .from("v_expense_groups_summary")
    .select("expense_group_id, paid_cents, debts_pending_count, debts_count")
    .in("expense_group_id", ids);

  const byId = new Map<string, { paid: number; pending: number; total: number }>();
  (summary ?? []).forEach((s) => {
    byId.set(s.expense_group_id, {
      paid: Number(s.paid_cents),
      pending: s.debts_pending_count,
      total: s.debts_count,
    });
  });

  return groups.map((g: any) => {
    const s = byId.get(g.id) ?? { paid: 0, pending: 0, total: 0 };
    const payer = Array.isArray(g.payer) ? g.payer[0] ?? null : g.payer;
    return {
      id: g.id as string,
      total_amount_cents: g.total_amount_cents as number,
      description: g.description as string,
      occurred_on: g.occurred_on as string,
      note: g.note as string | null,
      created_at: g.created_at as string,
      payer: payer as { id: string; display_name: string; initial: string } | null,
      paid_cents: s.paid,
      pending_count: s.pending,
      debts_count: s.total,
      status: (s.pending === 0 && s.total > 0 ? "saldado" : "pendiente") as "saldado" | "pendiente",
    };
  });
}

function unwrapJoin<T>(v: T | T[] | null | undefined): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return (v ?? null) as T | null;
}

export async function getExpenseGroupWithDebts(groupId: string) {
  const supabase = await createClient();
  const { data: groupRaw } = await supabase
    .from("expense_groups")
    .select(
      `id, total_amount_cents, description, occurred_on, note, created_at,
       payer:profiles!expense_groups_payer_profile_id_fkey ( id, display_name, initial )`,
    )
    .eq("id", groupId)
    .single();
  if (!groupRaw) return null;

  const group = {
    ...(groupRaw as any),
    payer: unwrapJoin<{ id: string; display_name: string; initial: string }>(
      (groupRaw as any).payer,
    ),
  };

  const { data: debtsRaw } = await supabase
    .from("debts")
    .select(
      `id, amount_cents, status, settled_at, created_at,
       debtor:profiles!debts_debtor_profile_id_fkey ( id, display_name, initial )`,
    )
    .eq("expense_group_id", groupId)
    .order("created_at", { ascending: true });

  const debtIds = (debtsRaw ?? []).map((d: any) => d.id);
  const { data: paymentsRaw } = debtIds.length
    ? await supabase
        .from("debt_payments")
        .select(
          `id, debt_id, amount_cents, paid_on, note, created_at,
           registered_by_profile:profiles!debt_payments_registered_by_fkey ( display_name, initial )`,
        )
        .in("debt_id", debtIds)
        .order("paid_on", { ascending: false })
    : { data: [] as any[] };

  const paymentsByDebt = new Map<string, any[]>();
  (paymentsRaw ?? []).forEach((p: any) => {
    const normalized = {
      ...p,
      registered_by_profile: unwrapJoin(p.registered_by_profile),
    };
    const arr = paymentsByDebt.get(p.debt_id) ?? [];
    arr.push(normalized);
    paymentsByDebt.set(p.debt_id, arr);
  });

  const debtsWithPayments = (debtsRaw ?? []).map((d: any) => {
    const ps = (paymentsByDebt.get(d.id) ?? []) as Array<{ amount_cents: number }>;
    const paid = ps.reduce((acc, p) => acc + p.amount_cents, 0);
    return {
      ...d,
      debtor: unwrapJoin<{ id: string; display_name: string; initial: string }>(d.debtor),
      payments: paymentsByDebt.get(d.id) ?? [],
      totalPaid: paid,
      remaining: Math.max(0, d.amount_cents - paid),
    };
  });

  const totalPaid = debtsWithPayments.reduce((acc, d) => acc + d.totalPaid, 0);
  const totalDebts = debtsWithPayments.reduce((acc, d) => acc + d.amount_cents, 0);

  return {
    group,
    debts: debtsWithPayments,
    totalPaid,
    totalDebts,
    remaining: Math.max(0, totalDebts - totalPaid),
  };
}

/**
 * Saldos netos pendientes entre socias.
 * Para cada par (debtor, creditor) suma lo pendiente y compensa la dirección opuesta.
 * Devuelve filas con saldo positivo: "X le debe $Y a Z".
 */
export async function listPeerBalances() {
  const supabase = await createClient();
  const { data: debts } = await supabase
    .from("debts")
    .select("id, amount_cents, debtor_profile_id, creditor_profile_id")
    .eq("status", "pendiente");
  if (!debts?.length) return [];

  const ids = debts.map((d) => d.id);
  const { data: payments } = await supabase
    .from("debt_payments")
    .select("debt_id, amount_cents")
    .in("debt_id", ids);

  const paidByDebt = new Map<string, number>();
  (payments ?? []).forEach((p) => {
    paidByDebt.set(p.debt_id, (paidByDebt.get(p.debt_id) ?? 0) + p.amount_cents);
  });

  // Sumar deudas netas por par (usando una clave canónica con par ordenado).
  const net = new Map<string, number>(); // key = "smaller|bigger", value = saldo en favor del bigger (positivo) o del smaller (negativo)
  for (const d of debts) {
    const remaining = Math.max(0, d.amount_cents - (paidByDebt.get(d.id) ?? 0));
    if (remaining === 0) continue;
    const a = d.debtor_profile_id;
    const b = d.creditor_profile_id;
    const [smaller, bigger] = a < b ? [a, b] : [b, a];
    const key = `${smaller}|${bigger}`;
    const sign = a < b ? +1 : -1; // positivo si debtor es smaller (debe a bigger)
    net.set(key, (net.get(key) ?? 0) + sign * remaining);
  }

  if (net.size === 0) return [];

  const profileIds = new Set<string>();
  net.forEach((_, key) => {
    const [s, b] = key.split("|");
    profileIds.add(s);
    profileIds.add(b);
  });
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, initial")
    .in("id", Array.from(profileIds));
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows: Array<{
    debtor: { id: string; display_name: string; initial: string };
    creditor: { id: string; display_name: string; initial: string };
    amount_cents: number;
  }> = [];

  net.forEach((value, key) => {
    if (value === 0) return;
    const [smaller, bigger] = key.split("|");
    const debtorId = value > 0 ? smaller : bigger;
    const creditorId = value > 0 ? bigger : smaller;
    const debtor = byId.get(debtorId);
    const creditor = byId.get(creditorId);
    if (!debtor || !creditor) return;
    rows.push({ debtor, creditor, amount_cents: Math.abs(value) });
  });

  rows.sort((a, b) => b.amount_cents - a.amount_cents);
  return rows;
}

/**
 * Devuelve las deudas pendientes en las que `debtorId` le debe a `creditorId`,
 * con cuánto queda pendiente en cada una (descontando pagos previos).
 * Ordenadas por antigüedad (FIFO).
 */
export async function getPendingDebtsBetween(debtorId: string, creditorId: string) {
  const supabase = await createClient();
  const { data: debts } = await supabase
    .from("debts")
    .select("id, amount_cents, created_at")
    .eq("status", "pendiente")
    .eq("debtor_profile_id", debtorId)
    .eq("creditor_profile_id", creditorId)
    .order("created_at", { ascending: true });
  if (!debts?.length) return [];

  const ids = debts.map((d) => d.id);
  const { data: payments } = await supabase
    .from("debt_payments")
    .select("debt_id, amount_cents")
    .in("debt_id", ids);

  const paidByDebt = new Map<string, number>();
  (payments ?? []).forEach((p) => {
    paidByDebt.set(p.debt_id, (paidByDebt.get(p.debt_id) ?? 0) + p.amount_cents);
  });

  return debts.map((d) => ({
    id: d.id,
    amount_cents: d.amount_cents,
    remaining_cents: Math.max(0, d.amount_cents - (paidByDebt.get(d.id) ?? 0)),
    created_at: d.created_at,
  }));
}
