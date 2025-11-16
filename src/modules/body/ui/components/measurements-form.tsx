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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { createOrUpdateMeasurements } from "@/modules/body/actions";
import {
  measurementsSchema,
  type MeasurementsFormValues,
} from "@/modules/body/schemas";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import type { BodyMeasurement } from "@/server/db/schema";

type Props = {
  last: BodyMeasurement | null;
};

export function MeasurementsForm({ last }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeasurementsFormValues>({
    resolver: zodResolver(
      measurementsSchema,
    ) as Resolver<MeasurementsFormValues>,
    defaultValues: {
      date: getTodayDateYYYYMMDD(),
      neck: last?.neck ?? "",
      chest: last?.chest ?? "",
      waist: last?.waist ?? "",
      bellybutton: last?.bellybutton ?? "",
      hips: last?.hips ?? "",
      biceps: last?.biceps ?? "",
      thigh: last?.thigh ?? "",
      notes: last?.notes ?? "",
    },
  });

  const onSubmit = async (values: MeasurementsFormValues) => {
    try {
      setIsSubmitting(true);
      await createOrUpdateMeasurements(values);
      toast.success("Measurements saved");
    } catch {
      toast.error("Failed to save measurements");
    } finally {
      setIsSubmitting(false);
    }
  };

  const measurementField = (
    name: keyof MeasurementsFormValues,
    label: string,
    _step = "0.1",
  ) => (
    <FormField
      key={String(name)}
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>

          <FormControl>
            <Input type="number" inputMode="decimal" {...field} />
          </FormControl>
          {last?.[name] ? (
            <FormLabel className="text-primary text-xs font-semibold">
              Previous: {last?.[name]} cm {last.date}
            </FormLabel>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );

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
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {measurementField("neck", "Neck (cm)")}
          {measurementField("chest", "Chest (cm)")}
          {measurementField("waist", "Waist (cm)")}
          {measurementField("bellybutton", "Belly button (cm)")}
          {measurementField("hips", "Hips (cm)")}
          {measurementField("biceps", "Biceps (cm)")}
          {measurementField("thigh", "Thigh (cm)")}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Optional" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
