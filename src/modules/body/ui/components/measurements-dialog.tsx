"use client";

import { useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BodyMeasurement } from "@/server/db/schema";
import { MeasurementsForm } from "./measurements-form";

export function MeasurementsDialog({
  last,
  children,
}: {
  last: BodyMeasurement | null;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b px-5 py-[18px]">
          <DialogTitle className="section-marker text-xs font-bold tracking-[0.1em] uppercase">
            Body measurements
          </DialogTitle>
          <DialogDescription className="sr-only">
            Record your latest body measurements.
          </DialogDescription>
        </DialogHeader>
        <MeasurementsForm last={last} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
