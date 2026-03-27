import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMacroGoals } from "@/modules/meal/actions";
import { getShoppingCategories } from "@/modules/shopping/actions";
import { MacroGoalsForm } from "@/modules/meal/ui/macro-goals-form";
import { CategoryManager } from "@/modules/shopping/ui/category-manager";
import { ShoppingListGenerator } from "@/modules/shopping/ui/shopping-list-generator";

async function SettingsView() {
  const [goals, categories] = await Promise.all([
    getMacroGoals(),
    getShoppingCategories(),
  ]);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Daily macro goals</h2>
        <MacroGoalsForm initialGoals={goals} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Shopping categories</h2>
          <p className="text-muted-foreground text-sm">
            Drag to reorder categories to match your shop layout.
          </p>
        </div>
        <CategoryManager initialCategories={categories} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Shopping list</h2>
        <ShoppingListGenerator />
      </section>
    </div>
  );
}

export default function FoodSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/food">
            <ChevronLeftIcon className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-2xl">
            Food Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure goals, categories, and generate shopping lists.
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <SettingsView />
      </Suspense>
    </div>
  );
}
