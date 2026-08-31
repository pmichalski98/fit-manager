"use client";

import { DownloadIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { syncFitatuWeek } from "@/modules/fitatu/actions";

export function SyncFitatuButton({ weekStart }: { weekStart: string }) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    try {
      setIsPending(true);
      const result = await syncFitatuWeek(weekStart);
      if (!result.ok) {
        toast.error(result.error ?? "Import nie powiódł się");
        return;
      }

      const synced = result.data.filter((d) => d.status === "synced").length;
      const errors = result.data.filter((d) => d.status === "error").length;
      if (errors > 0) {
        toast.warning(
          `Zaimportowano ${synced === 1 ? "1 dzień" : `${synced} dni`}, błędów: ${errors}`,
        );
      } else if (synced === 0) {
        toast.info("Brak posiłków w Fitatu w tym tygodniu");
      } else {
        toast.success(
          `Zaimportowano ${synced === 1 ? "1 dzień" : `${synced} dni`} z Fitatu`,
        );
      }
    } catch {
      toast.error("Import nie powiódł się");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <DownloadIcon />}
      {isPending ? "Importuję…" : "Importuj z Fitatu"}
    </Button>
  );
}
