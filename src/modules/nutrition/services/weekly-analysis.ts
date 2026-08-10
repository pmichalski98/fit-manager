import OpenAI from "openai";
import { z } from "zod";

import { env } from "@/env";
import { userRepository } from "@/modules/body/repositories";
import type { FitatuMealItem } from "@/server/db/schema";
import { groupMeals, type MealGroup } from "../lib/meal-grouping";
import { weekdayName, weekEndOf } from "../lib/week";
import { nutritionRepository } from "../repositories/nutrition.repo";

// Runs once a week, so a few cents per call buys the best reasoning available.
const MODEL = "gpt-5.6-sol";
const REASONING_EFFORT = "high" as const;

// Rough guard against a pathological week blowing up the prompt.
const MAX_ITEMS = 400;

const analysisSchema = z.object({
  summary: z.string(),
  observations: z.array(z.string()),
  swaps: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      reason: z.string(),
      kcalSaved: z.number().nullable(),
    }),
  ),
});

/** JSON schema mirroring `analysisSchema` for OpenAI structured outputs. */
const responseFormat = {
  type: "json_schema" as const,
  name: "weekly_nutrition_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["summary", "observations", "swaps"],
    properties: {
      summary: {
        type: "string",
        description:
          "2-4 sentence overview of the week's eating pattern, in Polish.",
      },
      observations: {
        type: "array",
        description:
          "3-6 concrete observations about recurring habits, in Polish.",
        items: { type: "string" },
      },
      swaps: {
        type: "array",
        description:
          "Concrete product substitutions, only for products actually eaten this week.",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["from", "to", "reason", "kcalSaved"],
          properties: {
            from: {
              type: "string",
              description: "Product name exactly as it appears in the log.",
            },
            to: { type: "string", description: "Suggested replacement." },
            reason: {
              type: "string",
              description: "Short justification in Polish.",
            },
            kcalSaved: {
              type: ["number", "null"],
              description:
                "Estimated kcal saved per typical portion, null if not quantifiable.",
            },
          },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `Jesteś dietetykiem prowadzącym osobę na REDUKCJI (deficyt kaloryczny, cel: utrata tkanki tłuszczowej przy zachowaniu mięśni).

Dostajesz tygodniowy dziennik żywieniowy pogrupowany w posiłki. Powtarzalne posiłki (meal prep) są pokazane RAZ, z liczbą wystąpień w tygodniu — traktuj taki posiłek jako jedną decyzję żywieniową o wadze proporcjonalnej do liczby powtórzeń. Nie zarzucaj monotonii samej w sobie: meal prep to świadoma strategia, a nie błąd.

Twoje zadania:
1. Oceń tydzień pod kątem redukcji: czy spożycie mieści się w celu kalorycznym, czy białko jest wystarczające (ok. 1,6–2,2 g/kg masy ciała), czy błonnik i sytość są na poziomie, który pozwala wytrzymać deficyt.
2. Wskaż posiłki o najgorszym stosunku kalorii do sytości — to one najbardziej utrudniają redukcję.
3. Zaproponuj konkretne zamienniki produktów, które FAKTYCZNIE pojawiły się w dzienniku.

Priorytety przy zamiennikach (w tej kolejności):
- Obniż kalorie posiłku, nie ruszając białka ani objętości porcji (zamiana tłustego składnika na chudszy, sos na lżejszy odpowiednik).
- Zwiększ sytość przy tej samej kaloryczności (więcej błonnika, warzyw, objętości, białka).
- Popraw smakowitość bez dokładania kalorii (przyprawy, zioła, kwas — ocet, cytryna, musztarda, sos sojowy, jogurt naturalny zamiast majonezu).
- Jeżeli posiłek jest już dobrze zbilansowany, powiedz to wprost zamiast szukać zamiennika na siłę.

Zasady:
- Pisz po polsku, zwięźle i konkretnie, bez owijania w bawełnę.
- Odnoś się do rzeczywistych nazw produktów z dziennika i podawaj gramatury.
- Przy powtarzalnym posiłku licz oszczędność na jedno wystąpienie, ale w uzasadnieniu wspomnij efekt tygodniowy (np. "5× w tygodniu = 900 kcal mniej").
- Nie wymyślaj produktów, których nie ma w danych. Zamienniki mają być dostępne w polskich sklepach.
- Nie zalecaj po prostu "jedz mniej" — proponuj zamianę, która utrzymuje objętość i sytość.
- Jeśli tydzień jest niekompletny (mało dni), zaznacz to w podsumowaniu zamiast wyciągać zbyt mocne wnioski.`;

function num(value: string | null): number {
  return value === null ? 0 : Number.parseFloat(value);
}

/** "150 g" for a stable amount, "150–165 g" when portions drifted. */
function formatAmount(ingredient: MealGroup["ingredients"][number]): string {
  if (ingredient.avgGrams === null) return "?";
  const { minGrams, maxGrams, avgGrams } = ingredient;
  const drifts =
    minGrams !== null && maxGrams !== null && maxGrams - minGrams > 5;
  return drifts ? `${minGrams}–${maxGrams} g` : `${avgGrams} g`;
}

function renderMealGroup(group: MealGroup, index: number): string[] {
  const days = group.instances
    .map((instance) => weekdayName(instance.date).slice(0, 3))
    .join(", ");
  const times = group.instances.length;
  // The same prepped food can land in different slots on different days.
  const slots = [...new Set(group.instances.map((i) => i.slot))].join(" / ");
  const header =
    times > 1
      ? `### Posiłek ${index + 1}: ${slots} — ${times}× w tygodniu (${days})`
      : `### Posiłek ${index + 1}: ${slots} — 1× (${days})`;

  const lines = [
    header,
    `Średnio na porcję: ${group.avgKcal} kcal, B: ${group.avgProtein} g, ` +
      `W: ${group.avgCarbs} g, T: ${group.avgFat} g, błonnik: ${group.avgFiber} g` +
      (times > 1 ? ` | tygodniowo: ${group.avgKcal * times} kcal` : ""),
  ];

  for (const ingredient of group.ingredients) {
    const label = ingredient.brand
      ? `${ingredient.name} (${ingredient.brand})`
      : ingredient.name;
    lines.push(`- ${label} — ${formatAmount(ingredient)}`);
  }

  return [...lines, ""];
}

/**
 * Renders the week as distinct meals rather than a day-by-day dump: a meal
 * eaten five times appears once, annotated with its frequency.
 */
export function buildPrompt(
  items: FitatuMealItem[],
  weekStart: string,
  caloricGoal: number | null,
): string {
  const groups = groupMeals(items);

  const byDate = new Map<string, FitatuMealItem[]>();
  for (const item of items) {
    byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);
  }

  const dayTotals = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayItems]) => ({
      date,
      kcal: Math.round(dayItems.reduce((s, i) => s + num(i.kcal), 0)),
      protein: Math.round(dayItems.reduce((s, i) => s + num(i.protein), 0)),
      carbs: Math.round(dayItems.reduce((s, i) => s + num(i.carbs), 0)),
      fat: Math.round(dayItems.reduce((s, i) => s + num(i.fat), 0)),
      fiber: Math.round(dayItems.reduce((s, i) => s + num(i.fiber), 0)),
    }));

  const avgKcal = Math.round(
    dayTotals.reduce((sum, day) => sum + day.kcal, 0) /
      Math.max(dayTotals.length, 1),
  );

  const lines = [
    `Tydzień: ${weekStart} — ${weekEndOf(weekStart)} (${dayTotals.length} dni z wpisami)`,
    caloricGoal
      ? `Cel kaloryczny: ${caloricGoal} kcal/dzień. Średnie spożycie: ${avgKcal} kcal/dzień ` +
        `(${avgKcal - caloricGoal >= 0 ? "+" : ""}${avgKcal - caloricGoal} kcal względem celu).`
      : `Średnie spożycie: ${avgKcal} kcal/dzień. Cel kaloryczny nie został ustawiony w aplikacji.`,
    "",
    "## Dzienne sumy",
  ];

  for (const day of dayTotals) {
    lines.push(
      `- ${weekdayName(day.date)} ${day.date}: ${day.kcal} kcal, ` +
        `B: ${day.protein} g, W: ${day.carbs} g, T: ${day.fat} g, błonnik: ${day.fiber} g`,
    );
  }

  lines.push("", "## Posiłki (powtarzalne pokazane raz)");
  groups.forEach((group, index) =>
    lines.push(...renderMealGroup(group, index)),
  );

  return lines.join("\n");
}

