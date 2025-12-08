import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <div>
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Training Activity</CardTitle>
        </CardHeader>
        {/* Graph Container */}
        <CardContent className="flex min-w-[600px] gap-2">
          {/* Weekday Labels Column */}
          <div className="text-card-foreground bg-card sticky left-0 flex h-[118px] flex-col justify-between pr-2 text-xs">
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
            <div className="text-card-foreground relative h-4 text-xs">
              {monthLabels.map((m, i) => {
                const next = monthLabels[i + 1];
                const endIndex = next ? next.index : weeks.length;
                const centerOffset = ((endIndex - m.index) * 16) / 2;
                const leftPosition = m.index * 16 + centerOffset;

                return (
                  <span
                    key={i}
                    className="absolute whitespace-nowrap"
                    style={{
                      left: `${leftPosition}px`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    {m.label}
                  </span>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-1">
                  {week.map((day, dayIdx) => {
                    const key = format(day, "yyyy-MM-dd");
                    const isFuture = isAfter(day, today);

                    if (isFuture) {
                      return null;
                    }

                    const types = sessionsMap.get(key);
                    let colorClass = "bg-secondary-foreground/30";
                    if (types && types.length > 0) {
                      // Check if ONLY cardio
                      const hasStrength = types.includes("strength");
                      const hasCardio = types.includes("cardio");

                      if (hasStrength && hasCardio) {
                        // Mixed: Could be a different color, or just prioritize strength
                        // Let's prioritize strength for now, or maybe a gradient/distinct color?
                        // User asked for distinction.
                        colorClass = "bg-chart-1";
                      } else if (hasStrength) {
                        colorClass = "bg-chart-2";
                      } else if (hasCardio) {
                        colorClass = "bg-chart-3";
                      }
                    }

                    const formattedDate = format(day, "MMM d, yyyy");
                    const formattedTypes = types
                      ? types
                          .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                          .join(", ")
                      : "No training";

                    return (
                      <div key={dayIdx} className="h-3 w-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-full w-full rounded-[2px] ${colorClass}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-center">
                              <div className="font-bold">{formattedTypes}</div>
                              <div className="text-muted-foreground text-xs">
                                {formattedDate}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="text-card-foreground flex items-center justify-end gap-4 text-sm">
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-chart-2 h-3 w-3 rounded-sm" />
            <span>{strengthCount} Strength</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-chart-3 h-3 w-3 rounded-sm" />
            <span>{cardioCount} Cardio</span>
          </div>
          <div className="text-card-foreground/70 ml-2 text-xs">
            Total: {totalSessions}
          </div>
        </CardFooter>
      </Card>

      {/* Summary Footer */}
    </div>
  );
}
