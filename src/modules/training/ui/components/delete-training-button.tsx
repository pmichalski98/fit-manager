"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTrainingAction } from "@/modules/training/actions";
import { toast } from "sonner";
import { useState } from "react";

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
      await deleteTrainingAction(trainingId);
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
