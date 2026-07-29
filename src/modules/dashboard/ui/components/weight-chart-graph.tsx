"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { parseISO, format } from "date-fns";
import {
  ChartRangeSelect,
  filterByDateRange,
  useChartRange,
} from "./chart-range";

export function WeightChartGraph({
  data,
}: {
  data: { date: string; weight: number }[];
}) {
  const [range, setRange] = useChartRange("fit-manager-chart-range-weight");
  const filtered = filterByDateRange(data, range);

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <ChartRangeSelect value={range} onChange={setRange} />
      </div>
      {filtered.length === 0 ? (
        <div className="text-muted-foreground flex aspect-video items-center justify-center text-sm">
          No weight entries in this range
        </div>
      ) : (
        <WeightChart data={filtered} />
      )}
    </div>
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
          domain={["dataMin - 1", "dataMax + 1"]}
          width={40}
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
          dataKey="weight"
          strokeWidth={2}
          activeDot={{ r: 6 }}
          stroke="var(--color-weight)"
        />
      </LineChart>
    </ChartContainer>
  );
}
