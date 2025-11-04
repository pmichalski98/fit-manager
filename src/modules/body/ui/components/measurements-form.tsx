"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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

type Props = {
  defaultValues: MeasurementsFormValues;
};

export function MeasurementsForm({ defaultValues }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeasurementsFormValues>({
    resolver: zodResolver(measurementsSchema),
    defaultValues,
  });

  const onSubmit = async (values: MeasurementsFormValues) => {
    try {
      setIsSubmitting(true);
      await createOrUpdateMeasurements(values);
      toast.success("Measurements saved");
    } catch (err) {
      toast.error("Failed to save measurements");
    } finally {
      setIsSubmitting(false);
    }
  };

  const numberField = (
    name: keyof MeasurementsFormValues,
    label: string,
    step = "0.1",
  ) => (
    <FormField
      key={String(name)}
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="number" step={step} inputMode="decimal" {...field} />
          </FormControl>
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
          {numberField("neck", "Neck (cm)")}
          {numberField("chest", "Chest (cm)")}
          {numberField("waist", "Waist (cm)")}
          {numberField("hips", "Hips (cm)")}
          {numberField("biceps", "Biceps (cm)")}
          {numberField("thigh", "Thigh (cm)")}
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
