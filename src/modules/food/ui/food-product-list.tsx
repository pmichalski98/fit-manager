"use client";

import { useState } from "react";
import { SearchIcon, Trash2Icon, PencilIcon, CheckCircleIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { deleteFoodProduct } from "../actions";
import { FoodProductForm } from "./food-product-form";
import type { FoodProduct, ShoppingCategory } from "@/server/db/schema";

type Props = {
  products: FoodProduct[];
  categories: ShoppingCategory[];
};

const SOURCE_LABELS: Record<string, string> = {
  openfoodfacts: "OpenFoodFacts",
  ai_estimate: "AI Estimate",
  manual: "Manual",
};

export function FoodProductList({ products, categories }: Props) {
  const [filter, setFilter] = useState("");
  const [editProduct, setEditProduct] = useState<FoodProduct | null>(null);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      p.brand?.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? Existing meal entries using it will also be removed.")) return;

    const result = await deleteFoodProduct(id);
    if (result.ok) {
      toast.success("Product deleted");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Filter products..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filtered.map((product) => {
          const category = categories.find((c) => c.id === product.categoryId);
          return (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg">🍽️</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{product.name}</p>
                  {product.isVerified && (
                    <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  )}
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                  {product.brand && <span>{product.brand}</span>}
                  <Badge variant="outline" className="text-[10px]">
                    {SOURCE_LABELS[product.source] ?? product.source}
                  </Badge>
                  {category && (
                    <Badge variant="secondary" className="text-[10px]">
                      {category.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-muted-foreground shrink-0 text-right text-xs">
                <p className="font-medium">{Number(product.kcalPer100g)} kcal</p>
                <p>
                  P:{Math.round(Number(product.proteinPer100g))} C:
                  {Math.round(Number(product.carbsPer100g))} F:
                  {Math.round(Number(product.fatPer100g))}
                </p>
              </div>

              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setEditProduct(product)}
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(product.id)}
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {filter ? "No products match your filter." : "No products yet."}
          </p>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit product</DialogTitle>
          </DialogHeader>
          {editProduct && (
            <FoodProductForm
              product={editProduct}
              categories={categories}
              onSuccess={() => setEditProduct(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
