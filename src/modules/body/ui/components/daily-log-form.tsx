"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { getTodayDateYYYYMMDD, handleIntegerInput } from "@/lib/utils";
import {
  createOrUpdateDailyLog,
  getDailyLogByDate,
} from "@/modules/body/actions";
import {
  dailyLogSchema,
  type DailyLogFormValues,
} from "@/modules/body/schemas";
import type { DailyLog } from "@/server/db/schema";

type Props = {
  caloricGoal: number | null;
  lastDailyLog: DailyLog | null;
};

export function DailyLogForm({ caloricGoal, lastDailyLog }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(dailyLogSchema) as Resolver<DailyLogFormValues>,
    defaultValues: {
      date: getTodayDateYYYYMMDD(),
      weight: lastDailyLog?.weight ?? "",
      kcal: lastDailyLog?.kcal ?? undefined,
    },
  });

  const selectedDate = form.watch("date");
  const today = getTodayDateYYYYMMDD();
  const previousDateRef = useRef(today);

  // Fetch data when date changes (but not on initial mount)
  useEffect(() => {
    // Skip if the date hasn't actually changed
    if (previousDateRef.current === selectedDate) {
      return;
    }

    previousDateRef.current = selectedDate;

    const fetchDailyLogForDate = async () => {
      if (!selectedDate) return;

      setIsLoading(true);
      try {
        const result = await getDailyLogByDate(selectedDate);

        if (result.ok && result.data) {
          console.log("result.data", result.data);
          // If data exists for this date, populate the form
          form.setValue("weight", result.data.weight ?? "");
          form.setValue(
            "kcal",
            result.data.kcal === 0 || result.data.kcal === null
              ? undefined
              : result.data.kcal,
          );
        } else {
          // If no data exists, clear the form fields
          form.setValue("weight", "");
          form.setValue("kcal", undefined);
        }
      } catch (error) {
        console.error("Failed to fetch daily log:", error);
        toast.error("Failed to load data for selected date");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDailyLogForDate();
  }, [selectedDate, form]);

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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="decimal"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>

                <div className="flex min-h-6 flex-col gap-1">
                  {lastDailyLog?.weight &&
                    lastDailyLog.date === today &&
                    selectedDate === today && (
                      <FormDescription className="text-primary font-bold">
                        Already filled today.
                      </FormDescription>
                    )}

                  {field.value && selectedDate !== today && (
                    <FormDescription className="text-primary font-bold">
                      Already filled for this day.
                    </FormDescription>
                  )}

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kcal"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between gap-2">
                  <FormLabel>Calories (kcal)</FormLabel>
                  {caloricGoal && (
                    <FormLabel className="text-primary text-xs">
                      Caloric goal: {caloricGoal} kcal
                    </FormLabel>
                  )}
                </div>

                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : Number(value));
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    onKeyDown={handleIntegerInput}
                    disabled={isLoading}
                  />
                </FormControl>

                <div className="flex min-h-6 flex-col gap-1">
                  <FormMessage />

                  {lastDailyLog?.kcal &&
                    lastDailyLog.date === today &&
                    selectedDate === today && (
                      <FormDescription className="text-primary font-bold">
                        Already filled today.
                      </FormDescription>
                    )}

                  {field.value && selectedDate !== today && (
                    <FormDescription className="text-primary font-bold">
                      Already filled for this day.
                    </FormDescription>
                  )}
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Saving..." : isLoading ? "Loading..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
