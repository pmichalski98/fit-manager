import OpenAI from "openai";
import { env } from "@/env";
import { uploadBufferToS3 } from "@/server/s3";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export type MacroEstimate = {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number | null;
};

export async function estimateMacros(
  productName: string,
): Promise<MacroEstimate> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a nutrition expert. Return accurate nutritional data per 100g in JSON format: { kcal, protein, carbs, fat, fiber }. Use reliable nutritional databases. For branded products, use known label data. All values are numbers (grams except kcal). fiber can be null if unknown.",
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

  const data = JSON.parse(content) as Record<string, number | null>;

  return {
    kcalPer100g: data.kcal ?? 0,
    proteinPer100g: data.protein ?? 0,
    carbsPer100g: data.carbs ?? 0,
    fatPer100g: data.fat ?? 0,
    fiberPer100g: data.fiber ?? null,
  };
}

export async function categorizeProduct(
  productName: string,
  brand: string | null,
  categoryNames: string[],
): Promise<string | null> {
  if (categoryNames.length === 0) return null;

  try {
    const response = await openai.chat.completions.create({
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

    // Find exact or close match
    const match = categoryNames.find(
      (c) => c.toLowerCase() === result.toLowerCase(),
    );
    return match ?? null;
  } catch (error) {
    console.error("AI categorization error:", error);
    return null;
  }
}

export async function generateFoodPhoto(
  productName: string,
): Promise<string | null> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Appetizing overhead food photo of ${productName}, food photography, clean white background, natural lighting, minimal styling. Square format.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return null;

    // Download and upload to S3
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;

    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const s3Url = await uploadBufferToS3(
      buffer,
      `food-photos/${crypto.randomUUID()}.png`,
      "image/png",
    );

    return s3Url;
  } catch (error) {
    console.error("Food photo generation error:", error);
    return null;
  }
}
