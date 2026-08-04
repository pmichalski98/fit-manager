"use client";

import { TargetIcon } from "lucide-react";

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
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Set caloric goal"
        >
          <TargetIcon className="size-3.5" />
          <span className="sr-only">Set caloric goal</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Set caloric goal
          </DialogTitle>
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
