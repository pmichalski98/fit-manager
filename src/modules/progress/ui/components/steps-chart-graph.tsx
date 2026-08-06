"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
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

type StepsPoint = { date: string; steps: number };

export function StepsChartGraph({
  data,
  stepsGoal,
}: {
  data: StepsPoint[];
  stepsGoal: number | null;
}) {
  const [range, setRange] = useChartRange("fit-manager-chart-range-steps");
  const filtered = filterByDateRange(data, range);

  const medianSteps = useMemo(() => {
    if (!filtered.length) return null;
    const sorted = filtered.map((d) => d.steps).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const midVal = sorted[mid];
    const midPrev = sorted[mid - 1];
    if (midVal === undefined) return null;
    return sorted.length % 2 !== 0 || midPrev === undefined
      ? midVal
      : (midPrev + midVal) / 2;
  }, [filtered]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle>
          Steps
          {medianSteps != null ? (
            <span className="text-muted-foreground ml-1.5 font-mono text-[11px] font-semibold tracking-normal normal-case">
              med {Math.round(medianSteps)}
            </span>
          ) : null}
        </CardTitle>
        <ChartRangeSelect value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <div className="text-muted-foreground flex aspect-video items-center justify-center font-mono text-xs">
            No step entries in this range
          </div>
        ) : (
          <StepsChart data={filtered} stepsGoal={stepsGoal} />
        )}
      </CardContent>
    </Card>
  );
}

function StepsChart({
  data,
  stepsGoal,
}: {
  data: StepsPoint[];
  stepsGoal: number | null;
}) {
  return (
    <ChartContainer
      config={{
        steps: {
          label: "Steps",
          color: "var(--chart-1)",
        },
      }}
      className={CHART_ASPECT}
    >
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
          width={44}
          tick={AXIS_TICK}
          domain={[
            (dataMin: number) =>
              Math.max(
                0,
                Math.min(
                  dataMin - 1000,
                  stepsGoal != null ? stepsGoal - 1000 : Infinity,
                ),
              ),
            (dataMax: number) =>
              Math.max(
                dataMax + 1000,
                stepsGoal != null ? stepsGoal + 1000 : -Infinity,
              ),
          ]}
        />
        <ChartTooltip
          content={<ChartTooltipContent labelFormatter={formatTooltipDate} />}
        />
        <Line
          type="monotone"
          dataKey="steps"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4 }}
          stroke="var(--color-steps)"
        />
        {stepsGoal != null && (
          <ReferenceLine
            y={stepsGoal}
            stroke="var(--cardio)"
            strokeWidth={1}
            strokeDasharray="4 4"
            label={{
              position: "insideTopRight",
              value: `goal ${stepsGoal}`,
              fill: "var(--cardio)",
              fontSize: 11,
              fontFamily: "var(--font-plex-mono), monospace",
            }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
