"use client";

import { useState, useTransition } from "react";
import { format, addDays, subDays } from "date-fns";
import { CopyIcon, Loader2Icon } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { copyMealEntries } from "../actions";
import { MEAL_TYPE_LABELS, parseLocalDate, type MealType } from "../schemas";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromDate: string;
  fromMealType: MealType;
  enabledMealTypes: MealType[];
};

export function CopyMealDialog({
  open,
  onOpenChange,
  fromDate,
  fromMealType,
  enabledMealTypes,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [targetMealType, setTargetMealType] = useState<MealType>(fromMealType);
  const [isPending, startTransition] = useTransition();

  const fromDateObj = parseLocalDate(fromDate);

  const quickDates = [
    { label: "Yesterday", date: format(subDays(fromDateObj, 1), "yyyy-MM-dd") },
    { label: "Today", date: format(new Date(), "yyyy-MM-dd") },
    { label: "Tomorrow", date: format(addDays(fromDateObj, 1), "yyyy-MM-dd") },
    { label: "+2 days", date: format(addDays(fromDateObj, 2), "yyyy-MM-dd") },
    { label: "+3 days", date: format(addDays(fromDateObj, 3), "yyyy-MM-dd") },
  ].filter((d) => d.date !== fromDate);

  const handleCopy = () => {
    if (!selectedDate) return;

    startTransition(async () => {
      const result = await copyMealEntries(
        fromDate,
        fromMealType,
        selectedDate,
        targetMealType,
      );
      if (result.ok) {
        toast.success(
          `Copied ${MEAL_TYPE_LABELS[fromMealType].toLowerCase()} to ${format(parseLocalDate(selectedDate), "EEE dd/MM")}`,
        );
        onOpenChange(false);
        setSelectedDate(null);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Copy {MEAL_TYPE_LABELS[fromMealType]} — {format(fromDateObj, "EEE dd/MM")}
          </DrawerTitle>
        </DrawerHeader>

        <div className="space-y-4 px-4">
          <div>
            <p className="text-muted-foreground mb-2 text-sm">Copy to:</p>
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <Button
                  key={qd.date}
                  variant={selectedDate === qd.date ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDate(qd.date)}
                >
                  {qd.label}
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    {format(parseLocalDate(qd.date), "dd/MM")}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 text-sm">As meal type:</p>
            <Select
              value={targetMealType}
              onValueChange={(v) => setTargetMealType(v as MealType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enabledMealTypes.map((key) => (
                  <SelectItem key={key} value={key}>
                    {MEAL_TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={handleCopy}
            disabled={!selectedDate || isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CopyIcon className="mr-2 h-4 w-4" />
            )}
            Copy meal
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
