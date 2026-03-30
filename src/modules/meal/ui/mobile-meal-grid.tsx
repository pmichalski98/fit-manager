"use client";

import { format } from "date-fns";
import {
  PlusIcon,
  BookmarkIcon,
  SaveIcon,
  CopyIcon,
  MoreHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CookingPotIcon,
  Loader2Icon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MEAL_TYPE_LABELS, EMPTY_SUMMARY, parseLocalDate, type MealType, type MacroGoals, type PlanData, type SummaryData } from "../schemas";
import type { MealEntry, FoodProduct } from "@/server/db/schema";

/** Layout constants for viewport-filling cell height calculation */
const MOBILE_CHROME_OFFSET_PX = 220; // top-padding + header + gap + day-headers + bottom-nav
const DESKTOP_CHROME_OFFSET_PX = 180;
const MEAL_LABEL_HEIGHT_PX = 22;
const MEAL_ROW_GAP_PX = 8;

type MealActions = {
  onAddProductClick: (date: string, mealType: MealType) => void;
  onAddTemplateClick: (date: string, mealType: MealType) => void;
  onSaveAsTemplate: (date: string, mealType: MealType) => void;
  onCopyMeal: (date: string, mealType: MealType) => void;
  onCreateMeal: () => void;
};

type Props = {
  dates: string[];
  plan: PlanData;
  summaries: SummaryData;
  goals: MacroGoals | null;
  enabledMealTypes: MealType[];
  today: string;
  isPending: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
} & MealActions;

export function MobileMealGrid({
  dates,
  plan,
  summaries,
  goals,
  enabledMealTypes,
  today,
  isPending,
  onPrev,
  onNext,
  onToday,
  ...actions
}: Props) {
  const calGoal = goals?.caloricGoal ?? null;
  const mealCount = enabledMealTypes.length;

  const labelSpace = mealCount * MEAL_LABEL_HEIGHT_PX + (mealCount - 1) * MEAL_ROW_GAP_PX;
  const mobileCellHeight = `calc((100svh - ${MOBILE_CHROME_OFFSET_PX + labelSpace}px) / ${mealCount})`;
  const desktopCellHeight = `calc((100svh - ${DESKTOP_CHROME_OFFSET_PX + labelSpace}px) / ${mealCount})`;

  return (
    <div className="space-y-2">
      {/* Day header row with integrated navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={isPending}
          className="flex shrink-0 items-center rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="grid flex-1 grid-cols-3 gap-2">
          {dates.map((date) => {
            const dateObj = parseLocalDate(date);
            const summary = summaries[date] ?? EMPTY_SUMMARY;
            const kcal = Math.round(Number(summary.totalKcal));
            const isToday = date === today;
            const progress = calGoal ? Math.min((kcal / calGoal) * 100, 100) : 0;

            return (
              <div
                key={date}
                className={`relative flex flex-col items-center rounded-xl px-2 py-2 transition-colors ${
                  isToday
                    ? "border border-primary/40 bg-primary/8"
                    : "border border-border/50 bg-card/60"
                }`}
              >
                <div className="flex items-baseline gap-1">
                  <span className={`text-sm font-bold ${isToday ? "text-primary" : ""}`}>
                    {format(dateObj, "dd/MM")}
                  </span>
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {format(dateObj, "EEE")}
                  </span>
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {kcal}{calGoal ? `/${calGoal}` : ""} kcal
                </span>
                {calGoal && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progress > 100 ? "bg-destructive" : "bg-primary/70"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <button
            onClick={onNext}
            disabled={isPending}
            className="flex items-center rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {isPending ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Meal type rows */}
      {enabledMealTypes.map((mealType) => (
        <MealTypeRow
          key={mealType}
          mealType={mealType}
          dates={dates}
          plan={plan}
          mobileCellHeight={mobileCellHeight}
          desktopCellHeight={desktopCellHeight}
          actions={actions}
        />
      ))}
    </div>
  );
}

