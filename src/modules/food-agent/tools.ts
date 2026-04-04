import type { FunctionTool } from "openai/resources/responses/responses";
import { foodRepository } from "@/modules/food/repositories/food.repo";
import { mealRepository } from "@/modules/meal/repositories/meal.repo";
import { macrosToDbStrings } from "@/modules/food/schemas";
import { assignCategoryInBackground } from "@/modules/food/services/assign-category";
import { computeMacros, syncDailyLogFromMeals } from "@/modules/meal/meal-macros";
import { runNutritionResearch } from "./nutrition-research";

// ─── Tool Definitions (sent to OpenAI) ──────────────────────────────────────

export const TOOL_DEFINITIONS: FunctionTool[] = [
  {
    type: "function",
    name: "search_products",
    description:
      "Search the user's saved food products by name. Returns products with nutritional data per 100g. " +
      "Use this to check if a product already exists before creating a new one.",
    parameters: {
      type: "object",
      properties: {
        search: {
          type: "string",
          description: "Search term to filter products by name (partial match)",
        },
        limit: {
          type: "number",
          description: "Max results to return (default: 10)",
        },
      },
      required: ["search"],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "research_nutrition",
    description:
      "Search the web for nutritional information about a food product. " +
      "Returns structured data with calories, protein, carbs, fat, and fiber per 100g. " +
      "Use when a product is not in the database. After getting results, save with create_product.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "The food product to research. Be specific about preparation method if relevant. " +
            "Examples: 'raw chicken breast', 'cooked white rice', 'chleb żytni'",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "create_product",
    description:
      "Save a new food product with nutritional values per 100g. " +
      "The product becomes reusable for future meal entries.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description:
            "Short, concise product name (2-4 words max). " +
            "Examples: 'Kanapki z łososiem', 'Owsianka z bananem', 'Sałatka grecka'. " +
            "Do NOT copy the user's full description — put details in meal entry notes instead.",
        },
        kcalPer100g: { type: "number", description: "Calories (kcal) per 100g" },
        proteinPer100g: { type: "number", description: "Protein (g) per 100g" },
        carbsPer100g: { type: "number", description: "Carbs (g) per 100g" },
        fatPer100g: { type: "number", description: "Fat (g) per 100g" },
        fiberPer100g: { type: "number", description: "Fiber (g) per 100g" },
        brand: { type: "string", description: "Brand name if applicable" },
        defaultServingG: {
          type: "number",
          description: "Weight of one typical serving in grams (e.g. 1 slice = 35g)",
        },
        portionLabel: {
          type: "string",
          description: "Short label for the portion (e.g. '1 kromka', '1 sztuka')",
        },
      },
      required: ["name", "kcalPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "add_meal_entry",
    description:
      "Record a meal entry — an actual eating event. References an existing product by name. " +
      "Macros are computed automatically from the product data and gram amount. " +
      "The product MUST exist in the database first (use search_products or create_product).",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format. Defaults to today if not provided.",
        },
        mealType: {
          type: "string",
          enum: ["breakfast", "lunch", "dinner", "snack"],
          description: "Type of meal",
        },
        productName: {
          type: "string",
          description: "Name of the product (must match an existing product in the database)",
        },
        amountG: {
          type: "number",
          description: "Amount eaten in grams",
        },
        notes: {
          type: "string",
          description:
            "Short description of the meal — condensed from the user's input. " +
            "Include ingredient details, preparation notes, etc.",
        },
      },
      required: ["mealType", "productName", "amountG"],
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "list_meals",
    description:
      "List all meal entries for a specific date, grouped by meal type. " +
      "Returns products with amounts and computed macros.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format. Defaults to today.",
        },
      },
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "daily_summary",
    description:
      "Get aggregated nutritional totals for a specific day. " +
      "Returns total calories, protein, carbs, fat, fiber across all meals.",
    parameters: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format. Defaults to today.",
        },
      },
      additionalProperties: false,
    },
    strict: false,
  },
  {
    type: "function",
    name: "delete_meal_entry",
    description: "Delete a meal entry by its ID.",
    parameters: {
      type: "object",
      properties: {
        entryId: {
          type: "string",
          description: "The UUID of the meal entry to delete",
        },
      },
      required: ["entryId"],
      additionalProperties: false,
    },
    strict: false,
  },
];

// ─── Tool Handlers ──────────────────────────────────────────────────────────

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

type ToolHandler = (
  userId: string,
  args: Record<string, unknown>,
  today: string,
) => Promise<unknown>;

