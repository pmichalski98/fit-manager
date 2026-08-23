"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { dateRegex, handleIntegerInput } from "@/lib/utils";
import {
  createOrUpdateDailyLog,
  getDailyLogByDate,
} from "@/modules/body/actions";
import {
  dailyLogSchema,
  type DailyLogFormValues,
} from "@/modules/body/schemas";

/** Just the editable slice of a daily log — macros are synced, never typed. */
export type DailyLogSnapshot = {
  weight: string | null;
  kcal: number | null;
  steps: number | null;
};

type Props = {
  /** YYYY-MM-DD the dialog opens on. */
  date: string;
  /**
   * Known values for `date`. `null` means "known to be empty"; omitting it
   * means "unknown" and the dialog fetches the day when it opens.
   */
  log?: DailyLogSnapshot | null;
  /** Today as YYYY-MM-DD, computed on the server to avoid a hydration mismatch. */
  today: string;
  children: ReactNode;
};

function toFormValues(
  date: string,
  log: DailyLogSnapshot | null | undefined,
): DailyLogFormValues {
  return {
    date,
    weight: log?.weight ?? "",
    kcal: log?.kcal ?? undefined,
    steps: log?.steps ?? undefined,
  };
}

export function DailyLogDialog({ date, log, today, children }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDate, startLoadingDate] = useTransition();

  const form = useForm<DailyLogFormValues>({
    resolver: zodResolver(dailyLogSchema) as Resolver<DailyLogFormValues>,
    defaultValues: toFormValues(date, log),
  });

  const selectedDate = form.watch("date");

  // The upsert overwrites weight/kcal/steps wholesale, so the form must always
  // hold the values that belong to the selected day — otherwise saving would
  // stamp another day's numbers (or blanks) over the synced kcal and steps.
  const loadDay = (next: string) => {
    if (!dateRegex.test(next)) return;
    startLoadingDate(async () => {
      const { data } = await getDailyLogByDate(next);
      form.reset(toFormValues(next, data));
    });
  };

  const handleDateChange = (next: string) => {
    form.setValue("date", next);
    loadDay(next);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;
    form.reset(toFormValues(date, log));
    if (log === undefined) loadDay(date);
  };

  const onSubmit = async (values: DailyLogFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await createOrUpdateDailyLog(values);
      if (!result.ok) {
        toast.error("Failed to save entry");
        return;
      }
      toast.success(
        `Saved ${format(new Date(`${values.date}T00:00:00`), "d MMM yyyy")}`,
      );
      setOpen(false);
    } catch {
      toast.error("Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBackdated = dateRegex.test(selectedDate) && selectedDate < today;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-[420px]">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Daily entry
          </DialogTitle>
          <DialogDescription className="sr-only">
            Record or correct weight, calories and steps for any past day.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 p-5">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="max-w-[200px] gap-1.5">
                    <FormLabel className="label-caps">Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={today}
                        className="font-mono scheme-light dark:scheme-dark"
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value}
                        onChange={(e) => handleDateChange(e.target.value)}
                      />
                    </FormControl>
                    <span className="text-faint font-mono text-[10px]">
                      {isLoadingDate
                        ? "loading day…"
                        : isBackdated
                          ? "backdated entry"
                          : " "}
                    </span>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel className="label-caps">Weight</FormLabel>
                      <FormControl>
                        <DecimalInput
                          placeholder="—"
                          disabled={isLoadingDate}
                          className="text-center font-mono"
                          {...field}
                        />
                      </FormControl>
                      <span className="text-faint font-mono text-[10px]">
                        kg
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kcal"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel className="label-caps">Calories</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          disabled={isLoadingDate}
                          className="text-center font-mono"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onKeyDown={handleIntegerInput}
                        />
                      </FormControl>
                      <span className="text-faint font-mono text-[10px]">
                        kcal
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="steps"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel className="label-caps">Steps</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="—"
                          disabled={isLoadingDate}
                          className="text-center font-mono"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          onKeyDown={handleIntegerInput}
                        />
                      </FormControl>
                      <span className="text-faint font-mono text-[10px]">
                        steps
                      </span>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <p className="text-faint text-[11px]">
                Blank fields clear that day&apos;s value — calories and steps
                are prefilled from the sync so leaving them alone keeps them.
              </p>
            </div>

            <DialogFooter className="border-t px-5 py-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isLoadingDate}
              >
                {isSubmitting ? "Saving..." : "Save entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