function MealTypeRow({
  mealType,
  dates,
  plan,
  mobileCellHeight,
  desktopCellHeight,
  actions,
}: {
  mealType: MealType;
  dates: string[];
  plan: PlanData;
  mobileCellHeight: string;
  desktopCellHeight: string;
  actions: MealActions;
}) {
  return (
    <div>
      <div className="mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {MEAL_TYPE_LABELS[mealType]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {dates.map((date) => {
          const entries = plan[date]?.[mealType] ?? [];
          return (
            <DayCellForMeal
              key={`${date}-${mealType}`}
              date={date}
              mealType={mealType}
              entries={entries}
              mobileCellHeight={mobileCellHeight}
              desktopCellHeight={desktopCellHeight}
              actions={actions}
            />
          );
        })}
      </div>
    </div>
  );
}

function CellDropdownItems({
  date,
  mealType,
  hasEntries,
  actions,
}: {
  date: string;
  mealType: MealType;
  hasEntries: boolean;
  actions: MealActions;
}) {
  return (
    <>
      <DropdownMenuItem onClick={() => actions.onAddProductClick(date, mealType)}>
        <PlusIcon className="mr-2 h-3.5 w-3.5" />
        Add product
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => actions.onAddTemplateClick(date, mealType)}>
        <BookmarkIcon className="mr-2 h-3.5 w-3.5" />
        Saved meal
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      {hasEntries ? (
        <>
          <DropdownMenuItem onClick={() => actions.onSaveAsTemplate(date, mealType)}>
            <SaveIcon className="mr-2 h-3.5 w-3.5" />
            Save as template
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => actions.onCopyMeal(date, mealType)}>
            <CopyIcon className="mr-2 h-3.5 w-3.5" />
            Copy to...
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem onClick={actions.onCreateMeal}>
          <CookingPotIcon className="mr-2 h-3.5 w-3.5" />
          Create meal
        </DropdownMenuItem>
      )}
    </>
  );
}

function DayCellForMeal({
  date,
  mealType,
  entries,
  mobileCellHeight,
  desktopCellHeight,
  actions,
}: {
  date: string;
  mealType: MealType;
  entries: { entry: MealEntry; product: FoodProduct }[];
  mobileCellHeight: string;
  desktopCellHeight: string;
  actions: MealActions;
}) {
  const totalKcal = entries.reduce((sum, e) => sum + Number(e.entry.kcal ?? 0), 0);

  const style = {
    "--cell-h-mobile": mobileCellHeight,
    "--cell-h-desktop": desktopCellHeight,
  } as React.CSSProperties;

  if (entries.length === 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex h-[var(--cell-h-mobile)] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/30 text-muted-foreground transition-all hover:border-primary/30 hover:bg-card/60 hover:text-foreground md:h-[var(--cell-h-desktop)]"
            style={style}
          >
            <PlusIcon className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-44">
          <CellDropdownItems date={date} mealType={mealType} hasEntries={false} actions={actions} />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      className="flex h-[var(--cell-h-mobile)] flex-col overflow-hidden rounded-xl border border-border/60 bg-card md:h-[var(--cell-h-desktop)]"
      style={style}
    >
      {/* Scrollable entries */}
      <div className="flex-1 space-y-1 overflow-y-auto p-1.5">
        {entries.map((e) => (
          <CompactEntryCard key={e.entry.id} entry={e.entry} product={e.product} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-border/40 px-1.5 py-1">
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {Math.round(totalKcal)} kcal
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <MoreHorizontalIcon className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <CellDropdownItems date={date} mealType={mealType} hasEntries={true} actions={actions} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function CompactEntryCard({
  entry,
  product,
}: {
  entry: MealEntry;
  product: FoodProduct;
}) {
  const kcal = Math.round(Number(entry.kcal ?? 0));

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-accent/30 p-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted md:h-8 md:w-8">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-[9px]">🍽️</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium leading-tight md:text-[11px]">{product.name}</p>
        <p className="text-[9px] tabular-nums text-muted-foreground md:text-[10px]">{kcal} kcal</p>
      </div>
    </div>
  );
}
