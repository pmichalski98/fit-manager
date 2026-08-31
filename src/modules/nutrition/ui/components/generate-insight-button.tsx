"use client";

import { Loader2, RefreshCw, SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  generateWeekInsight,
  getWeekInsightStatus,
} from "@/modules/nutrition/actions";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 10 * 60_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface GenerateInsightButtonProps {
  weekStart: string;
  hasInsight: boolean;
  /** ISO timestamp of the current insight, the baseline for detecting a new one. */
  insightUpdatedAt: string | null;
}

export function GenerateInsightButton({
  weekStart,
  hasInsight,
  insightUpdatedAt,
}: GenerateInsightButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isPending) {
      setElapsedSeconds(0);
      return;
    }
    const startedAt = Date.now();
    const id = setInterval(
      () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      1_000,
    );
    return () => clearInterval(id);
  }, [isPending]);

  /**
   * Falls back to polling when the action's own request died (proxy timeout)
   * or another run is already in flight — the analysis keeps going server-side.
   */
  const finishByPolling = async (baseline: string | null) => {
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);
      try {
        const status = await getWeekInsightStatus(weekStart);
        if (status.updatedAt !== null && status.updatedAt !== baseline) {
          router.refresh();
          toast.success("Analiza gotowa");
          return;
        }
        if (!status.running) {
          toast.error("Analiza nie powiodła się");
          return;
        }
      } catch {
        // Transient network error — keep polling until the deadline.
      }
    }
    toast.warning("Analiza wciąż trwa — odśwież stronę za kilka minut");
  };

  const handleClick = async () => {
    const baseline = insightUpdatedAt;
    setIsPending(true);
    toast.info("Analiza uruchomiona — może potrwać kilka minut");
    try {
      const result = await generateWeekInsight(weekStart);
      if (result.ok) {
        toast.success("Analiza gotowa");
      } else if (result.running) {
        await finishByPolling(baseline);
      } else {
        toast.error(result.error ?? "Analiza nie powiodła się");
      }
    } catch {
      await finishByPolling(baseline);
    } finally {
      setIsPending(false);
    }
  };

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");

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
      {isPending ? (
        <span className="tabular-nums">
          Analizuję… {minutes}:{seconds}
        </span>
      ) : hasInsight ? (
        "Analizuj ponownie"
      ) : (
        "Analizuj tydzień"
      )}
    </Button>
  );
}
