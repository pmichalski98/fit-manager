"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { discardSession } from "@/modules/session/actions";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DiscardSessionButtonProps {
  sessionId: string;
}

export function DiscardSessionButton({
  sessionId,
}: DiscardSessionButtonProps) {
  const router = useRouter();
  const [isDiscarding, setIsDiscarding] = useState(false);

  const handleDiscard = async () => {
    try {
      setIsDiscarding(true);
      await discardSession(sessionId);
      toast.success("Session discarded");
      router.push("/training");
    } catch {
      toast.error("Failed to discard session");
    } finally {
      setIsDiscarding(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
          aria-label="Discard session"
          disabled={isDiscarding}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard session?</AlertDialogTitle>
          <AlertDialogDescription>
            All progress for this session will be permanently deleted. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDiscard}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDiscarding}
          >
            {isDiscarding ? "Discarding..." : "Discard"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
