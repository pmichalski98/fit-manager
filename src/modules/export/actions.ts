"use server";

import { requireUserId } from "@/lib/user";
import { exportRangeSchema, type ExportRangeInput } from "./schemas";
import { assembleExportData } from "./services/export-data";
import { renderExportMarkdown } from "./services/export-markdown";

export async function exportDataForAnalysis(input: ExportRangeInput) {
  const userId = await requireUserId();
  const parsed = exportRangeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, data: null, error: "Invalid date range" };
  }
  try {
    const data = await assembleExportData(userId, parsed.data);
    return {
      ok: true as const,
      data: {
        markdown: renderExportMarkdown(data),
        filename: `fitness-data-${parsed.data.start}_${parsed.data.end}.md`,
      },
    };
  } catch (error) {
    console.error(error);
    return { ok: false as const, data: null, error: "Internal server error" };
  }
}
