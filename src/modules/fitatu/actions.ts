"use server";

import { revalidatePath } from "next/cache";

import { requireUserId } from "@/lib/user";
import { shiftDate, syncFitatuDays, warsawToday } from "./lib/sync";
import type { FitatuSyncResult } from "./types";

/**
 * Manually pulls a week from Fitatu on demand — the cron only runs once a day,
 * so meals logged after it ran can be imported without waiting for tomorrow.
 */
export async function syncFitatuWeek(weekStart: string): Promise<{
  ok: boolean;
  data: FitatuSyncResult[];
  error?: string;
}> {
  await requireUserId();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return { ok: false, data: [], error: "Nieprawidłowa data" };
  }

  // Future days have nothing to import yet.
  const today = warsawToday();
  const dates = Array.from({ length: 7 }, (_, i) =>
    shiftDate(weekStart, i),
  ).filter((date) => date <= today);
  if (dates.length === 0) {
    return { ok: false, data: [], error: "Ten tydzień jeszcze się nie zaczął" };
  }

  try {
    const data = await syncFitatuDays(dates);
    revalidatePath("/nutrition");
    revalidatePath("/dashboard");
    return { ok: true, data };
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      data: [],
      error: error instanceof Error ? error.message : "Import nie powiódł się",
    };
  }
}
