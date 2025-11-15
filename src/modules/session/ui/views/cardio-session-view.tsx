"use client";

import { useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cardioSessionSchema } from "@/modules/session/schemas";
import { completeCardioSession } from "@/modules/session/actions";
import type { z } from "zod";

type Props = {
  session: { id: string; startAt: string | Date };
  template: { id: string; name: string };
  last?: null | {
    session: { id: string; startAt: string | Date };
    metrics: {
      durationSec: number;
      distanceM: number | null;
      kcal: number | null;
      avgHr: number | null;
      avgSpeedKmh: string | null;
      avgPowerW: number | null;
      notes: string | null;
    } | null;
  };
};

type CardioSessionFormValues = z.infer<typeof cardioSessionSchema>;

export function TrainingCardioSessionView({ session, template, last }: Props) {
  const [elapsed, setElapsed] = useState("00:00:00");
  useEffect(() => {
    const start = new Date(session.startAt).getTime();
    const i = setInterval(() => {
      const diff = Math.max(0, Date.now() - start);
      const h = Math.floor(diff / 3600000)
        .toString()
        .padStart(2, "0");
      const m = Math.floor((diff % 3600000) / 60000)
        .toString()
        .padStart(2, "0");
      const s = Math.floor((diff % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(i);
  }, [session.startAt]);

  const defaultsFromLast: CardioSessionFormValues = {
    durationSec: last?.metrics?.durationSec ?? 0,
    distanceM: last?.metrics?.distanceM ?? undefined,
    kcal: last?.metrics?.kcal ?? undefined,
    avgHr: last?.metrics?.avgHr ?? undefined,
    avgSpeedKmh:
      last?.metrics?.avgSpeedKmh != null
        ? Number(last.metrics.avgSpeedKmh)
        : undefined,
    avgPowerW: last?.metrics?.avgPowerW ?? undefined,
    notes: last?.metrics?.notes ?? "",
    // sessionId is added in action; optional here
  } as unknown as CardioSessionFormValues;

  const form = useForm<CardioSessionFormValues>({
    resolver: zodResolver(
      cardioSessionSchema,
    ) as Resolver<CardioSessionFormValues>,
    defaultValues: defaultsFromLast,
  });

  const onSubmit = async (values: CardioSessionFormValues) => {
    try {
      await completeCardioSession({ sessionId: session.id, ...values });
      toast.success("Session saved");
    } catch {
      toast.error("Failed to save session");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{template.name}</h1>
        <div className="text-muted-foreground">Time: {elapsed}</div>
      </div>
      {last?.metrics ? (
        <Alert className="bg-muted/40 border-border">
          <History />
          <AlertDescription>
            <span className="font-medium">
              Using values from your last session
            </span>{" "}
            <span className="text-muted-foreground">
              (
              {new Date(last.session.startAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
              ) — adjust as needed.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="durationSec"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (sec)</FormLabel>
                  <FormControl>
                    <Input type="number" inputMode="numeric" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="kcal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kcal</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distanceM"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Distance (m)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avgHr"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avg HR</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avgSpeedKmh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avg Speed (km/h)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avgPowerW"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avg Power (W)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Complete session</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
