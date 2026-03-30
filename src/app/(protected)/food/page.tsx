import { format } from "date-fns";
import Link from "next/link";
import { DatabaseIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMealPlanForDays, getMacroGoals, getEnabledMealTypes } from "@/modules/meal/actions";
import { ensureShoppingCategories } from "@/modules/shopping/actions";
import { MealPlanner } from "@/modules/meal/ui/meal-planner";
import { Suspense } from "react";

async function MealPlannerLoader() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [planData, goals, enabledMealTypes, _] = await Promise.all([
    getMealPlanForDays(today, 3),
    getMacroGoals(),
    getEnabledMealTypes(),
    ensureShoppingCategories(),
  ]);

  return (
    <MealPlanner
      initialDates={planData.dates}
      initialPlan={planData.plan}
      initialSummaries={planData.summaries}
      goals={goals}
      enabledMealTypes={enabledMealTypes}
    />
  );
}

export default function FoodPage() {
  return (
    <div className="space-y-3 xl:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight xl:text-2xl">
          Food
        </h1>
        <div className="flex gap-1.5">
          {/* Icon-only on compact grid, text buttons on full desktop */}
          <Button variant="ghost" size="icon-sm" asChild className="xl:hidden">
            <Link href="/food/products">
              <DatabaseIcon className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild className="xl:hidden">
            <Link href="/food/settings">
              <SettingsIcon className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden xl:inline-flex">
            <Link href="/food/products">
              <DatabaseIcon className="mr-1 h-4 w-4" />
              Products
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden xl:inline-flex">
            <Link href="/food/settings">
              <SettingsIcon className="mr-1 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <MealPlannerLoader />
      </Suspense>
    </div>
  );
}
