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
    })),
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <Pencil className="size-4" />
          <span className="sr-only">Edit training</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Training</DialogTitle>
        </DialogHeader>
        <TrainingForm
          trainingId={training.id}
          defaultValues={defaultValues}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
