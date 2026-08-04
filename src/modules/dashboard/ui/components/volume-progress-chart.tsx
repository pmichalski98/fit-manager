"use client";

import { useState, useTransition, useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTrainingVolumeProgress } from "../../actions";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartRangeSelect,
  filterByDateRange,
  rangeLabel,
  useChartRange,
} from "./chart-range";
import {
  AXIS_TICK,
  CHART_ASPECT,
  GRID_STROKE,
  formatDateTick,
  formatTooltipDate,
} from "./chart-style";

type VolumeProgressChartProps = {
  strengthTrainings: { id: string; name: string }[];
};

const STORAGE_KEY = "fit-manager-last-volume-training";

const formatVolume = (v: number) =>
  String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function VolumeProgressChart({
  strengthTrainings,
}: VolumeProgressChartProps) {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>("");
  const [data, setData] = useState<{ date: string; volume: number }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [range, setRange] = useChartRange("fit-manager-chart-range-volume");
  const filteredData = filterByDateRange(data, range);

  const first = filteredData[0];
  const last = filteredData[filteredData.length - 1];
  const volumePct =
    first && last && first.volume > 0
      ? ((last.volume - first.volume) / first.volume) * 100
      : null;

  const fetchProgress = (trainingId: string) => {
    startTransition(async () => {
      try {
        const result = await getTrainingVolumeProgress(trainingId);
        setData(result);
      } catch (error) {
        toast.error("Failed to fetch training volume");
        console.error(error);
      }
    });
  };

  useEffect(() => {
    if (strengthTrainings.length === 0) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const trainingToSelect =
      saved && strengthTrainings.some((t) => t.id === saved)
        ? saved
        : (strengthTrainings[0]?.id ?? "");

    if (trainingToSelect) {
      setSelectedTrainingId(trainingToSelect);
      fetchProgress(trainingToSelect);
    }
  }, []); // Run once on mount

  const handleTrainingChange = (value: string) => {
    setSelectedTrainingId(value);
    localStorage.setItem(STORAGE_KEY, value);
    fetchProgress(value);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle className="shrink-0">Training volume</CardTitle>
        <div className="flex min-w-0 items-center gap-2">
          <Select
            value={selectedTrainingId}
            onValueChange={handleTrainingChange}
          >
            <SelectTrigger
              size="sm"
              className="min-w-[120px] flex-1 sm:max-w-[200px]"
            >
              <SelectValue placeholder="Select training" />
            </SelectTrigger>
            <SelectContent>
              {strengthTrainings.map((training) => (
                <SelectItem key={training.id} value={training.id}>
                  {training.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ChartRangeSelect value={range} onChange={setRange} />
        </div>
      </CardHeader>

      {last ? (
        <CardContent className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
          <span>
            last session{" "}
            <span className="text-foreground">
              {formatVolume(last.volume)} kg
            </span>
          </span>
          {volumePct != null && Math.abs(volumePct) >= 0.05 ? (
            <span className="text-primary">
              {volumePct > 0 ? "▲ +" : "▼ "}
              {Math.abs(volumePct).toFixed(1)}% / {rangeLabel(range)}
            </span>
          ) : null}
        </CardContent>
      ) : null}

      <CardContent>
        {!selectedTrainingId ? (
          <EmptyState>Select a training to view volume progress</EmptyState>
        ) : isPending ? (
          <EmptyState>Loading...</EmptyState>
        ) : filteredData.length === 0 ? (
          <EmptyState>
            {data.length === 0
              ? "No completed sessions for this training yet"
              : "No sessions in this range"}
          </EmptyState>
        ) : (
          <ChartContainer
            config={{
              volume: {
                label: "Volume (kg)",
                color: "var(--chart-1)",
              },
            }}
            className={CHART_ASPECT}
          >
            <LineChart
              data={filteredData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
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
                width={50}
                tick={AXIS_TICK}
                domain={["auto", "auto"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={formatTooltipDate}
                    formatter={(value) => (
                      <div className="text-muted-foreground flex min-w-[130px] items-center gap-2 text-xs">
                        Volume
                        <span className="text-foreground ml-auto font-mono font-medium">
                          {formatVolume(Number(value))} kg
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="volume"
                strokeWidth={2}
                stroke="var(--chart-1)"
                activeDot={{ r: 4 }}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex aspect-video items-center justify-center font-mono text-xs">
      {children}
    </div>
  );
}
