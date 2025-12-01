"use server";

import { requireUserId } from "@/lib/user";
import { sessionRepository } from "@/modules/session/repositories/session.repo";
import { dailyLogRepository } from "@/modules/body/repositories";
import { trainingRepository } from "@/modules/training/repositories/training.repo";
import { subDays, format } from "date-fns";

export async function getConsistencyGraphData() {
  const userId = await requireUserId();

  // Fetch ALL sessions for this user (lightweight)
  const distribution = await sessionRepository.getSessionDistribution(userId);

  if (!distribution.length) {
    return {
      firstSessionDate: null,
      distribution: [],
    };
  }

  // The distribution is sorted by date ASC from the repo
  const firstSessionDate = distribution[0]?.date ?? null;

  return {
    firstSessionDate,
    distribution,
  };
}

export async function getDailyLogHistory() {
  const userId = await requireUserId();
  const endDate = new Date();
  const startDate = subDays(endDate, 365);

  return dailyLogRepository.findDailyLogsInRange(
    userId,
    format(startDate, "yyyy-MM-dd"),
    format(endDate, "yyyy-MM-dd"),
  );
}

export async function getAvailableExerciseNames() {
  const userId = await requireUserId();
  const trainings =
    await trainingRepository.findAllTrainingsWithExercises(userId);

  const exercises = new Set<string>();
  for (const training of trainings) {
    for (const exercise of training.exercises) {
      exercises.add(exercise.name);
    }
  }

  return Array.from(exercises).sort();
}

export async function getExerciseProgress(exerciseName: string) {
  const userId = await requireUserId();
  const history = await sessionRepository.getExerciseHistory(
    userId,
    exerciseName,
  );

  // history returns multiple sets per day. We want max weight per day.
  const maxWeightByDate = new Map<string, number>();

  for (const record of history) {
    const dateStr = format(record.date, "yyyy-MM-dd");
    const currentMax = maxWeightByDate.get(dateStr) ?? 0;
    if (record.weight > currentMax) {
      maxWeightByDate.set(dateStr, record.weight);
    }
  }

  return Array.from(maxWeightByDate.entries())
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
