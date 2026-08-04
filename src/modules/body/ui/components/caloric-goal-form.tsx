"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type KeyboardEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateUserCaloricGoal } from "@/modules/body/actions";
import { goalSchema, type GoalFormValues } from "../../schemas";
import { handleIntegerInput } from "@/lib/utils";

type Props = {
  defaultGoal: number | null;
};

export function CaloricGoalForm({ defaultGoal }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema) as Resolver<GoalFormValues>,
    defaultValues: { caloricGoal: defaultGoal ?? undefined },
  });

  const onSubmit = async (values: GoalFormValues) => {
    try {
      setIsSubmitting(true);
      await updateUserCaloricGoal(values);
      toast.success("Caloric goal updated");
    } catch {
      toast.error("Failed to update caloric goal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4 p-5">
          {defaultGoal ? (
            <p className="text-secondary-foreground text-xs leading-relaxed">
              Your current caloric goal is{" "}
              <span className="text-primary font-mono font-bold">
                {defaultGoal} kcal
              </span>
              .
            </p>
          ) : null}
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
                    className="text-center font-mono"
                    {...field}
                    onKeyDown={handleIntegerInput}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter className="border-t px-5 py-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save goal"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
