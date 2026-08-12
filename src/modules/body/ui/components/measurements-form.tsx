"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { differenceInDays, format } from "date-fns";
import { HistoryIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

import { createOrUpdateMeasurements } from "@/modules/body/actions";
import {
  measurementsSchema,
  type MeasurementsFormValues,
} from "@/modules/body/schemas";
import { getTodayDateYYYYMMDD } from "@/lib/utils";
import type { BodyMeasurement } from "@/server/db/schema";

const MEASUREMENT_FIELDS = [
  { name: "neck", label: "Neck" },
  { name: "chest", label: "Chest" },
  { name: "waist", label: "Waist" },
  { name: "bellybutton", label: "Belly button" },
  { name: "hips", label: "Hips" },
  { name: "biceps", label: "Biceps" },
  { name: "thigh", label: "Thigh" },
] as const;

type Props = {
  last: BodyMeasurement | null;
  onSuccess?: () => void;
};

export function MeasurementsForm({ last, onSuccess }: Props) {
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
      onSuccess?.();
    } catch {
      toast.error("Failed to save measurements");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ageDays = last?.date
    ? differenceInDays(new Date(), new Date(last.date))
    : null;
  const isStale = ageDays != null && ageDays > 14;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 p-5">
          {isStale ? (
            <div className="border-cardio/40 bg-cardio/10 flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-xs">
              <HistoryIcon className="text-cardio size-3.5 shrink-0" />
              <span>
                Last measurements{" "}
                <span className="text-cardio font-mono">
                  {ageDays} days ago
                </span>{" "}
                ({format(new Date(last!.date), "d MMM yyyy")}) — save new ones
                to keep your progress accurate.
              </span>
            </div>
          ) : null}

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="max-w-[200px]">
                <FormLabel className="label-caps">Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    className="font-mono scheme-light dark:scheme-dark"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MEASUREMENT_FIELDS.map(({ name, label }) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel className="label-caps">{label}</FormLabel>
                    <FormControl>
                      <DecimalInput
                        className="text-center font-mono"
                        {...field}
                      />
                    </FormControl>
                    <span className="text-faint font-mono text-[10px]">
                      {last?.[name] ? `prev. ${last[name]} cm` : " "}
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="label-caps">Notes</FormLabel>
                <FormControl>
                  <Input type="text" placeholder="Optional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save measurements"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
