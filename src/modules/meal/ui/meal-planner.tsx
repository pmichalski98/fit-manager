"use client";

import { useState, useCallback, useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CookingPotIcon, Loader2Icon } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { DayColumn } from "./day-column";
import { FoodSearchDialog } from "@/modules/food/ui/food-search-dialog";
import { MealTemplateDialog } from "./meal-template-dialog";
import { SaveTemplateDialog } from "./save-template-dialog";
import { CreateMealDialog } from "./create-meal-dialog";
import { getMealPlanForDays } from "../actions";
import type { MealType, DaySummary, MacroGoals } from "../schemas";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

const DAYS_SHOWN = 3;

type PlanData = Record<string, Record<string, { entry: MealEntry; product: FoodProduct }[]>>;
type SummaryData = Record<string, DaySummary>;

type Props = {
  initialDates: string[];
  initialPlan: PlanData;
  initialSummaries: SummaryData;
  goals: MacroGoals | null;
};

export function MealPlanner({
  initialDates,
  initialPlan,
  initialSummaries,
  goals,
}: Props) {
  const [startDate, setStartDate] = useState(initialDates[0]!);
  const [plan, setPlan] = useState<PlanData>(initialPlan);
  const [summaries, setSummaries] = useState<SummaryData>(initialSummaries);
  const [isPending, startTransition] = useTransition();

  // Search dialog state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchContext, setSearchContext] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);

  // Template browser dialog state
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateContext, setTemplateContext] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);

  // Create meal dialog state
  const [createMealOpen, setCreateMealOpen] = useState(false);

  // Save template dialog state
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplateContext, setSaveTemplateContext] = useState<{
    mealType: MealType;
    entries: { entry: MealEntry; product: FoodProduct }[];
  } | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const dates = Array.from({ length: DAYS_SHOWN }, (_, i) =>
    format(addDays(new Date(startDate + "T00:00:00"), i), "yyyy-MM-dd"),
  );

  const fetchPlanData = useCallback((newStartDate: string) => {
    setStartDate(newStartDate);
    startTransition(async () => {
      const data = await getMealPlanForDays(newStartDate, DAYS_SHOWN);
      setPlan(data.plan);
      setSummaries(data.summaries);
    });
  }, []);

  const handlePrev = () => {
    const newStart = format(subDays(new Date(startDate + "T00:00:00"), DAYS_SHOWN), "yyyy-MM-dd");
    fetchPlanData(newStart);
  };

  const handleNext = () => {
    const newStart = format(addDays(new Date(startDate + "T00:00:00"), DAYS_SHOWN), "yyyy-MM-dd");
    fetchPlanData(newStart);
  };

  const handleToday = () => {
    fetchPlanData(today);
  };

  const handleAddProductClick = useCallback(
    (date: string, mealType: MealType) => {
      setSearchContext({ date, mealType });
      setSearchOpen(true);
    },
    [],
  );

  const handleAddTemplateClick = useCallback(
    (date: string, mealType: MealType) => {
      setTemplateContext({ date, mealType });
      setTemplateOpen(true);
    },
    [],
  );

  const handleSaveAsTemplate = useCallback(
    (date: string, mealType: MealType) => {
      const dayPlan = plan[date];
      const entries = dayPlan?.[mealType] ?? [];
      if (entries.length === 0) return;

      setSaveTemplateContext({ mealType, entries });
      setSaveTemplateOpen(true);
    },
    [plan],
  );

  const emptyDay = { breakfast: [], lunch: [], dinner: [], snack: [] };
  const emptySummary: DaySummary = { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={isPending}>
          <ChevronLeftIcon className="mr-1 h-4 w-4" />
          Prev
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setCreateMealOpen(true)}
          >
            <CookingPotIcon className="mr-1 h-4 w-4" />
            Create meal
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} disabled={isPending}>
            Today
          </Button>
          {isPending && <Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        <Button variant="outline" size="sm" onClick={handleNext} disabled={isPending}>
          Next
          <ChevronRightIcon className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* 3-day grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {dates.map((date) => (
          <DayColumn
            key={date}
            date={date}
            meals={plan[date] ?? emptyDay}
            summary={summaries[date] ?? emptySummary}
            goals={goals}
            onAddProductClick={(mt) => handleAddProductClick(date, mt)}
            onAddTemplateClick={(mt) => handleAddTemplateClick(date, mt)}
            onSaveAsTemplate={(mt) => handleSaveAsTemplate(date, mt)}
            isToday={date === today}
          />
        ))}
      </div>

      {/* Food search dialog */}
      {searchContext && (
        <FoodSearchDialog
          open={searchOpen}
          onOpenChange={() => {
            setSearchOpen(false);
            setSearchContext(null);
          }}
          date={searchContext.date}
          mealType={searchContext.mealType}
        />
      )}

      {/* Template browser dialog */}
      {templateContext && (
        <MealTemplateDialog
          open={templateOpen}
          onOpenChange={() => {
            setTemplateOpen(false);
            setTemplateContext(null);
          }}
          date={templateContext.date}
          mealType={templateContext.mealType}
        />
      )}

      {/* Save template dialog */}
      {saveTemplateContext && (
        <SaveTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={() => {
            setSaveTemplateOpen(false);
            setSaveTemplateContext(null);
          }}
          mealType={saveTemplateContext.mealType}
          entries={saveTemplateContext.entries}
        />
      )}

      {/* Create meal dialog */}
      <CreateMealDialog
        open={createMealOpen}
        onOpenChange={setCreateMealOpen}
      />
    </div>
  );
}
