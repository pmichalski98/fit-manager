"use client";

import { useState, useTransition, useEffect } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { parseISO, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getExerciseProgress } from "../../actions";
import { toast } from "sonner";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardAction,
} from "@/components/ui/card";

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

  // Calculate current estimated 1RM (based on latest data point)
  const lastDataPoint = data[data.length - 1];
  const currentOneRepMax = lastDataPoint ? lastDataPoint.oneRepMax : 0;

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
      <CardHeader>
        <CardTitle>Exercise Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Select value={selectedExercise} onValueChange={handleExerciseChange}>
            <SelectTrigger className="w-full sm:w-[280px]">
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
        </div>
      </CardContent>

      <CardContent>
        <div className="h-[300px] w-full">
          {!selectedExercise ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Select an exercise to view progress
            </div>
          ) : isPending ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              No data available for this exercise
            </div>
          ) : (
            <ChartContainer
              config={{
                weight: {
                  label: "Weight (kg)",
                  color: "var(--chart-1)",
                },
              }}
              className="h-full w-full"
            >
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
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
                  domain={["dataMin - 5", "dataMax + 5"]}
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
                  activeDot={{ r: 6 }}
                  stroke="var(--chart-1)"
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
