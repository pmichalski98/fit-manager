import { dateRegex } from "@/lib/utils";
import { z } from "zod";

export const photoSchema = z.object({
  date: z.string().regex(dateRegex, "Invalid date format (YYYY-MM-DD)"),
  weight: z.coerce.string().min(0).max(1000).optional(),
  image: z.instanceof(File),
});
export type PhotoFormValues = z.infer<typeof photoSchema>;
