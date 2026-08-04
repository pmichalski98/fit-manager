"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { TrainingForm } from "./training-form";

type Training = {
  id: string;
  name: string;
  type: "strength" | "cardio";
  exercises: {
    id: string;
    name: string;
    position: number;
    targetSets: number | null;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
  }[];
};

export function EditTrainingDialog({ training }: { training: Training }) {
  const [open, setOpen] = useState(false);

  const defaultValues = {
    name: training.name,
    type: training.type,
    exercises: training.exercises.map((e) => ({
      id: e.id,
      name: e.name,
      targetSets: e.targetSets,
      targetRepsMin: e.targetRepsMin,
      targetRepsMax: e.targetRepsMax,
    })),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Pencil className="size-4" />
          <span className="sr-only">Edit training</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-[620px]">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Edit training
          </DialogTitle>
        </DialogHeader>
        <TrainingForm
          trainingId={training.id}
          defaultValues={defaultValues}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
