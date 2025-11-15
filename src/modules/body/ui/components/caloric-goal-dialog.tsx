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
          {defaultGoal && (
            <DialogDescription>
              Your current caloric goal is{" "}
              <span className="text-primary font-bold">{defaultGoal} kcal</span>
            </DialogDescription>
          )}
        </DialogHeader>
        <CaloricGoalForm defaultGoal={defaultGoal} />
      </DialogContent>
    </Dialog>
  );
}
