"use client";

import { CheckIcon, LoaderIcon, XIcon } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  search_products: "Szukam produktów…",
  research_nutrition: "Szukam danych odżywczych…",
  create_product: "Tworzę produkt…",
  add_meal_entry: "Dodaję posiłek…",
  list_meals: "Pobieram posiłki…",
  daily_summary: "Pobieram podsumowanie…",
  delete_meal_entry: "Usuwam wpis…",
};

type ToolStatusProps = {
  name: string;
  status: "running" | "success" | "error";
};

export function ToolStatus({ name, status }: ToolStatusProps) {
  const label = TOOL_LABELS[name] ?? name;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {status === "running" && (
        <LoaderIcon className="h-3 w-3 animate-spin" />
      )}
      {status === "success" && (
        <CheckIcon className="h-3 w-3 text-green-500" />
      )}
      {status === "error" && <XIcon className="h-3 w-3 text-red-500" />}
      <span>{label}</span>
    </div>
  );
}
