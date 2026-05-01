const UYU = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const UYU_NO_DEC = new Intl.NumberFormat("es-UY", {
  style: "currency",
  currency: "UYU",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatUYU(cents: number | bigint, opts: { compact?: boolean } = {}): string {
  const value = Number(cents) / 100;
  return opts.compact ? UYU_NO_DEC.format(value) : UYU.format(value);
}

/**
 * Convierte un input del usuario ("12450,50", "12.450,50", "12450.50") a centavos enteros.
 * Devuelve null si el input no es parseable.
 */
export function parseToCents(input: string): number | null {
  if (typeof input !== "string") return null;
  const cleaned = input.trim().replace(/\s/g, "").replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized: string;

  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned.replace(/,/g, "");
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function formatRelativeDate(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "ayer";
  if (diffDays < 7) return `hace ${diffDays} días`;
  return new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short" }).format(date);
}
