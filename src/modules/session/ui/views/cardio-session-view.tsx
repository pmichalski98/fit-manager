"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { completeCardioSession } from "@/modules/session/actions";
import {
  cardioSessionSchema,
  type CardioSessionFormValues,
} from "@/modules/session/schemas";
import type {
  TrainingSession,
  TrainingSessionCardio,
} from "@/server/db/schema";

type Props = {
  template: { id: string; name: string };
  last?: null | {
    session: TrainingSession;
    metrics: TrainingSessionCardio;
  };
};

export function CardioSessionView({ template, last }: Props) {
  const start = new Date().getTime();

  const form = useForm<CardioSessionFormValues>({
    resolver: zodResolver(
      cardioSessionSchema,
    ) as Resolver<CardioSessionFormValues>,
    defaultValues: {
      avgHr: last?.metrics?.avgHr ?? undefined,
      avgSpeedKmh: last?.metrics?.avgSpeedKmh ?? undefined,
      avgPowerW: last?.metrics?.avgPowerW ?? undefined,
      notes: last?.metrics?.notes ?? "",
      durationMin: last?.metrics?.durationMin ?? 0,
      distanceKm: last?.metrics?.distanceKm ?? undefined,
      kcal: last?.metrics?.kcal ?? undefined,
      cadence: last?.metrics?.cadence ?? undefined,
      trainingId: template.id,
      startAt: last?.session.startAt ?? new Date(),
    },
  });

  const onSubmit = async (values: CardioSessionFormValues) => {
    try {
      await completeCardioSession({
        ...values,
        startAt: new Date(start),
      });
      toast.success("Session saved");
    } catch {
      toast.error("Failed to save session");
    }
  };

  return (
    <div className="space-y-6">
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
              name="durationMin"
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
              name="distanceKm"
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
