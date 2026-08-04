"use client";

import { Loader2, RefreshCw, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateWeekInsight } from "@/modules/nutrition/actions";

interface GenerateInsightButtonProps {
  weekStart: string;
  hasInsight: boolean;
}

export function GenerateInsightButton({
  weekStart,
  hasInsight,
}: GenerateInsightButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    try {
      setIsPending(true);
      const result = await generateWeekInsight(weekStart);
      if (result.ok) {
        toast.success("Analiza gotowa");
      } else {
        toast.error(result.error ?? "Analiza nie powiodła się");
      }
    } catch {
      toast.error("Analiza nie powiodła się");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant={hasInsight ? "outline" : "default"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
    >
      {isPending ? (
        <Loader2 className="animate-spin" />
      ) : hasInsight ? (
        <RefreshCw />
      ) : (
        <SparklesIcon />
      )}
      {isPending
        ? "Analizuję…"
        : hasInsight
          ? "Analizuj ponownie"
          : "Analizuj tydzień"}
    </Button>
  );
}
