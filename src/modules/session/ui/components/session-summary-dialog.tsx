"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SummaryData = {
  durationSec: number | null;
  totalLoadKg: number;
  progress: Array<{ name: string; delta: number }>;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: SummaryData | null;
  elapsedTime: string; // Fallback for when durationSec is null (if needed or just use current timer value)
  onClose: () => void;
};

export function SessionSummaryDialog({
  open,
  onOpenChange,
  summary,
  elapsedTime,
  onClose,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Training summary</DialogTitle>
          <DialogDescription>
            Here’s a quick recap of your session. Closing will take you to the
            dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total time</span>
            <span className="font-medium tabular-nums">
              {(() => {
                const sec = summary?.durationSec ?? null;
                if (sec == null) return elapsedTime;
                const h = Math.floor(sec / 3600)
                  .toString()
                  .padStart(2, "0");
                const m = Math.floor((sec % 3600) / 60)
                  .toString()
                  .padStart(2, "0");
                const s = Math.floor(sec % 60)
                  .toString()
                  .padStart(2, "0");
                return `${h}:${m}:${s}`;
              })()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total load</span>
            <span className="font-medium tabular-nums">
              {(summary?.totalLoadKg ?? 0).toFixed(2)} kg
            </span>
          </div>
          {summary && summary.progress.length > 0 ? (
            <div className="pt-2">
              <div className="mb-1 font-medium">Progress</div>
              <ul className="list-disc space-y-1 pl-5">
                {summary.progress.map((p, idx) => (
                  <li key={idx} className="text-sm">
                    {p.name}: +{p.delta.toFixed(2)} kg volume
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No volume increase vs last session.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Go to dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
