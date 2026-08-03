import { z } from "zod";

import { dateRegex } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;

// Guard against a pathological payload; the UI offers at most 1 year.
const MAX_RANGE_DAYS = 400;

export const exportRangeSchema = z
  .object({
    start: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
    end: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  })
  .refine((range) => range.start <= range.end, {
    message: "Start date must not be after end date",
  })
  .refine(
    (range) =>
      (Date.parse(range.end) - Date.parse(range.start)) / DAY_MS <=
      MAX_RANGE_DAYS,
    { message: `Range must not exceed ${MAX_RANGE_DAYS} days` },
  );

export type ExportRangeInput = z.infer<typeof exportRangeSchema>;
