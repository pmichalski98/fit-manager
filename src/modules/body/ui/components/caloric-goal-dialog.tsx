"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CaloricGoalForm } from "./caloric-goal-form";

type Props = { defaultGoal: number | null };

export function CaloricGoalDialog({ defaultGoal }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Set kcal goal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set caloric goal</DialogTitle>
          <DialogDescription>
            Used to prefill your daily calories.
          </DialogDescription>
        </DialogHeader>
        <CaloricGoalForm defaultGoal={defaultGoal} />
      </DialogContent>
    </Dialog>
  );
}
