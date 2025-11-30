import { getConsistencyGraphData } from "@/modules/dashboard/actions";
import {
  startOfWeek,
  addDays,
  format,
  isAfter,
  getDate,
  subDays,
} from "date-fns";

export async function TrainingConsistency() {
  const data = await getConsistencyGraphData();

  if (!data) return null;

  const { distribution, firstSessionDate } = data;
  const today = new Date();
  const oneYearAgo = subDays(today, 365);

  // 1. Determine start date: Max(oneYearAgo, firstSessionDate)
  let startDate = oneYearAgo;

  const firstDateObj =
    firstSessionDate && typeof firstSessionDate === "string"
      ? new Date(firstSessionDate)
      : (firstSessionDate as Date | null);

  if (firstDateObj && isAfter(firstDateObj, oneYearAgo)) {
    startDate = firstDateObj;
  }

  // 2. Align to Monday
  // We want to ensure we encompass all sessions.
  // If first session is mid-week, we still need to start from Monday of that week.
  const graphStartDate = startOfWeek(startDate, { weekStartsOn: 1 });
  const graphEndDate = today;

  // 3. Process data
  const sessionsMap = new Map<string, string[]>(); // date -> types[]

  let totalSessions = 0;
  let cardioCount = 0;
  let strengthCount = 0;

  for (const s of distribution) {
    if (!s.date) {
      continue;
    }

    // Using ISO string split to get the YYYY-MM-DD part correctly in local context might be tricky if 'date' is string or Date
    // The repo returns { date: string, type: string } because of the fix?
    // Actually the type definition in repo says date: Date | string now maybe?
    // Let's handle it robustly.

    const dateObj = typeof s.date === "string" ? new Date(s.date) : s.date;
    const key = format(dateObj, "yyyy-MM-dd");

    const existing = sessionsMap.get(key) ?? [];

    // Count every row
    totalSessions++;
    if (s.type === "cardio") cardioCount++;
    if (s.type === "strength") strengthCount++;

    existing.push(s.type);
    sessionsMap.set(key, existing);
  }

  // 4. Build grid
  const weeks: Date[][] = [];
  let currentWeekStart = graphStartDate;

  // We'll track month changes for labels
  const monthLabels: { index: number; label: string }[] = [];

  let weekIndex = 0;
  // Stop if currentWeekStart is strictly AFTER graphEndDate.
  // If currentWeekStart contains graphEndDate (today), we process it.
  // addDays(graphEndDate, 1) check was slightly loose or correct?
  // We want the week containing today to be the last week.
  // "startOfWeek" of today matches the last week's start.
  // So while currentWeekStart <= startOfWeek(today)

  const lastWeekStart = startOfWeek(graphEndDate, { weekStartsOn: 1 });

  while (!isAfter(currentWeekStart, lastWeekStart)) {
    const weekDays: Date[] = [];
    let monthLabelForWeek = null;

    for (let i = 0; i < 7; i++) {
      const d = addDays(currentWeekStart, i);
      weekDays.push(d);
      if (getDate(d) === 1) {
        monthLabelForWeek = format(d, "MMM");
      }
    }

    if (monthLabelForWeek) {
      monthLabels.push({ index: weekIndex, label: monthLabelForWeek });
    } else if (weekIndex === 0) {
      monthLabels.push({
        index: weekIndex,
        label: format(currentWeekStart, "MMM"),
      });
    }

    weeks.push(weekDays);
    currentWeekStart = addDays(currentWeekStart, 7);
    weekIndex++;
  }

  return (
    <div className="space-y-4 overflow-hidden rounded-xl border p-6 shadow-sm">
      <h3 className="sticky left-0 font-semibold">Training Activity</h3>

      {/* Graph Container */}
      <div className="flex min-w-[600px] gap-2">
        {/* Weekday Labels Column */}
        <div className="text-muted-foreground bg-background sticky left-0 flex h-[118px] flex-col justify-between pr-2 text-xs">
          <div className="h-3" />
          <div className="h-3 leading-3">Mon</div>
          <div className="h-3" />
          <div className="h-3 leading-3">Wed</div>
          <div className="h-3" />
          <div className="h-3 leading-3">Fri</div>
          <div className="h-3" />
        </div>

        <div className="flex flex-col gap-1">
          {/* Month Labels Row */}
          <div className="text-muted-foreground relative mx-auto flex h-4 text-xs">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${m.index * 16}px`,
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => {
                  const key = format(day, "yyyy-MM-dd");
                  const types = sessionsMap.get(key);
                  const isFuture = isAfter(day, today);

                  let colorClass = "bg-muted";
                  if (!isFuture && types && types.length > 0) {
                    // Check if ONLY cardio
                    const hasStrength = types.includes("strength");
                    const hasCardio = types.includes("cardio");

                    if (hasStrength && hasCardio) {
                      // Mixed: Could be a different color, or just prioritize strength
                      // Let's prioritize strength for now, or maybe a gradient/distinct color?
                      // User asked for distinction.
                      colorClass = "bg-emerald-600 dark:bg-emerald-500";
                    } else if (hasStrength) {
                      colorClass = "bg-emerald-600 dark:bg-emerald-500";
                    } else if (hasCardio) {
                      colorClass = "bg-lime-400 dark:bg-lime-400";
                    }
                  }

                  return (
                    <div
                      key={dayIdx}
                      className={`h-3 w-3 rounded-[2px] ${colorClass}`}
                      title={`${format(day, "MMM d, yyyy")}${
                        types ? `: ${types.join(", ")}` : ""
                      }`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="text-muted-foreground sticky left-0 mt-2 flex items-center justify-end gap-4 border-t pt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
          <span>{strengthCount} Strength</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-lime-400 dark:bg-lime-400" />
          <span>{cardioCount} Cardio</span>
        </div>
        <div className="text-muted-foreground/70 ml-2 text-xs">
          Total: {totalSessions}
        </div>
      </div>
    </div>
  );
}
