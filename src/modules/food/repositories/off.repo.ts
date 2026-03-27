import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { offProduct } from "@/server/db/schema";

const SIMILARITY_THRESHOLD = 0.15;

class OffRepository {
  async search(query: string, limit = 20) {
    if (!query.trim()) return [];

    return db
      .select({
        code: offProduct.code,
        name: offProduct.name,
        brands: offProduct.brands,
        imageUrl: offProduct.imageUrl,
        kcalPer100g: offProduct.kcalPer100g,
        proteinPer100g: offProduct.proteinPer100g,
        carbsPer100g: offProduct.carbsPer100g,
        fatPer100g: offProduct.fatPer100g,
        fiberPer100g: offProduct.fiberPer100g,
      })
      .from(offProduct)
      .where(
        sql`(
          similarity(${offProduct.name}, ${query}) > ${SIMILARITY_THRESHOLD}
          OR ${offProduct.name} ILIKE ${"%" + query + "%"}
          OR ${offProduct.brands} ILIKE ${"%" + query + "%"}
        )`,
      )
      .orderBy(sql`similarity(${offProduct.name}, ${query}) DESC`)
      .limit(limit);
  }
}

export const offRepository = new OffRepository();
