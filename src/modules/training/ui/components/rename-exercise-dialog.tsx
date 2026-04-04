import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type RenameExerciseDialogProps = {
  open: boolean;
  oldName?: string;
  newName?: string;
  onDecision: (replace: boolean) => void;
  onDismiss: () => void;
};

export function RenameExerciseDialog({
  open,
  oldName,
  newName,
  onDecision,
  onDismiss,
}: RenameExerciseDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Exercise Renamed</AlertDialogTitle>
          <AlertDialogDescription>
            You renamed <strong>{oldName}</strong> to{" "}
            <strong>{newName}</strong>. Did you correct a typo, or is this a
            completely new exercise?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onDecision(false)}>
            Just renamed (Keep history)
          </Button>
          <Button onClick={() => onDecision(true)}>
            New exercise (Reset history)
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
