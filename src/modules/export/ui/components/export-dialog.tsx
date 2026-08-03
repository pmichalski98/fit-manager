"use client";

import { format, subMonths, subYears } from "date-fns";
import { Copy, Download, FileDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { cn, formatDateYYYYMMDD, getTodayDateYYYYMMDD } from "@/lib/utils";
import {
  useChartRange,
  type ChartRange,
} from "@/modules/dashboard/ui/components/chart-range";
import { exportDataForAnalysis } from "@/modules/export/actions";

type ExportRange = Exclude<ChartRange, "all">;

const RANGES: { value: ExportRange; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
];

function resolveRange(range: ChartRange) {
  const now = new Date();
  const start =
    range === "1y" || range === "all"
      ? subYears(now, 1)
      : subMonths(now, { "1m": 1, "3m": 3, "6m": 6 }[range]);
  return { start: formatDateYYYYMMDD(start), end: getTodayDateYYYYMMDD() };
}

export function ExportDialog() {
  const [range, setRange] = useChartRange("export-range", "1m");
  const [pending, setPending] = useState<"copy" | "download" | null>(null);

  const resolved = resolveRange(range);

  const runExport = async (mode: "copy" | "download") => {
    try {
      setPending(mode);
      const result = await exportDataForAnalysis(resolveRange(range));
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
        <Button variant="outline" size="sm">
          <FileDown className="size-4" />
          Export for AI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export data for AI analysis</DialogTitle>
          <DialogDescription>
            Exports weight, nutrition, training and body measurements as
            Markdown — paste it into an AI chat to analyze your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="bg-muted flex w-fit items-center gap-0.5 rounded-lg p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  range === r.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground text-sm">
            {format(new Date(resolved.start), "MMM d, yyyy")} –{" "}
            {format(new Date(resolved.end), "MMM d, yyyy")}
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => runExport("copy")}
          >
            {pending === "copy" ? <Spinner /> : <Copy className="size-4" />}
            Copy to clipboard
          </Button>
          <Button
            disabled={pending !== null}
            onClick={() => runExport("download")}
          >
            {pending === "download" ? (
              <Spinner />
            ) : (
              <Download className="size-4" />
            )}
            Download .md
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