export class NutritionAnalysisError extends Error {}

/**
 * Runs the LLM over one week of logged meals and stores the result.
 * Returns null when the week has no logged food at all.
 */
export async function analyzeWeek(userId: string, weekStart: string) {
  if (!env.OPENAI_API_KEY) {
    throw new NutritionAnalysisError("OPENAI_API_KEY is not configured");
  }

  const items = await nutritionRepository.findItemsInRange(
    userId,
    weekStart,
    weekEndOf(weekStart),
  );
  // Fitatu returns eaten=false even for fully logged past days, so the flag
  // carries no signal — the sync only pulls past days, which were all eaten.
  const eaten = items.slice(0, MAX_ITEMS);

  if (eaten.length === 0) return null;

  const caloricGoal = await userRepository.findCaloricGoal(userId);

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: MODEL,
    instructions: SYSTEM_PROMPT,
    input: buildPrompt(eaten, weekStart, caloricGoal),
    reasoning: { effort: REASONING_EFFORT },
    text: { format: responseFormat },
  });

  const parsed = analysisSchema.safeParse(JSON.parse(response.output_text));
  if (!parsed.success) {
    throw new NutritionAnalysisError(
      `Model returned unexpected shape: ${parsed.error.message}`,
    );
  }

  return nutritionRepository.upsertInsight({
    userId,
    weekStart,
    summary: parsed.data.summary,
    observations: parsed.data.observations,
    swaps: parsed.data.swaps,
    model: MODEL,
  });
}
