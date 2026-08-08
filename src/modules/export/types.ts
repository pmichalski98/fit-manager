import type { dailyLogRepository } from "@/modules/body/repositories";
import type { SessionDetail } from "@/modules/session/types";
import type { BodyMeasurement, FitatuMealItem } from "@/server/db/schema";

export type DailyLogEntry = Awaited<
  ReturnType<typeof dailyLogRepository.findDailyLogsInRange>
>[number];

export type ExportData = {
  range: { start: string; end: string };
  caloricGoal: number | null;
  stepsGoal: number | null;
  dailyLogs: DailyLogEntry[];
  measurements: BodyMeasurement[];
  sessions: SessionDetail[];
  /** Eaten items only. */
  mealItems: FitatuMealItem[];
};
