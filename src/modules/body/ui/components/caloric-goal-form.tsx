"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { updateUserCaloricGoal } from "@/modules/body/actions";

const goalSchema = z.object({
  caloricGoal: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().nonnegative().optional(),
  ),
});

type GoalFormValues = z.infer<typeof goalSchema>;

type Props = {
  defaultGoal: number | null;
};

export function CaloricGoalForm({ defaultGoal }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as unknown as Resolver<GoalFormValues>,
    defaultValues: { caloricGoal: defaultGoal ?? undefined },
  });

  const onSubmit = async (values: GoalFormValues) => {
    try {
      setIsSubmitting(true);
      const payload = { caloricGoal: values.caloricGoal ?? null };
      await updateUserCaloricGoal(payload);
      toast.success("Caloric goal updated");
    } catch {
      toast.error("Failed to update caloric goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  placeholder="e.g. 2300"
                  value={field.value == null ? "" : String(field.value)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") return field.onChange(undefined);
                    if (/^\d*$/.test(raw)) field.onChange(raw);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save goal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
