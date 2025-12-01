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
import { parseISO, format } from "date-fns";
import { useMemo } from "react";

export function KcalChartGraph({
  data,
}: {
  data: { date: string; kcal: number }[];
}) {
  const medianKcal = useMemo(() => {
    if (!data.length) return 0;
    const sorted = [...data].map((d) => d.kcal).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const midVal = sorted[mid];
    const midPrev = sorted[mid - 1];
    if (midVal === undefined) return 0;
    return sorted.length % 2 !== 0
      ? midVal
      : (midPrev !== undefined ? midPrev + midVal : midVal) / 2;
  }, [data]);

  return (
    <ChartContainer
      config={{
        kcal: {
          label: "Calories (kcal)",
          color: "var(--chart-2)",
        },
      }}
      className="h-full w-full"
    >
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
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={40}
          domain={["dataMin - 100", "dataMax + 100"]}
        />
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
        <Line
          type="monotone"
          dataKey="kcal"
          strokeWidth={2}
          dot={false}
          stroke="var(--color-kcal)"
        />
        {medianKcal > 0 && (
          <ReferenceLine
            y={medianKcal}
            stroke="var(--chart-4)"
            strokeWidth={2}
            label={{
              position: "insideBottomRight",
              value: `Median: ${medianKcal}`,
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
        )}
      </LineChart>
    </ChartContainer>
  );
}
