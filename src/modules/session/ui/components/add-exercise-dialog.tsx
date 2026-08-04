"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddExerciseDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string, saveToTemplate: boolean) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [saveToTemplate, setSaveToTemplate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd(trimmed, saveToTemplate);
      setName("");
      onOpenChange(false);
    } catch {
      // Keep the dialog open — the error is surfaced via toast by the caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Add exercise
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Exercise name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSubmit();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="save-to-template"
              checked={saveToTemplate}
              onCheckedChange={(c) => setSaveToTemplate(c === true)}
            />
            <Label htmlFor="save-to-template" className="font-normal">
              Save to training template
            </Label>
          </div>
        </div>
        <DialogFooter className="border-t px-5 py-4">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!name.trim() || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Plus strokeWidth={2.5} />
            )}
            Add exercise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
