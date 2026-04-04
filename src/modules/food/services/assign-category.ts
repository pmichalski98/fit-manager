import { foodRepository } from "../repositories/food.repo";
import { shoppingRepository } from "../../shopping/repositories/shopping.repo";
import { categorizeProduct } from "./ai-nutrition";

export async function assignCategoryInBackground(
  productId: string,
  userId: string,
  productName: string,
  brand: string | null,
) {
  try {
    const categories = await shoppingRepository.getCategories(userId);
    if (categories.length === 0) return;

    const categoryName = await categorizeProduct(
      productName,
      brand,
      categories.map((c) => c.name),
    );
    if (!categoryName) return;

    const category = categories.find((c) => c.name === categoryName);
    if (!category) return;

    await foodRepository.update(productId, userId, { categoryId: category.id });
  } catch (error) {
    console.error("[food] Background categorization error:", error);
  }
}
