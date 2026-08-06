"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartRangeSelect,
  filterByDateRange,
  useChartRange,
} from "./chart-range";
import {
  AXIS_TICK,
  CHART_ASPECT,
  GRID_STROKE,
  formatDateTick,
  formatTooltipDate,
} from "./chart-style";

export type MacroDataPoint = {
  date: string;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

// Dedicated categorical trio (validated for CVD + contrast on light & dark
// surfaces) — the app's --chart-* tokens are an accent ramp, unusable as a
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
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle>Macros</CardTitle>
        <ChartRangeSelect value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-muted-foreground flex aspect-video items-center justify-center font-mono text-xs">
            No macro entries in this range
          </div>
        ) : (
          <MacroChart data={filtered} />
        )}
      </CardContent>
    </Card>
  );
}

function MacroChart({ data }: { data: MacroDataPoint[] }) {
  return (
    <ChartContainer config={MACRO_CONFIG} className={CHART_ASPECT}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={48}
          tick={AXIS_TICK}
          tickFormatter={formatDateTick}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickCount={4}
          width={40}
          tick={AXIS_TICK}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={formatTooltipDate} />}
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
