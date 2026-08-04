"use client";

import { format, subMonths, subYears } from "date-fns";
import { Copy, Download, FileDown } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { cn, formatDateYYYYMMDD } from "@/lib/utils";
import { exportDataForAnalysis } from "@/modules/export/actions";

const PRESETS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
] as const;

function presetRange(months: number): DateRange {
  const today = new Date();
  const from = months === 12 ? subYears(today, 1) : subMonths(today, months);
  return { from, to: today };
}

function sameDay(a: Date | undefined, b: Date | undefined): boolean {
  return (
    a !== undefined &&
    b !== undefined &&
    formatDateYYYYMMDD(a) === formatDateYYYYMMDD(b)
  );
}

export function ExportDialog() {
  const [range, setRange] = useState<DateRange | undefined>(() =>
    presetRange(1),
  );
  const [pending, setPending] = useState<"copy" | "download" | null>(null);

  const complete = range?.from !== undefined && range?.to !== undefined;

  const runExport = async (mode: "copy" | "download") => {
    if (!range?.from || !range?.to) return;
    try {
      setPending(mode);
      const result = await exportDataForAnalysis({
        start: formatDateYYYYMMDD(range.from),
        end: formatDateYYYYMMDD(range.to),
      });
      if (!result.ok) {
        toast.error(result.error ?? "Export failed");
        return;
      }
      if (mode === "copy") {
        await navigator.clipboard.writeText(result.data.markdown);
        toast.success("Copied to clipboard");
      } else {
        const url = URL.createObjectURL(
          new Blob([result.data.markdown], { type: "text/markdown" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = result.data.filename;
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success("Downloaded");
      }
    } catch {
      toast.error("Export failed");
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline-accent" size="sm">
          <FileDown className="size-3.5" />
          Export for AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-[420px]">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Export data for AI
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          <DialogDescription className="text-secondary-foreground text-xs leading-relaxed">
            Exports weight, nutrition, training and body measurements as
            Markdown — paste it into an AI chat to analyze your progress.
          </DialogDescription>

          <div className="bg-input-bg border-input flex w-fit gap-0.5 rounded-sm border p-0.5">
            {PRESETS.map((preset) => {
              const target = presetRange(preset.months);
              const active =
                sameDay(range?.from, target.from) &&
                sameDay(range?.to, target.to);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRange(presetRange(preset.months))}
                  className={cn(
                    "rounded-[4px] px-3.5 py-[5px] font-mono text-[11px] transition-colors",
                    active
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground font-semibold",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Calendar
              mode="range"
              weekStartsOn={1}
              selected={range}
              onSelect={setRange}
              defaultMonth={range?.from}
              disabled={{ after: new Date() }}
              className="w-full bg-transparent p-0 font-mono"
              classNames={{
                caption_label:
                  "text-[11px] font-semibold uppercase tracking-[0.08em] select-none",
                weekday:
                  "text-faint flex-1 text-[10px] font-semibold select-none",
              }}
            />
            <p className="text-secondary-foreground text-center font-mono text-[11px]">
              {range?.from && range?.to
                ? `${format(range.from, "d MMM yyyy")} — ${format(range.to, "d MMM yyyy")}`
                : "Select a date range"}
            </p>
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={pending !== null || !complete}
            onClick={() => runExport("copy")}
          >
            {pending === "copy" ? <Spinner /> : <Copy className="size-3.5" />}
            Copy
          </Button>
          <Button
            size="sm"
            disabled={pending !== null || !complete}
            onClick={() => runExport("download")}
          >
            {pending === "download" ? (
              <Spinner />
            ) : (
              <Download className="size-3.5" />
            )}
            Download .md
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
