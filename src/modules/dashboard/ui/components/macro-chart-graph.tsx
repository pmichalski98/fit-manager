"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { parseISO, format } from "date-fns";
import {
  ChartRangeSelect,
  filterByDateRange,
  useChartRange,
} from "./chart-range";

export type MacroDataPoint = {
  date: string;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

// Dedicated categorical trio (validated for CVD + contrast on light & dark
// surfaces) — the app's --chart-* tokens are a green ramp, unusable as a
// categorical palette. Carbs additionally gets a dash pattern as secondary
// encoding for the emerald↔amber CVD pair.
const MACRO_CONFIG = {
  protein: { label: "Protein (g)", color: "#059669" },
  carbs: { label: "Carbs (g)", color: "#d97706" },
  fat: { label: "Fat (g)", color: "#8b5cf6" },
} as const;

export function MacroChartGraph({ data }: { data: MacroDataPoint[] }) {
  const [range, setRange] = useChartRange("fit-manager-chart-range-macros");
  const filtered = filterByDateRange(data, range);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <ChartRangeSelect value={range} onChange={setRange} />
      </div>
      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex aspect-video items-center justify-center text-sm">
          No macro entries in this range
        </div>
      ) : (
        <MacroChart data={filtered} />
      )}
    </div>
  );
}

function MacroChart({ data }: { data: MacroDataPoint[] }) {
  return (
    <ChartContainer config={MACRO_CONFIG} className="h-full w-full">
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={(value: unknown) => {
            if (typeof value !== "string") return "";
            try {
              return format(parseISO(value), "MMM d");
            } catch {
              return value;
            }
          }}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value: unknown) => {
                if (typeof value !== "string") return "";
                try {
                  return format(parseISO(value), "MMM d, yyyy");
                } catch {
                  return value;
                }
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="protein"
          strokeWidth={2}
          dot={false}
          connectNulls
          stroke="var(--color-protein)"
        />
        <Line
          type="monotone"
          dataKey="carbs"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          connectNulls
          stroke="var(--color-carbs)"
        />
        <Line
          type="monotone"
          dataKey="fat"
          strokeWidth={2}
          dot={false}
          connectNulls
          stroke="var(--color-fat)"
        />
      </LineChart>
    </ChartContainer>
  );
}
