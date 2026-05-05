"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerPayment } from "./actions";

export function PaymentForm({
  orderId,
  remainingCents,
}: {
  orderId: string;
  remainingCents: number;
}) {
  const [amountStr, setAmountStr] = useState(
    remainingCents > 0 ? (remainingCents / 100).toFixed(2).replace(".", ",") : "",
  );
  const action = registerPayment.bind(null, orderId);

  return (
    <form action={action} className="flex items-center gap-2">
      <Input
        name="amount"
        inputMode="decimal"
        placeholder="0,00"
        value={amountStr}
        onChange={(e) => setAmountStr(e.target.value)}
        className="flex-1"
        required
      />
      <Button type="submit" size="md" variant="primary">
        Cobrar
      </Button>
    </form>
  );
}
