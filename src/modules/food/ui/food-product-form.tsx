"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { addFoodProduct, updateFoodProduct } from "../actions";
import type { FoodProduct, ShoppingCategory } from "@/server/db/schema";

type Props = {
  product?: FoodProduct;
  categories: ShoppingCategory[];
  onSuccess?: () => void;
};

export function FoodProductForm({ product, categories, onSuccess }: Props) {
  const isEdit = !!product;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      brand: (formData.get("brand") as string) || undefined,
      categoryId: (formData.get("categoryId") as string) || null,
      source: "manual" as const,
      kcalPer100g: Number(formData.get("kcalPer100g")),
      proteinPer100g: Number(formData.get("proteinPer100g")),
      carbsPer100g: Number(formData.get("carbsPer100g")),
      fatPer100g: Number(formData.get("fatPer100g")),
      fiberPer100g: Number(formData.get("fiberPer100g")) || null,
      defaultServingG: Number(formData.get("defaultServingG")) || 100,
      isVerified: true,
    };

    const result = isEdit
      ? await updateFoodProduct(product.id, data)
      : await addFoodProduct(data);

    if (result.ok) {
      toast.success(isEdit ? "Product updated" : "Product added");
      onSuccess?.();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            required
          />
        </div>

        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            name="brand"
            defaultValue={product?.brand ?? ""}
          />
        </div>

        <div>
          <Label htmlFor="categoryId">Category</Label>
          <Select
            name="categoryId"
            defaultValue={product?.categoryId ?? ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div>
          <Label htmlFor="kcalPer100g">Kcal</Label>
          <Input
            id="kcalPer100g"
            name="kcalPer100g"
            type="number"
            step="0.01"
            defaultValue={product?.kcalPer100g ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="proteinPer100g">Protein</Label>
          <Input
            id="proteinPer100g"
            name="proteinPer100g"
            type="number"
            step="0.01"
            defaultValue={product?.proteinPer100g ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="carbsPer100g">Carbs</Label>
          <Input
            id="carbsPer100g"
            name="carbsPer100g"
            type="number"
            step="0.01"
            defaultValue={product?.carbsPer100g ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="fatPer100g">Fat</Label>
          <Input
            id="fatPer100g"
            name="fatPer100g"
            type="number"
            step="0.01"
            defaultValue={product?.fatPer100g ?? ""}
            required
          />
        </div>
        <div>
          <Label htmlFor="fiberPer100g">Fiber</Label>
          <Input
            id="fiberPer100g"
            name="fiberPer100g"
            type="number"
            step="0.01"
            defaultValue={product?.fiberPer100g ?? ""}
          />
        </div>
      </div>
      <p className="text-muted-foreground text-xs">All values per 100g</p>

      <div className="w-24">
        <Label htmlFor="defaultServingG">Default serving (g)</Label>
        <Input
          id="defaultServingG"
          name="defaultServingG"
          type="number"
          defaultValue={product?.defaultServingG ?? 100}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Update product" : "Add product"}
      </Button>
    </form>
  );
}
