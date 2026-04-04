import type {
  FunctionTool,
  ResponseInputItem,
} from "openai/resources/responses/responses";
import { getOpenAI, toInputItems, extractToolCalls } from "@/lib/openai";

// ─── Types ──────────────────────────────────────────────────────────────────

export type MacroEstimate = {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
  portionG: number | null;
  portionLabel: string | null;
};

// ─── Tool Definitions ───────────────────────────────────────────────────────

const saveProductTool: FunctionTool = {
  type: "function",
  name: "save_product",
  description:
    "Save the final nutritional data for the product. Call this ONLY when you have found reliable nutrition data.",
  parameters: {
    type: "object",
    properties: {
      kcal: {
        type: "number",
        description: "Calories per 100g",
      },
      protein: {
        type: "number",
        description: "Protein in grams per 100g",
      },
      carbs: {
        type: "number",
        description: "Carbohydrates in grams per 100g",
      },
      fat: {
        type: "number",
        description: "Fat in grams per 100g",
      },
      fiber: {
        type: ["number", "null"],
        description: "Fiber in grams per 100g, or null if unknown",
      },
      portion_g: {
        type: ["number", "null"],
        description:
          "Weight of one typical portion/piece in grams if known (e.g., 1 bar = 40g, 1 slice of bread = 35g), or null if unknown",
      },
      portion_label: {
        type: ["string", "null"],
        description:
          "Short label for the portion (e.g., '1 baton', '1 kromka', '1 sztuka', '1 porcja'), or null if unknown",
      },
    },
    required: [
      "kcal",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "portion_g",
      "portion_label",
    ],
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
1. If the product name contains a brand (e.g., "McWrap McDonald's", "chleb żytni Lidl", "baton WK Dzik"), first search for the OFFICIAL producer/brand website with nutrition data.
2. If no official data is found, search Polish nutrition databases (kalorycznosc.net, kcalmar.com, tabele-kalorii.pl).
3. If still not found, search more broadly in Polish.
4. Search in Polish language for Polish products.

## Rules
- Always report values per 100g (not per serving, not per piece).
- If a source gives per-serving data, convert to per 100g using the serving weight.
- If you find the weight of a single portion/piece (e.g., "baton 40g", "kromka 35g"), include it in portion_g and portion_label.
- When you have found reliable data, call the save_product tool with all values.
- Prefer official manufacturer data over third-party estimates.
- Before calling save_product, always explain what source you used and how confident you are.`;

// ─── Main Function ──────────────────────────────────────────────────────────

const MAX_ROUNDS = 10;

export async function estimateMacros(
  productName: string,
): Promise<MacroEstimate> {
  try {
    return await runNutritionAgent(productName);
  } catch (error) {
    console.error(
      "Web search agent failed, falling back to simple estimation:",
      error,
    );
    return estimateMacrosFallback(productName);
  }
}

async function runNutritionAgent(
  productName: string,
): Promise<MacroEstimate> {
  const client = getOpenAI();
  let result: MacroEstimate | null = null;

  const handlers: Record<
    string,
    (args: Record<string, unknown>) => Promise<unknown>
  > = {
    save_product: async (args) => {
      result = {
        kcalPer100g: (args.kcal as number) ?? 0,
        proteinPer100g: (args.protein as number) ?? 0,
        carbsPer100g: (args.carbs as number) ?? 0,
        fatPer100g: (args.fat as number) ?? 0,
        fiberPer100g: (args.fiber as number) ?? null,
        portionG: (args.portion_g as number) ?? null,
        portionLabel: (args.portion_label as string) ?? null,
      };
      return { status: "saved" };
    },
  };

  let conversation: ResponseInputItem[] = [
    {
      role: "user",
      content: `Find nutritional values per 100g for: "${productName}"`,
    },
  ];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    console.log(`[nutrition-agent] Round ${round + 1}/${MAX_ROUNDS}`);

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      tools: TOOLS,
      instructions: INSTRUCTIONS,
      input: conversation,
    });

    const toolCalls = extractToolCalls(response.output);

    // Append model output to conversation
    conversation = [...conversation, ...toInputItems(response.output)];

    if (toolCalls.length === 0) continue;

    // Execute tool calls
    const toolResults: ResponseInputItem.FunctionCallOutput[] =
      await Promise.all(
        toolCalls.map(async (call) => {
          const handler = handlers[call.name];
          if (!handler) {
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify({ error: `Unknown tool: ${call.name}` }),
            };
          }

          try {
            const args = JSON.parse(call.arguments) as Record<string, unknown>;
            console.log(`[nutrition-agent] → ${call.name}`, args);
            const res = await handler(args);
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify(res),
            };
          } catch (error) {
            const msg =
              error instanceof Error ? error.message : String(error);
            return {
              type: "function_call_output" as const,
              call_id: call.call_id,
              output: JSON.stringify({ error: msg }),
            };
          }
        }),
      );

    conversation = [...conversation, ...toolResults];

    // If save_product was called, we're done
    if (result) return result;
  }

  throw new Error("Agent did not produce a result within max rounds");
}

// ─── Fallback (simple estimation without web search) ────────────────────────

async function estimateMacrosFallback(
  productName: string,
): Promise<MacroEstimate> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You are a nutrition expert. Return accurate nutritional data per 100g in JSON format: { "kcal": number, "protein": number, "carbs": number, "fat": number, "fiber": number | null, "portion_g": number | null, "portion_label": string | null }. For branded products, use known label data. portion_g is the weight of one typical portion/piece in grams (e.g., 1 bar = 40g). portion_label is a short Polish label (e.g., "1 baton", "1 kromka").',
      },
      {
        role: "user",
        content: `Estimate nutritional values per 100g for: "${productName}"`,
      },
    ],
    temperature: 0.1,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  const data = JSON.parse(content) as Record<string, unknown>;

  return {
    kcalPer100g: (data.kcal as number) ?? 0,
    proteinPer100g: (data.protein as number) ?? 0,
    carbsPer100g: (data.carbs as number) ?? 0,
    fatPer100g: (data.fat as number) ?? 0,
    fiberPer100g: (data.fiber as number) ?? null,
    portionG: (data.portion_g as number) ?? null,
    portionLabel: (data.portion_label as string) ?? null,
  };
}

// ─── Other AI Services (unchanged) ──────────────────────────────────────────

export async function categorizeProduct(
  productName: string,
  brand: string | null,
  categoryNames: string[],
): Promise<string | null> {
  if (categoryNames.length === 0) return null;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You categorize food products into shopping categories. Given a list of categories, return ONLY the category name that best fits the product. Return exactly one category name, nothing else.`,
        },
        {
          role: "user",
          content: `Categories: ${categoryNames.join(", ")}\n\nProduct: "${productName}"${brand ? ` (brand: ${brand})` : ""}`,
        },
      ],
      temperature: 0,
      max_tokens: 50,
    });

    const result = response.choices[0]?.message?.content?.trim();
    if (!result) return null;

    const match = categoryNames.find(
      (c) => c.toLowerCase() === result.toLowerCase(),
    );
    return match ?? null;
  } catch (error) {
    console.error("AI categorization error:", error);
    return null;
  }
}

