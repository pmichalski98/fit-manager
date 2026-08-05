"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { handleIntegerInput } from "@/lib/utils";
import { updateDailyGoals } from "@/modules/body/actions";
import type { DailyGoalSettings } from "@/modules/body/repositories/user.repo";
import { dailyGoalsSchema, type DailyGoalsFormValues } from "../../schemas";

type Props = {
  settings: DailyGoalSettings | null;
  onSaved?: () => void;
};

const KCAL_TOLERANCE_PCT = 5;

type CriterionName =
  | "goalTrainingEnabled"
  | "goalStepsEnabled"
  | "goalWeightEnabled"
  | "goalKcalEnabled";

export function DailyGoalsForm({ settings, onSaved }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<DailyGoalsFormValues>({
    resolver: zodResolver(dailyGoalsSchema) as Resolver<DailyGoalsFormValues>,
    defaultValues: {
      caloricGoal: settings?.caloricGoal ?? undefined,
      stepsGoal: settings?.stepsGoal ?? undefined,
      weeklyTrainingGoal: settings?.weeklyTrainingGoal ?? undefined,
      goalTrainingEnabled: settings?.goalTrainingEnabled ?? true,
      goalStepsEnabled: settings?.goalStepsEnabled ?? true,
      goalWeightEnabled: settings?.goalWeightEnabled ?? true,
      goalKcalEnabled: settings?.goalKcalEnabled ?? true,
    },
  });

  const caloricGoal = form.watch("caloricGoal");
  const stepsGoal = form.watch("stepsGoal");

  const criteria: { name: CriterionName; label: string; hint: string }[] = [
    {
      name: "goalTrainingEnabled",
      label: "Training done",
      hint: "counts toward weekly goal",
    },
    {
      name: "goalStepsEnabled",
      label: "Steps ≥ goal",
      hint: stepsGoal ? formatSteps(Number(stepsGoal)) : "set a goal",
    },
    {
      name: "goalWeightEnabled",
      label: "Weight logged",
      hint: "daily entry",
    },
    {
      name: "goalKcalEnabled",
      label: "Calories on target",
      hint: caloricGoal
        ? `${caloricGoal} ±${KCAL_TOLERANCE_PCT}%`
        : "set a goal",
    },
  ];

  const onSubmit = async (values: DailyGoalsFormValues) => {
    try {
      setIsSubmitting(true);
      const result = await updateDailyGoals(values);
      if (!result.ok) throw new Error(result.error ?? "Failed");
      toast.success("Daily goals updated");
      onSaved?.();
    } catch {
      toast.error("Failed to update daily goals");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-5 p-5">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="caloricGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caloric goal (kcal)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 2500"
                      className="text-center font-mono"
                      {...field}
                      value={field.value ?? ""}
                      onKeyDown={handleIntegerInput}
                    />
                  </FormControl>
                  <p className="text-faint font-mono text-[11px]">
                    tolerance ±{KCAL_TOLERANCE_PCT}%
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stepsGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steps goal / day</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 10000"
                      className="text-center font-mono"
                      {...field}
                      value={field.value ?? ""}
                      onKeyDown={handleIntegerInput}
                    />
                  </FormControl>
                  <p className="text-faint font-mono text-[11px]">
                    daily total counts
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="weeklyTrainingGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trainings / week</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="e.g. 4"
                    className="w-1/2 text-center font-mono"
                    {...field}
                    value={field.value ?? ""}
                    onKeyDown={handleIntegerInput}
                  />
                </FormControl>
                <p className="text-faint font-mono text-[11px]">
                  rest days don&apos;t break the streak while this stays
                  reachable
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-2">
            <span className="label-caps">
              What counts toward the daily complete
            </span>
            {criteria.map((criterion) => (
              <FormField
                key={criterion.name}
                control={form.control}
                name={criterion.name}
                render={({ field }) => (
                  <FormItem>
                    <label className="border-input bg-input-bg/40 flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <span className="text-[13px] font-semibold tracking-[0.04em] uppercase">
                        {criterion.label}
                      </span>
                      <span className="text-faint ml-auto font-mono text-[11px]">
                        {criterion.hint}
                      </span>
                    </label>
                  </FormItem>
                )}
              />
            ))}
          </div>

          <p className="text-secondary-foreground text-xs leading-relaxed">
            Days without a completed training don&apos;t break the streak as
            long as the weekly training goal is still reachable — training only
            fails once the target can no longer be hit this week.
          </p>
        </div>
        <DialogFooter className="border-t px-5 py-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save goals"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function formatSteps(value: number): string {
  return value.toLocaleString("en-US").replace(/,/g, " ");
}
