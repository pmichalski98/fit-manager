import { z } from "zod";

export const trainingType = z.enum(["strength", "cardio"]);

// Empty form inputs arrive as "" — treat them as null instead of coercing to 0
const optionalTargetInt = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.coerce.number().int().positive().nullable(),
);

export const trainingFormSchema = z.object({
  type: trainingType,
  name: z.string().min(1, "Name is required"),
  exercises: z
    .array(
      z
        .object({
          id: z.string().optional(),
          name: z.string().min(1, "Exercise name is required"),
          targetSets: optionalTargetInt.optional(),
          targetRepsMin: optionalTargetInt.optional(),
          targetRepsMax: optionalTargetInt.optional(),
          // Optional flag to indicate if the user chose to replace the exercise history
          // when renaming. If true, we delete old history and create new.
          // If false/undefined, we keep history (rename).
          replace: z.boolean().optional(),
        })
        .refine(
          (ex) =>
            ex.targetRepsMin == null ||
            ex.targetRepsMax == null ||
            ex.targetRepsMin <= ex.targetRepsMax,
          {
            message: "Min reps must be ≤ max reps",
            path: ["targetRepsMax"],
          },
        ),
    )
    .optional()
    .default([]),
});

export type CreateTrainingInput = z.infer<typeof trainingFormSchema>;
