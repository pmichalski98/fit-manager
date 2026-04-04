import type {
  FunctionTool,
  ResponseInputItem,
} from "openai/resources/responses/responses";
import { getOpenAI, toInputItems, extractToolCalls, extractText } from "@/lib/openai";

// ─── Types ──────────────────────────────────────────────────────────────────

export type NutritionData = {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  portionG: number | null;
  portionLabel: string | null;
  source: string | null;
};

const saveProductTool: FunctionTool = {
  type: "function",
  name: "save_product",
  description:
    "Save the final nutritional data for the product. Call this ONLY when you have found reliable nutrition data.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Standardized product name" },
      kcal: { type: "number", description: "Calories per 100g" },
      protein: { type: "number", description: "Protein in grams per 100g" },
      carbs: { type: "number", description: "Carbohydrates in grams per 100g" },
      fat: { type: "number", description: "Fat in grams per 100g" },
      fiber: { type: ["number", "null"], description: "Fiber in grams per 100g, or null" },
      portion_g: {
        type: ["number", "null"],
        description: "Weight of one typical portion/piece in grams, or null",
      },
      portion_label: {
        type: ["string", "null"],
        description: "Short label for the portion (e.g., '1 kromka'), or null",
      },
      source: { type: ["string", "null"], description: "Brief source description" },
    },
    required: ["name", "kcal", "protein", "carbs", "fat", "fiber", "portion_g", "portion_label", "source"],
    additionalProperties: false,
  },
  strict: true,
};

const TOOLS: FunctionTool[] = [
  { type: "web_search_preview" } as unknown as FunctionTool,
  saveProductTool,
];

const INSTRUCTIONS = `You are a nutrition data researcher specializing in Polish food products. Your task is to find ACCURATE nutritional values per 100g for a specific product.

## Search strategy
1. If the product name contains a brand, first search for the OFFICIAL producer/brand website with nutrition data.
2. If no official data is found, search Polish nutrition databases (kalorycznosc.net, kcalmar.com, tabele-kalorii.pl).
3. If still not found, search more broadly.
4. Search in Polish language for Polish products.

## Rules
- Always report values per 100g (not per serving, not per piece).
- If a source gives per-serving data, convert to per 100g using the serving weight.
- If you find the weight of a single portion/piece, include it in portion_g and portion_label.
- When you have found reliable data, call the save_product tool.
- Prefer official manufacturer data over third-party estimates.`;

// ─── Public function ────────────────────────────────────────────────────────

const MAX_ROUNDS = 10;

export async function runNutritionResearch(query: string): Promise<NutritionData> {
  const client = getOpenAI();
  let result: NutritionData | null = null;

  const researchHandlers: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
    save_product: async (args) => {
      result = {
        name: (args.name as string) ?? query,
        kcalPer100g: (args.kcal as number) ?? 0,
        proteinPer100g: (args.protein as number) ?? 0,
        carbsPer100g: (args.carbs as number) ?? 0,
        fatPer100g: (args.fat as number) ?? 0,
        fiberPer100g: (args.fiber as number) ?? null,
        portionG: (args.portion_g as number) ?? null,
        portionLabel: (args.portion_label as string) ?? null,
        source: (args.source as string) ?? null,
      };
      return { status: "saved" };
    },
  };

  let conversation: ResponseInputItem[] = [
    { role: "user", content: `Find nutritional values per 100g for: "${query}"` },
  ];

  let lastTextOutput: string | null = null;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    console.log(`[nutrition-research] Round ${round + 1}/${MAX_ROUNDS} for "${query}"`);

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      tools: TOOLS,
      instructions: INSTRUCTIONS,
      input: conversation,
    });

    const toolCalls = extractToolCalls(response.output);
    conversation = [...conversation, ...toInputItems(response.output)];

    // Track model text responses for better error messages
    const text = extractText(response.output);
    if (text) lastTextOutput = text;

    if (toolCalls.length === 0) continue;

    const toolResults: ResponseInputItem.FunctionCallOutput[] = await Promise.all(
      toolCalls.map(async (call) => {
        const handler = researchHandlers[call.name];
        if (!handler) {
          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: JSON.stringify({ error: `Unknown tool: ${call.name}` }),
          };
        }

        try {
          const args = JSON.parse(call.arguments) as Record<string, unknown>;
          const res = await handler(args);
          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: JSON.stringify(res),
          };
        } catch (error) {
          return {
            type: "function_call_output" as const,
            call_id: call.call_id,
            output: JSON.stringify({
              error: error instanceof Error ? error.message : String(error),
            }),
          };
        }
      }),
    );

    conversation = [...conversation, ...toolResults];

    if (result) return result;
  }

  const detail = lastTextOutput ? `: ${lastTextOutput}` : "";
  throw new Error(`Nutrition research did not produce a result for "${query}"${detail}`);
}
