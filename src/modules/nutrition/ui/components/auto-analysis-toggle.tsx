"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { setAutoWeeklyAnalysis } from "@/modules/nutrition/actions";

export function AutoAnalysisToggle({ enabled }: { enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);
  const [isPending, setIsPending] = useState(false);

  const handleChange = async (next: boolean) => {
    setChecked(next);
    setIsPending(true);
    try {
      const result = await setAutoWeeklyAnalysis(next);
      if (result.ok) {
        toast.success(
          next
            ? "Automatyczna analiza włączona"
            : "Automatyczna analiza wyłączona — tylko ręczne uruchamianie",
        );
      } else {
        setChecked(!next);
        toast.error(result.error ?? "Nie udało się zapisać ustawienia");
      }
    } catch {
      setChecked(!next);
      toast.error("Nie udało się zapisać ustawienia");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-[11px] font-medium tracking-[0.08em] uppercase">
      Auto-analiza (cron)
      <Switch
        checked={checked}
        disabled={isPending}
        onCheckedChange={handleChange}
      />
    </label>
  );
}
