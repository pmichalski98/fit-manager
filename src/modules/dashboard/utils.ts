import { formatDateYYYYMMDD } from "@/lib/utils";

export function formatShortDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatDurationMin(min: number | null | undefined) {
  if (!min || min <= 0) return "—";
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

export function strengthExerciseLabel(ex: {
  name: string;
  setCount: number;
  avgReps: number;
  avgWeightKg: number | null;
}) {
  const weightPart =
    ex.avgWeightKg != null ? `${ex.avgWeightKg.toFixed(1)}kg` : "";
  return weightPart
    ? `${ex.name} ${ex.setCount}x${ex.avgReps}x${weightPart}`
    : `${ex.name} ${ex.setCount}x${ex.avgReps}`;
}

export function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

export function nextDayStart(d: Date) {
  const n = new Date(d);
  n.setDate(n.getDate() + 1);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function getWeekRange(today: Date) {
  const day = today.getDay(); // 0=Sun..6=Sat
  const mondayOffset = day === 0 ? -6 : 1 - day; // move to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

export type WeekContext = {
  monday: Date;
  sunday: Date;
  nextMonday: Date;
  previousMonday: Date;
  prevMonday: Date;
  prevSunday: Date;
  dayDates: Date[];
  dayKeys: string[];
};

export function resolveWeekContext(weekParam?: string): WeekContext {
  let base = new Date();
  if (weekParam) {
    const parts = weekParam.split("-");
    if (parts.length === 3) {
      const y = Number(parts[0]);
      const m = Number(parts[1]);
      const d = Number(parts[2]);
      if (
        Number.isFinite(y) &&
        Number.isFinite(m) &&
        Number.isFinite(d) &&
        y >= 1970 &&
        m >= 1 &&
        m <= 12 &&
        d >= 1 &&
        d <= 31
      ) {
        base = new Date(y, m - 1, d);
        base.setHours(0, 0, 0, 0);
      }
    }
  }
  const { monday, sunday } = getWeekRange(base);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  nextMonday.setHours(0, 0, 0, 0);
  const previousMonday = new Date(monday);
  previousMonday.setDate(monday.getDate() - 7);
  previousMonday.setHours(0, 0, 0, 0);
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  prevMonday.setHours(0, 0, 0, 0);
  const prevSunday = new Date(prevMonday);
  prevSunday.setDate(prevMonday.getDate() + 6);
  prevSunday.setHours(23, 59, 59, 999);

  const dayDates: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
  const dayKeys = dayDates.map(formatDateYYYYMMDD);

  return {
    monday,
    sunday,
    nextMonday,
    previousMonday,
    prevMonday,
    prevSunday,
    dayDates,
    dayKeys,
  };
}
