"use client";

import { cn } from "@/lib/utils";
import { isBefore, parseISO, subMonths, subYears } from "date-fns";
import { useEffect, useState } from "react";

export type ChartRange = "1m" | "3m" | "6m" | "1y" | "all";

const RANGES: { value: ChartRange; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "MAX" },
];

const RANGE_LABELS: Record<ChartRange, string> = {
  "1m": "1M",
  "3m": "3M",
  "6m": "6M",
  "1y": "1Y",
  all: "MAX",
};

export const rangeLabel = (range: ChartRange) => RANGE_LABELS[range];

const isChartRange = (v: unknown): v is ChartRange =>
  typeof v === "string" && v in RANGE_LABELS;

export function useChartRange(
  storageKey: string,
  defaultRange: ChartRange = "3m",
) {
  const [range, setRange] = useState<ChartRange>(defaultRange);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (isChartRange(saved)) setRange(saved);
  }, [storageKey]);

  const update = (value: ChartRange) => {
    setRange(value);
    localStorage.setItem(storageKey, value);
  };

  return [range, update] as const;
}

export function filterByDateRange<T extends { date: string }>(
  data: T[],
  range: ChartRange,
): T[] {
  if (range === "all") return data;
  const start =
    range === "1y"
      ? subYears(new Date(), 1)
      : subMonths(new Date(), { "1m": 1, "3m": 3, "6m": 6 }[range]);
  return data.filter((d) => {
    try {
      return !isBefore(parseISO(d.date), start);
    } catch {
      return true;
    }
  });
}

export function ChartRangeSelect({
  value,
  onChange,
}: {
  value: ChartRange;
  onChange: (value: ChartRange) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-0.5 font-mono text-[10px] font-semibold">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-[4px] px-2 py-[3px] transition-colors",
            value === r.value
              ? "bg-primary text-primary-foreground"
              : "text-faint hover:text-foreground",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
