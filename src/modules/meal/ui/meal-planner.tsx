"use client";

import { useState, useCallback, useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CookingPotIcon, Loader2Icon } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { DayColumn } from "./day-column";
import { MobileMealGrid } from "./mobile-meal-grid";
import { FoodSearchDialog } from "@/modules/food/ui/food-search-dialog";
import { MealTemplateDialog } from "./meal-template-dialog";
import { SaveTemplateDialog } from "./save-template-dialog";
import { CreateMealDialog } from "./create-meal-dialog";
import { CopyMealDialog } from "./copy-meal-dialog";
import { getMealPlanForDays } from "../actions";
import { EMPTY_SUMMARY, parseLocalDate, type MealType, type MacroGoals, type PlanData, type SummaryData } from "../schemas";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

const DAYS_SHOWN = 3;

type Props = {
  initialDates: string[];
  initialPlan: PlanData;
  initialSummaries: SummaryData;
  goals: MacroGoals | null;
  enabledMealTypes: MealType[];
};

export function MealPlanner({
  initialDates,
  initialPlan,
  initialSummaries,
  goals,
  enabledMealTypes,
}: Props) {
  const [startDate, setStartDate] = useState(initialDates[0]!);
  const [plan, setPlan] = useState<PlanData>(initialPlan);
  const [summaries, setSummaries] = useState<SummaryData>(initialSummaries);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchContext, setSearchContext] = useState<{ date: string; mealType: MealType } | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateContext, setTemplateContext] = useState<{ date: string; mealType: MealType } | null>(null);
  const [createMealOpen, setCreateMealOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplateContext, setSaveTemplateContext] = useState<{
    mealType: MealType;
    entries: { entry: MealEntry; product: FoodProduct }[];
  } | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyContext, setCopyContext] = useState<{ date: string; mealType: MealType } | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const dates = Array.from({ length: DAYS_SHOWN }, (_, i) =>
    format(addDays(parseLocalDate(startDate), i), "yyyy-MM-dd"),
  );

  const fetchPlanData = useCallback((newStartDate: string) => {
    setStartDate(newStartDate);
    startTransition(async () => {
      const data = await getMealPlanForDays(newStartDate, DAYS_SHOWN);
      setPlan(data.plan);
      setSummaries(data.summaries);
    });
  }, []);

  /** Re-fetch the current view after a mutation (update/delete/add). */
  const refreshCurrentView = useCallback(() => {
    startTransition(async () => {
      const data = await getMealPlanForDays(startDate, DAYS_SHOWN);
      setPlan(data.plan);
      setSummaries(data.summaries);
    });
  }, [startDate]);

  const handlePrev = () => {
    fetchPlanData(format(subDays(parseLocalDate(startDate), DAYS_SHOWN), "yyyy-MM-dd"));
  };

  const handleNext = () => {
    fetchPlanData(format(addDays(parseLocalDate(startDate), DAYS_SHOWN), "yyyy-MM-dd"));
  };

  const handleToday = () => fetchPlanData(today);

  const handleAddProductClick = useCallback((date: string, mealType: MealType) => {
    setSearchContext({ date, mealType });
    setSearchOpen(true);
  }, []);

  const handleAddTemplateClick = useCallback((date: string, mealType: MealType) => {
    setTemplateContext({ date, mealType });
    setTemplateOpen(true);
  }, []);

  const handleSaveAsTemplate = useCallback((date: string, mealType: MealType) => {
    const entries = plan[date]?.[mealType] ?? [];
    if (entries.length === 0) return;
    setSaveTemplateContext({ mealType, entries });
    setSaveTemplateOpen(true);
  }, [plan]);

  const handleCopyMeal = useCallback((date: string, mealType: MealType) => {
    setCopyContext({ date, mealType });
    setCopyOpen(true);
  }, []);

  const handleCreateMeal = () => setCreateMealOpen(true);

  const emptyDay: Record<string, never[]> = {};

  return (
    <div>
      {/* Compact grid view — mobile + tablet (below xl breakpoint) */}
      <div className="xl:hidden">
        <MobileMealGrid
          dates={dates}
          plan={plan}
          summaries={summaries}
          goals={goals}
          enabledMealTypes={enabledMealTypes}
          today={today}
          isPending={isPending}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onAddProductClick={handleAddProductClick}
          onAddTemplateClick={handleAddTemplateClick}
          onSaveAsTemplate={handleSaveAsTemplate}
          onCopyMeal={handleCopyMeal}
          onCreateMeal={handleCreateMeal}
        />
      </div>

      {/* Full desktop layout — xl+ only (1280px+, enough room for 3 detailed columns) */}
      <div className="hidden xl:block">
        <div className="mb-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handlePrev} disabled={isPending}>
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => setCreateMealOpen(true)}>
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
        <div className="grid grid-cols-3 gap-4">
          {dates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              meals={plan[date] ?? emptyDay}
              summary={summaries[date] ?? EMPTY_SUMMARY}
              goals={goals}
              enabledMealTypes={enabledMealTypes}
              onAddProductClick={(mt) => handleAddProductClick(date, mt)}
              onAddTemplateClick={(mt) => handleAddTemplateClick(date, mt)}
              onSaveAsTemplate={(mt) => handleSaveAsTemplate(date, mt)}
              onCopyMeal={(mt) => handleCopyMeal(date, mt)}
              onMutate={refreshCurrentView}
              isToday={date === today}
            />
          ))}
        </div>
      </div>

      {/* Dialogs */}
      {searchContext && (
        <FoodSearchDialog
          open={searchOpen}
          onOpenChange={() => { setSearchOpen(false); setSearchContext(null); }}
          date={searchContext.date}
          mealType={searchContext.mealType}
          onMutate={refreshCurrentView}
        />
      )}
      {templateContext && (
        <MealTemplateDialog
          open={templateOpen}
          onOpenChange={() => { setTemplateOpen(false); setTemplateContext(null); }}
          date={templateContext.date}
          mealType={templateContext.mealType}
          onMutate={refreshCurrentView}
        />
      )}
      {saveTemplateContext && (
        <SaveTemplateDialog
          open={saveTemplateOpen}
          onOpenChange={() => { setSaveTemplateOpen(false); setSaveTemplateContext(null); }}
          mealType={saveTemplateContext.mealType}
          entries={saveTemplateContext.entries}
        />
      )}
      {copyContext && (
        <CopyMealDialog
          open={copyOpen}
          onOpenChange={(open) => { setCopyOpen(open); if (!open) setCopyContext(null); }}
          fromDate={copyContext.date}
          fromMealType={copyContext.mealType}
          enabledMealTypes={enabledMealTypes}
          onMutate={refreshCurrentView}
        />
      )}
      <CreateMealDialog open={createMealOpen} onOpenChange={setCreateMealOpen} />
    </div>
  );
}
