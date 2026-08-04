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
import { getExerciseProgress } from "../../actions";
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

type ExerciseProgressChartProps = {
  availableExercises: string[];
};

const STORAGE_KEY = "fit-manager-last-exercise";

export function ExerciseProgressChart({
  availableExercises,
}: ExerciseProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [data, setData] = useState<
    { date: string; weight: number; reps: number; oneRepMax: number }[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const [range, setRange] = useChartRange("fit-manager-chart-range-exercise");
  const filteredData = filterByDateRange(data, range);

  const first = filteredData[0];
  const last = filteredData[filteredData.length - 1];
  const delta = first && last ? last.weight - first.weight : null;

  const fetchProgress = (exercise: string) => {
    startTransition(async () => {
      try {
        const result = await getExerciseProgress(exercise);
        setData(result);
      } catch (error) {
        toast.error("Failed to fetch exercise progress");
        console.error(error);
      }
    });
  };

  useEffect(() => {
    if (availableExercises.length === 0) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    let exerciseToSelect = "";

    if (saved && availableExercises.includes(saved)) {
      exerciseToSelect = saved;
    } else if (availableExercises.length > 0) {
      exerciseToSelect = availableExercises[0] ?? "";
    }

    if (exerciseToSelect) {
      setSelectedExercise(exerciseToSelect);
      fetchProgress(exerciseToSelect);
    }
  }, []); // Run once on mount

  const handleExerciseChange = (value: string) => {
    setSelectedExercise(value);
    localStorage.setItem(STORAGE_KEY, value);
    fetchProgress(value);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <CardTitle className="shrink-0">Exercise progress</CardTitle>
        <div className="flex min-w-0 items-center gap-2">
          <Select value={selectedExercise} onValueChange={handleExerciseChange}>
            <SelectTrigger
              size="sm"
              className="min-w-[120px] flex-1 sm:max-w-[200px]"
            >
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              {availableExercises.map((exercise) => (
                <SelectItem key={exercise} value={exercise}>
                  {exercise}
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
            last{" "}
            <span className="text-foreground">
              {last.weight} kg × {last.reps}
            </span>
          </span>
          <span>
            e1RM <span className="text-primary">{last.oneRepMax} kg</span>
          </span>
          {delta != null && delta !== 0 ? (
            <span className="text-primary">
              {delta > 0 ? "▲ +" : "▼ "}
              {Math.abs(delta)} kg / {rangeLabel(range)}
            </span>
          ) : null}
        </CardContent>
      ) : null}

      <CardContent>
        {!selectedExercise ? (
          <EmptyState>Select an exercise to view progress</EmptyState>
        ) : isPending ? (
          <EmptyState>Loading...</EmptyState>
        ) : filteredData.length === 0 ? (
          <EmptyState>
            {data.length === 0
              ? "No data available for this exercise"
              : "No data in this range"}
          </EmptyState>
        ) : (
          <ChartContainer
            config={{
              weight: {
                label: "Weight (kg)",
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
                width={40}
                tick={AXIS_TICK}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={formatTooltipDate}
                    formatter={(value, name, item) => {
                      if (name === "weight") {
                        return (
                          <>
                            <div className="text-muted-foreground flex min-w-[130px] items-center gap-2 text-xs">
                              Weight
                              <span className="text-foreground ml-auto font-mono font-medium">
                                {value} kg
                              </span>
                            </div>
                            <div className="text-muted-foreground flex min-w-[130px] items-center gap-2 text-xs">
                              Reps
                              <span className="text-foreground ml-auto font-mono font-medium">
                                {(item.payload as { reps: number }).reps}
                              </span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="weight"
                strokeWidth={2}
                stroke="var(--chart-1)"
                activeDot={{ r: 4 }}
                dot={{
                  r: 3,
                  fill: "var(--card)",
                  stroke: "var(--chart-1)",
                  strokeWidth: 1.5,
                }}
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
