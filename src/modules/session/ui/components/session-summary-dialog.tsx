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
      <DialogContent className="gap-0 p-0">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Training summary
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 p-5">
          <DialogDescription className="text-secondary-foreground text-xs leading-relaxed">
            Here’s a quick recap of your session. Closing will take you to the
            dashboard.
          </DialogDescription>
          <div className="flex items-center justify-between text-sm">
            <span className="label-caps">Total time</span>
            <span className="font-mono font-semibold">
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
          <div className="flex items-center justify-between text-sm">
            <span className="label-caps">Total load</span>
            <span className="font-mono font-semibold">
              {(summary?.totalLoadKg ?? 0).toFixed(2)} kg
            </span>
          </div>
          {summary && summary.progress.length > 0 ? (
            <div className="pt-1">
              <div className="label-caps mb-1.5">Progress</div>
              <ul className="space-y-1">
                {summary.progress.map((p, idx) => (
                  <li
                    key={idx}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-primary shrink-0 font-mono">
                      ▲ +{p.delta.toFixed(2)} kg
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs">
              No volume increase vs last session.
            </div>
          )}
        </div>
        <DialogFooter className="border-t px-5 py-4">
          <Button type="button" onClick={onClose}>
            Go to dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
