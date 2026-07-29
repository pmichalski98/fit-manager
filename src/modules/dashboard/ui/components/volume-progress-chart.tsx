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
import { getTrainingVolumeProgress } from "../../actions";
import { toast } from "sonner";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";

type VolumeProgressChartProps = {
  strengthTrainings: { id: string; name: string }[];
};

const STORAGE_KEY = "fit-manager-last-volume-training";

export function VolumeProgressChart({
  strengthTrainings,
}: VolumeProgressChartProps) {
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>("");
  const [data, setData] = useState<{ date: string; volume: number }[]>([]);
  const [isPending, startTransition] = useTransition();

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
      <CardHeader>
        <CardTitle>Training Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedTrainingId} onValueChange={handleTrainingChange}>
          <SelectTrigger className="w-full sm:w-[280px]">
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
      </CardContent>

      <CardContent>
        <div className="h-[300px] w-full">
          {!selectedTrainingId ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Select a training to view volume progress
            </div>
          ) : isPending ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center">
              No completed sessions for this training yet
            </div>
          ) : (
            <ChartContainer
              config={{
                volume: {
                  label: "Volume (kg)",
                  color: "var(--chart-3)",
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
                  width={50}
                  domain={["auto", "auto"]}
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
                      formatter={(value) => (
                        <div className="text-muted-foreground flex min-w-[130px] items-center gap-2 text-xs">
                          Volume
                          <span className="text-foreground ml-auto font-mono font-medium">
                            {Number(value).toLocaleString()} kg
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
                  activeDot={{ r: 6 }}
                  stroke="var(--chart-3)"
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
