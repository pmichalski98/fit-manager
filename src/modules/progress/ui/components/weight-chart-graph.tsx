"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
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
  makeLastPointDot,
} from "./chart-style";

export function WeightChartGraph({
  data,
}: {
  data: { date: string; weight: number }[];
}) {
  const [range, setRange] = useChartRange("fit-manager-chart-range-weight");
  const filtered = filterByDateRange(data, range);
  const current = data[data.length - 1]?.weight;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle>
          Weight
          {current != null ? (
            <span className="text-primary ml-1.5 font-mono text-[11px] font-semibold tracking-normal normal-case">
              {current.toFixed(1)} kg
            </span>
          ) : null}
        </CardTitle>
        <ChartRangeSelect value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-muted-foreground flex aspect-video items-center justify-center font-mono text-xs">
            No weight entries in this range
          </div>
        ) : (
          <WeightChart data={filtered} />
        )}
      </CardContent>
    </Card>
  );
}

function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  return (
    <ChartContainer
      config={{
        weight: {
          label: "Weight (kg)",
          color: "var(--chart-1)",
        },
      }}
      className={CHART_ASPECT}
    >
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          domain={["dataMin - 1", "dataMax + 1"]}
          width={40}
          tick={AXIS_TICK}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={formatTooltipDate} />}
        />
        <Area
          type="monotone"
          dataKey="weight"
          strokeWidth={2}
          stroke="var(--color-weight)"
          fill="url(#weightFill)"
          activeDot={{ r: 4 }}
          dot={makeLastPointDot(data.length - 1)}
        />
      </AreaChart>
    </ChartContainer>
  );
}
