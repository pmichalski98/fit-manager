"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History } from "lucide-react";
import { format } from "date-fns";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

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
      maxSpeedKmh: last?.metrics?.maxSpeedKmh ?? undefined,
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
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">
          {template.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-[11px] font-medium tracking-[0.08em] uppercase">
          Cardio session · log your ride
        </p>
      </div>

      {last?.metrics ? (
        <div className="bg-card flex flex-wrap items-baseline gap-x-2.5 gap-y-1 rounded-lg border px-3.5 py-2.5 text-xs">
          <History className="text-muted-foreground size-3.5 shrink-0 self-center" />
          <span className="font-semibold">Values from your last session</span>
          <span className="text-muted-foreground font-mono">
            {format(new Date(last.session.date), "MMM d, yyyy")}
          </span>
          <span className="text-muted-foreground">adjust as needed.</span>
        </div>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="bg-card rounded-[10px] border"
        >
          <div className="flex flex-col gap-4 p-5">
            <DateFormField control={form.control} name="date" label="Date" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumberFormField
                control={form.control}
                name="durationMin"
                label="Duration (min)"
              />
              <NumberFormField
                control={form.control}
                name="kcal"
                label="Kcal"
              />
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
                name="maxSpeedKmh"
                label="Max Speed (km/h)"
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
          </div>
          <div className="flex justify-end border-t px-5 py-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Complete session"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
