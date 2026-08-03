import {
  dailyLogRepository,
  measurementsRepository,
  userRepository,
} from "@/modules/body/repositories";
import { nutritionRepository } from "@/modules/nutrition/repositories/nutrition.repo";
import { sessionRepository } from "@/modules/session/repositories/session.repo";
import type { ExportRangeInput } from "../schemas";
import type { ExportData } from "../types";

export async function assembleExportData(
  userId: string,
  range: ExportRangeInput,
): Promise<ExportData> {
  const [dailyLogs, measurements, sessions, mealItems, caloricGoal] =
    await Promise.all([
      dailyLogRepository.findDailyLogsInRange(userId, range.start, range.end),
      measurementsRepository.findMeasurementsInRange(
        userId,
        range.start,
        range.end,
      ),
      sessionRepository.getDetailedSessionsInRange(
        userId,
        range.start,
        range.end,
      ),
      nutritionRepository.findItemsInRange(userId, range.start, range.end),
      userRepository.findCaloricGoal(userId),
    ]);

  return {
    range,
    caloricGoal,
    dailyLogs,
    measurements,
    sessions,
    mealItems: mealItems.filter((item) => item.eaten),
  };
}
