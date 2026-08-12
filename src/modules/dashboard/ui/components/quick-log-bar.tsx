"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TargetIcon } from "lucide-react";

import { cn, getTodayDateYYYYMMDD, handleIntegerInput } from "@/lib/utils";
import { createOrUpdateDailyLog } from "@/modules/body/actions";
import {
  dailyLogSchema,
  type DailyLogFormValues,
} from "@/modules/body/schemas";
import type { DailyGoalSettings } from "@/modules/body/repositories/user.repo";
import { DailyGoalsDialog } from "@/modules/body/ui/components/daily-goals-dialog";
import { MeasurementsDialog } from "@/modules/body/ui/components/measurements-dialog";
import type { BodyMeasurement, DailyLog } from "@/server/db/schema";

type Props = {
  todayLog: DailyLog | null;
  latestLog: DailyLog | null;
  goalSettings: DailyGoalSettings | null;
  lastMeasurement: BodyMeasurement | null;
  measurementsAgeDays: number | null;
};

export function QuickLogBar({
  todayLog,
  latestLog,
  goalSettings,
  lastMeasurement,
  measurementsAgeDays,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(dailyLogSchema) as Resolver<DailyLogFormValues>,
    defaultValues: {
      date: getTodayDateYYYYMMDD(),
      weight: todayLog?.weight ?? "",
      kcal: todayLog?.kcal ?? undefined,
      steps: todayLog?.steps ?? undefined,
    },
  });

  const onSubmit = async (values: DailyLogFormValues) => {
    try {
      setIsSubmitting(true);
      await createOrUpdateDailyLog(values);
      toast.success("Daily log saved");
    } catch {
      toast.error("Failed to save daily log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ageDays = measurementsAgeDays;
  const isStale = ageDays == null || ageDays > 14;
  const measurementsStatus =
    ageDays == null
      ? "measurements: none yet"
      : ageDays === 0
        ? "measurements: today"
        : ageDays === 1
          ? "measurements: yesterday"
          : `measurements: ${ageDays} days ago`;

  return (
    <div className="bg-card rounded-lg border px-5 py-3.5">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          <span className="section-marker label-caps text-primary shrink-0">
            Today&apos;s entry
          </span>

          <div className="flex items-center gap-2">
            <label className="label-caps tracking-[0.08em]">Weight</label>
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <DecimalInput
                      placeholder={latestLog?.weight ?? "—"}
                      className="h-[30px] w-20 text-center font-mono"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <span className="text-faint font-mono text-[11px]">kg</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="label-caps tracking-[0.08em]">Calories</label>
            <FormField
              control={form.control}
              name="kcal"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      className="h-[30px] w-20 text-center font-mono"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : Number(value),
                        );
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      onKeyDown={handleIntegerInput}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <span className="text-faint font-mono text-[11px]">
              kcal <span className="text-primary">· auto from Fitatu</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="label-caps tracking-[0.08em]">Steps</label>
            <FormField
              control={form.control}
              name="steps"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="—"
                      className="h-[30px] w-20 text-center font-mono"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : Number(value),
                        );
                      }}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      onKeyDown={handleIntegerInput}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <span className="text-faint font-mono text-[11px]">
              {goalSettings?.stepsGoal != null
                ? `/ ${goalSettings.stepsGoal.toLocaleString("en-US").replace(/,/g, " ")}`
                : "steps"}
            </span>
            <DailyGoalsDialog settings={goalSettings}>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Set daily goals"
              >
                <TargetIcon className="size-3.5" />
                <span className="sr-only">Set daily goals</span>
              </Button>
            </DailyGoalsDialog>
          </div>

          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>

          <div className="ml-auto flex items-center gap-2.5">
            <span
              className={cn(
                "font-mono text-[11px]",
                isStale ? "text-cardio" : "text-muted-foreground",
              )}
            >
              {measurementsStatus}
            </span>
            <MeasurementsDialog last={lastMeasurement}>
              <Button type="button" variant="outline" size="sm">
                Update measurements
              </Button>
            </MeasurementsDialog>
          </div>
        </form>
      </Form>
    </div>
  );
}
