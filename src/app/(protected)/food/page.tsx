import { format } from "date-fns";
import Link from "next/link";
import { DatabaseIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMealPlanForDays, getMacroGoals } from "@/modules/meal/actions";
import { ensureShoppingCategories } from "@/modules/shopping/actions";
import { MealPlanner } from "@/modules/meal/ui/meal-planner";
import { Suspense } from "react";

async function MealPlannerLoader() {
  const today = format(new Date(), "yyyy-MM-dd");

  // Ensure categories exist + load data in parallel
  const [planData, goals] = await Promise.all([
    getMealPlanForDays(today, 3),
    getMacroGoals(),
    ensureShoppingCategories(),
  ]);

  return (
    <MealPlanner
      initialDates={planData.dates}
      initialPlan={planData.plan}
      initialSummaries={planData.summaries}
      goals={goals}
    />
  );
}

export default function FoodPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold tracking-tight md:text-2xl">
            Food
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Plan your meals and track macros.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/food/products">
              <DatabaseIcon className="mr-1 h-4 w-4" />
              Products
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
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
