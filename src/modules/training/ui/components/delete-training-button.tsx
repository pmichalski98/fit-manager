"use client";

import { Button } from "@/components/ui/button";
import { deleteTraining } from "@/modules/training/actions";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteTrainingButtonProps {
  trainingId: string;
}

export function DeleteTrainingButton({
  trainingId,
}: DeleteTrainingButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsDeleting(true);
      await deleteTraining(trainingId);
      toast.success("Training deleted");
    } catch {
      toast.error("Failed to delete training");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleDelete}>
      <Button
        type="submit"
        variant="destructive"
        size="icon-sm"
        aria-label="Delete training"
        disabled={isDeleting}
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
