"use client";

import { format, isBefore, subDays, subMonths, subYears } from "date-fns";
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

/** Day counts are inclusive of today, so "7D" spans today and the 6 days before. */
const PRESETS = [
  { label: "7D", from: (today: Date) => subDays(today, 6) },
  { label: "14D", from: (today: Date) => subDays(today, 13) },
  { label: "1M", from: (today: Date) => subMonths(today, 1) },
  { label: "3M", from: (today: Date) => subMonths(today, 3) },
  { label: "6M", from: (today: Date) => subMonths(today, 6) },
  { label: "1Y", from: (today: Date) => subYears(today, 1) },
] as const;

function presetRange(preset: (typeof PRESETS)[number]): DateRange {
  const today = new Date();
  return { from: preset.from(today), to: today };
}

function sameDay(a: Date | undefined, b: Date | undefined): boolean {
  return (
    a !== undefined &&
    b !== undefined &&
    formatDateYYYYMMDD(a) === formatDateYYYYMMDD(b)
  );
}

export function ExportDialog() {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [pending, setPending] = useState<"copy" | "download" | null>(null);

  const complete = range?.from !== undefined && range?.to !== undefined;

  // Two clicks define a range: the first sets one end, the second the other
  // (in either order), and a third starts over. react-day-picker's built-in
  // range logic instead edits whichever endpoint is nearest, which makes a
  // click on an already-selected range hard to predict.
  const handleDayClick = (day: Date) => {
    setRange((prev) => {
      if (!prev?.from || prev.to) return { from: day, to: undefined };
      return isBefore(day, prev.from)
        ? { from: day, to: prev.from }
        : { from: prev.from, to: day };
    });
  };

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
            Exports weight, steps, nutrition, training and body measurements as
            Markdown — paste it into an AI chat to analyze your progress.
          </DialogDescription>

          <div className="bg-input-bg border-input flex w-fit flex-wrap gap-0.5 rounded-sm border p-0.5">
            {PRESETS.map((preset) => {
              const target = presetRange(preset);
              const active =
                sameDay(range?.from, target.from) &&
                sameDay(range?.to, target.to);
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setRange(presetRange(preset))}
                  className={cn(
                    "rounded-[4px] px-2.5 py-[5px] font-mono text-[11px] transition-colors",
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
              onSelect={(_, clickedDay) => handleDayClick(clickedDay)}
              defaultMonth={range?.from}
              disabled={{ after: new Date() }}
              className="w-full bg-transparent p-0 font-mono [--cell-size:--spacing(12)]"
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
                : range?.from
                  ? `${format(range.from, "d MMM yyyy")} — pick an end date`
                  : "Pick a start and an end date"}
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
