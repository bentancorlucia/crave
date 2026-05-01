"use client";

import { MovementForm } from "@/components/finance/MovementForm";
import { createMovement } from "./actions";

export function NewMovementForm() {
  return <MovementForm action={createMovement} submitLabel="Guardar movimiento" />;
}
