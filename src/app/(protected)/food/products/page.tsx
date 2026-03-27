import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllProducts } from "@/modules/food/actions";
import { getShoppingCategories } from "@/modules/shopping/actions";
import { FoodProductList } from "@/modules/food/ui/food-product-list";
import { FoodProductForm } from "@/modules/food/ui/food-product-form";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

async function ProductsView() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getShoppingCategories(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-4 text-lg font-semibold">Add new product</h2>
        <FoodProductForm categories={categories} />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          Your products ({products.length})
        </h2>
        <FoodProductList products={products} categories={categories} />
      </div>
    </div>
  );
}

export default function ProductsPage() {
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
            Food Database
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your personal food product database.
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
        <ProductsView />
      </Suspense>
    </div>
  );
}
