"use client";

import { useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { DailyGoalSettings } from "@/modules/body/repositories/user.repo";
import { DailyGoalsForm } from "./daily-goals-form";

type Props = {
  settings: DailyGoalSettings | null;
  children: ReactNode;
};

export function DailyGoalsDialog({ settings, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="gap-0 p-0 sm:max-w-[520px]">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Daily goals
          </DialogTitle>
        </DialogHeader>
        <DailyGoalsForm settings={settings} onSaved={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
