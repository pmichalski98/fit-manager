"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";

/**
 * Text input for decimal values. iOS ignores the "," key on type="number"
 * inputs, so we use type="text" + inputMode="decimal" and normalize the
 * comma (Polish decimal separator) to a dot before it reaches form state.
 */
function sanitizeDecimal(raw: string): string {
  let value = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const firstDot = value.indexOf(".");
  if (firstDot !== -1) {
    value =
      value.slice(0, firstDot + 1) +
      value.slice(firstDot + 1).replace(/\./g, "");
  }
  return value;
}

function DecimalInput({
  onChange,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "inputMode">) {
  return (
    <Input
      type="text"
      inputMode="decimal"
      onChange={(e) => {
        e.target.value = sanitizeDecimal(e.target.value);
        onChange?.(e);
      }}
      {...props}
    />
  );
}

export { DecimalInput, sanitizeDecimal };
