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

type Props = {
  defaultValues: MeasurementsFormValues;
  last?: Partial<MeasurementsFormValues> & { date?: string };
};

export function MeasurementsForm({ defaultValues, last }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MeasurementsFormValues>({
    resolver: zodResolver(
      measurementsSchema,
    ) as unknown as Resolver<MeasurementsFormValues>,
    defaultValues,
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

  const numberField = (
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
            <Input
              type="text"
              inputMode="decimal"
              placeholder={
                last && typeof last[name] === "number"
                  ? `last: ${String(last[name])}`
                  : undefined
              }
              value={
                typeof field.value === "number"
                  ? String(field.value)
                  : (field.value ?? "")
              }
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return field.onChange(undefined);
                const normalized = raw.replace(/,/g, ".");
                // allow digits with at most one dot and digits after
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
          {numberField("bellybutton", "Belly button (cm)")}
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
