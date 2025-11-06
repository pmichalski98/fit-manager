"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { createOrUpdateDailyLog } from "@/modules/body/actions";
import {
  dailyLogSchema,
  type DailyLogFormValues,
} from "@/modules/body/schemas";

type Props = {
  defaultValues: DailyLogFormValues;
  hints?: { kcal?: string };
  alreadyFilledToday?: boolean;
};

export function DailyLogForm({
  defaultValues,
  hints,
  alreadyFilledToday,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(
      dailyLogSchema,
    ) as unknown as Resolver<DailyLogFormValues>,
    defaultValues,
  });

  const onSubmit = async (values: DailyLogFormValues) => {
    try {
      setIsSubmitting(true);
      await createOrUpdateDailyLog(values);
      toast.success("Daily log saved");
    } catch (_err) {
      toast.error("Failed to save daily log");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {alreadyFilledToday ? (
          <Alert>
            <AlertDescription>You already filled this today.</AlertDescription>
          </Alert>
        ) : null}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                    type="text"
                    inputMode="decimal"
                    value={
                      typeof field.value === "number"
                        ? String(field.value)
                        : (field.value ?? "")
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") return field.onChange(undefined);
                      const normalized = raw.replace(/,/g, ".");
                      if (/^\d*(\.\d*)?$/.test(normalized)) {
                        field.onChange(normalized);
                      }
                    }}
                  />
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
                <FormLabel>Calories (kcal)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={
                      typeof field.value === "number"
                        ? String(field.value)
                        : (field.value ?? "")
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") return field.onChange(undefined);
                      const digitsOnly = raw.replace(/\D+/g, "");
                      field.onChange(digitsOnly);
                    }}
                  />
                </FormControl>
                {hints?.kcal ? (
                  <FormDescription>{hints.kcal}</FormDescription>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