const handlers: Record<string, ToolHandler> = {
  search_products: async (userId, args) => {
    const search = args.search as string;
    const limit = Math.min((args.limit as number) ?? 10, 50);
    const products = await foodRepository.searchByName(userId, search, limit);

    return {
      count: products.length,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        kcalPer100g: p.kcalPer100g,
        proteinPer100g: p.proteinPer100g,
        carbsPer100g: p.carbsPer100g,
        fatPer100g: p.fatPer100g,
        fiberPer100g: p.fiberPer100g,
        defaultServingG: p.defaultServingG,
        portionLabel: p.portionLabel,
      })),
    };
  },

  research_nutrition: async (_userId, args) => {
    const query = args.query as string;
    return runNutritionResearch(query);
  },

  create_product: async (userId, args) => {
    const name = args.name as string;
    const macros = {
      kcalPer100g: args.kcalPer100g as number,
      proteinPer100g: args.proteinPer100g as number,
      carbsPer100g: args.carbsPer100g as number,
      fatPer100g: args.fatPer100g as number,
      fiberPer100g: (args.fiberPer100g as number) ?? null,
    };

    const product = await foodRepository.create({
      userId,
      name,
      brand: (args.brand as string) ?? null,
      source: "ai_estimate",
      sourceId: `agent-${crypto.randomUUID()}`,
      isVerified: false,
      ...macrosToDbStrings(macros),
      ...(args.defaultServingG
        ? { defaultServingG: Math.round(args.defaultServingG as number) }
        : {}),
      ...(args.portionLabel ? { portionLabel: args.portionLabel as string } : {}),
    });

    // Background task — don't block the agent
    void assignCategoryInBackground(product.id, userId, name, (args.brand as string) ?? null);

    return {
      success: true,
      product: {
        id: product.id,
        name: product.name,
        kcalPer100g: product.kcalPer100g,
        proteinPer100g: product.proteinPer100g,
        carbsPer100g: product.carbsPer100g,
        fatPer100g: product.fatPer100g,
      },
    };
  },

  add_meal_entry: async (userId, args, today) => {
    const productName = args.productName as string;
    if (!productName) return { error: "Missing productName" };

    const amountG = Number(args.amountG);
    if (!amountG || amountG <= 0) return { error: "amountG must be a positive number" };

    const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
    const mealType = args.mealType as string;
    if (!VALID_MEAL_TYPES.includes(mealType as (typeof VALID_MEAL_TYPES)[number])) {
      return { error: `Invalid mealType: "${mealType}". Must be breakfast, lunch, dinner, or snack.` };
    }
    const validMealType = mealType as (typeof VALID_MEAL_TYPES)[number];

    const rawDate = (args.date as string) || today;
    const date = DATE_REGEX.test(rawDate) ? rawDate : today;

    // Find the product by name
    const products = await foodRepository.searchByName(userId, productName, 5);
    if (products.length === 0) {
      return {
        error: `Product "${productName}" not found. Create it first with create_product.`,
      };
    }

    // Use the best match (first result from similarity search)
    const product = products[0]!;
    const macros = computeMacros(product, amountG);
    const position = await mealRepository.getNextPosition(userId, date, validMealType);
    const notes = (args.notes as string) ?? null;

    const entry = await mealRepository.create({
      userId,
      date,
      mealType: validMealType,
      foodProductId: product.id,
      amountG: String(amountG),
      notes,
      position,
      ...macros,
    });

    await syncDailyLogFromMeals(userId, date);

    return {
      success: true,
      entry: {
        id: entry.id,
        date,
        mealType: validMealType,
        productName: product.name,
        amountG,
        kcal: macros.kcal,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
      },
    };
  },

  list_meals: async (userId, args, today) => {
    const rawDate = (args.date as string) || today;
    const date = DATE_REGEX.test(rawDate) ? rawDate : today;
    const entries = await mealRepository.getEntriesByDate(userId, date);

    const grouped: Record<string, unknown[]> = {};
    for (const row of entries) {
      const type = row.entry.mealType;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push({
        id: row.entry.id,
        productName: row.product.name,
        amountG: row.entry.amountG,
        kcal: row.entry.kcal,
        protein: row.entry.protein,
        carbs: row.entry.carbs,
        fat: row.entry.fat,
      });
    }

    return { date, meals: grouped, totalEntries: entries.length };
  },

  daily_summary: async (userId, args, today) => {
    const rawDate = (args.date as string) || today;
    const date = DATE_REGEX.test(rawDate) ? rawDate : today;
    const summary = await mealRepository.getDailyMacroSummary(userId, date);

    return {
      date,
      totals: {
        kcal: Math.round(Number(summary.totalKcal)),
        protein: Math.round(Number(summary.totalProtein) * 100) / 100,
        carbs: Math.round(Number(summary.totalCarbs) * 100) / 100,
        fat: Math.round(Number(summary.totalFat) * 100) / 100,
        fiber: Math.round(Number(summary.totalFiber) * 100) / 100,
      },
    };
  },

  delete_meal_entry: async (userId, args) => {
    const entryId = args.entryId as string;
    if (!entryId) return { error: "Missing entryId" };

    const deleted = await mealRepository.delete(entryId, userId);
    if (!deleted) {
      return { error: `Meal entry "${entryId}" not found.` };
    }

    await syncDailyLogFromMeals(userId, deleted.date);

    return { success: true, message: `Deleted meal entry ${entryId}` };
  },
};

// ─── Public API ─────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  today: string,
): Promise<{ output: string; success: boolean }> {
  const handler = handlers[name];
  if (!handler) {
    return { output: JSON.stringify({ error: `Unknown tool: ${name}` }), success: false };
  }

  try {
    const result = await handler(userId, args, today);
    const output = JSON.stringify(result);
    const success =
      typeof result === "object" && result !== null && !("error" in (result as Record<string, unknown>));
    return { output, success };
  } catch (error) {
    console.error(`[food-agent] Tool "${name}" error:`, error);
    const message = error instanceof Error ? error.message : String(error);
    return { output: JSON.stringify({ error: message }), success: false };
  }
}


