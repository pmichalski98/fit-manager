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

type ExerciseProgressChartProps = {
  availableExercises: string[];
};

const STORAGE_KEY = "fit-manager-last-exercise";

export function ExerciseProgressChart({
  availableExercises,
}: ExerciseProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [data, setData] = useState<{ date: string; weight: number }[]>([]);
  const [isPending, startTransition] = useTransition();

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
    <div className="space-y-4 overflow-hidden rounded-xl border p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h3 className="font-semibold">Exercise Progress (Max Weight)</h3>
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
    </div>
  );
}
