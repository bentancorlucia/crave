import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/queries/pedidos";

const STATUS_LABEL: Record<OrderStatus, string> = {
  preparando: "Preparando",
  realizado: "Realizado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_TONE: Record<OrderStatus, "pink" | "blue" | "cream" | "muted"> = {
  preparando: "pink",
  realizado: "blue",
  entregado: "cream",
  cancelado: "muted",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
