"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History } from "lucide-react";
import { format } from "date-fns";
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
import { NumberFormField } from "@/modules/session/ui/components/number-form-field";
import { DateFormField } from "@/components/date-form-field";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import { completeCardioSession } from "@/modules/session/actions";
import {
  cardioSessionSchema,
  type CardioSessionFormValues,
} from "@/modules/session/schemas";
import type {
  TrainingSession,
  TrainingSessionCardio,
} from "@/server/db/schema";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  template: { id: string; name: string };
  last?: null | {
    session: TrainingSession;
    metrics: TrainingSessionCardio;
  };
};

export function CardioSessionView({ template, last }: Props) {
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
      date: getTodayDateYYYYMMDD(),
    },
  });

  const onSubmit = async (values: CardioSessionFormValues) => {
    try {
      await completeCardioSession(values);
      toast.success("Session saved");
    } catch {
      toast.error("Failed to save session");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{template.name}</h1>
      {last?.metrics ? (
        <Alert variant="accent">
          <History />
          <AlertDescription>
            <span className="font-medium">
              Using values from your last session
            </span>{" "}
            <span className="text-muted-foreground">
              ({format(new Date(last.session.date), "MMM d, yyyy")}) — adjust as
              needed.
            </span>
          </AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <DateFormField control={form.control} name="date" label="Date" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberFormField
              control={form.control}
              name="durationMin"
              label="Duration (min)"
            />
            <NumberFormField control={form.control} name="kcal" label="Kcal" />
            <NumberFormField
              control={form.control}
              name="distanceKm"
              label="Distance (km)"
            />
            <NumberFormField
              control={form.control}
              name="cadence"
              label="Cadence (rpm)"
            />
            <NumberFormField
              control={form.control}
              name="avgHr"
              label="Avg Heart Rate (bpm)"
            />
            <NumberFormField
              control={form.control}
              name="avgSpeedKmh"
              label="Avg Speed (km/h)"
            />
            <NumberFormField
              control={form.control}
              name="avgPowerW"
              label="Avg Power (W)"
            />
          </div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Add any notes about the session"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit">Complete session</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
