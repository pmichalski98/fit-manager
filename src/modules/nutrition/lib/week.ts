/** Week helpers. Weeks run Monday → Sunday, matching how Fitatu shows them. */

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return formatDate(new Date(parseDate(date).getTime() + days * DAY_MS));
}

/** Monday of the week containing the given date. */
export function weekStartOf(date: string): string {
  const d = parseDate(date);
  // getUTCDay(): 0 = Sunday, so Sunday belongs to the week that began 6 days ago.
  const offset = (d.getUTCDay() + 6) % 7;
  return addDays(date, -offset);
}

export function weekEndOf(weekStart: string): string {
  return addDays(weekStart, 6);
}

/** Monday of the most recent week that has already finished. */
export function lastCompletedWeekStart(today: string): string {
  return addDays(weekStartOf(today), -7);
}

const WEEKDAYS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
] as const;

export function weekdayName(date: string): string {
  return WEEKDAYS[(parseDate(date).getUTCDay() + 6) % 7]!;
}
