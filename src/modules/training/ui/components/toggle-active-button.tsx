"use client";

import { Button } from "@/components/ui/button";
import { toggleTrainingActive } from "@/modules/training/actions";
import { EyeOff, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ToggleActiveButtonProps {
  trainingId: string;
  isActive: boolean;
}

export function ToggleActiveButton({
  trainingId,
  isActive,
}: ToggleActiveButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    try {
      setIsPending(true);
      await toggleTrainingActive(trainingId);
      toast.success(isActive ? "Training marked as inactive" : "Training marked as active");
    } catch {
      toast.error("Failed to update training");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={isActive ? "Mark as inactive" : "Mark as active"}
      disabled={isPending}
      onClick={handleToggle}
    >
      {isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}
