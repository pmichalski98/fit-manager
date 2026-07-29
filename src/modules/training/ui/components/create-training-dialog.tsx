"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useState } from "react";
import { TrainingForm } from "./training-form";

export function CreateTrainingDialog({
  size = "default",
}: {
  size?: "default" | "lg";
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size === "lg" ? "lg" : "default"}>
          <Plus className="size-4" />
          New training
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Training</DialogTitle>
        </DialogHeader>
        <TrainingForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
