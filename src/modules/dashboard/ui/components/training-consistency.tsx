import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getConsistencyGraphData } from "@/modules/dashboard/actions";
import { AutoScrollContainer } from "./auto-scroll-container";
import {
  startOfWeek,
  addDays,
  format,
  isAfter,
  isSameDay,
  getDate,
  getMonth,
  subDays,
} from "date-fns";
import { cn } from "@/lib/utils";

// Cell 12px + 3px gap — used for month label positioning
const CELL_STRIDE = 15;

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

    const dateObj = typeof s.date === "string" ? new Date(s.date) : s.date;
    const key = format(dateObj, "yyyy-MM-dd");

    const existing = sessionsMap.get(key) ?? [];

    totalSessions++;
    if (s.type === "cardio") cardioCount++;
    if (s.type === "strength") strengthCount++;

    existing.push(s.type);
    sessionsMap.set(key, existing);
  }

  // 4. Build grid
  const weeks: Date[][] = [];
  let currentWeekStart = graphStartDate;

  const monthLabels: { index: number; label: string; isYearStart?: boolean }[] =
    [];
  const yearStartWeeks = new Set<number>();

  let weekIndex = 0;
  const lastWeekStart = startOfWeek(graphEndDate, { weekStartsOn: 1 });

  while (!isAfter(currentWeekStart, lastWeekStart)) {
    const weekDays: Date[] = [];
    let monthLabelForWeek: string | null = null;
    let isYearStartWeek = false;

    for (let i = 0; i < 7; i++) {
      const d = addDays(currentWeekStart, i);
      weekDays.push(d);
      if (getDate(d) === 1) {
        const isJanuary = getMonth(d) === 0;
        monthLabelForWeek = format(d, isJanuary ? "MMM yyyy" : "MMM");
        if (isJanuary) isYearStartWeek = true;
      }
    }

    if (monthLabelForWeek) {
      monthLabels.push({
        index: weekIndex,
        label: monthLabelForWeek,
        isYearStart: isYearStartWeek,
      });
      if (isYearStartWeek && weekIndex > 0) yearStartWeeks.add(weekIndex);
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
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-baseline justify-between gap-2">
        <CardTitle>Training Activity</CardTitle>
        <div className="text-muted-foreground flex items-center gap-3.5 font-mono text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="bg-primary size-[9px] rounded-[2px]" />
            {strengthCount} strength
          </span>
          <span className="flex items-center gap-1.5">
            <span className="bg-cardio size-[9px] rounded-[2px]" />
            {cardioCount} cardio
          </span>
          <span>Σ {totalSessions}</span>
        </div>
      </CardHeader>
      <CardContent className="flex gap-2.5">
        {/* Weekday Labels Column - stays fixed */}
        <div className="text-faint flex shrink-0 flex-col gap-[3px] font-mono text-[10px]">
          <div className="h-3.5" />
          <div className="h-3" />
          <div className="h-3 leading-3">Mon</div>
          <div className="h-3" />
          <div className="h-3 leading-3">Wed</div>
          <div className="h-3" />
          <div className="h-3 leading-3">Fri</div>
          <div className="h-3" />
        </div>

        {/* Scrollable grid area */}
        <AutoScrollContainer className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
          <div className="flex min-w-[460px] flex-col gap-[3px]">
            {/* Month Labels Row */}
            <div className="text-faint relative h-3.5 font-mono text-[10px]">
              {monthLabels.map((m, i) => {
                const next = monthLabels[i + 1];
                const endIndex = next ? next.index : weeks.length;
                const centerOffset = ((endIndex - m.index) * CELL_STRIDE) / 2;
                const leftPosition = m.index * CELL_STRIDE + centerOffset;

                return (
                  <span
                    key={i}
                    className={cn(
                      "absolute whitespace-nowrap",
                      m.isYearStart && "text-foreground font-semibold",
                    )}
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
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIdx) => (
                <div
                  key={weekIdx}
                  className={cn(
                    "flex flex-col gap-[3px]",
                    // Vertical rule in the gap before the week containing Jan 1
                    yearStartWeeks.has(weekIdx) &&
                      "before:bg-border relative before:absolute before:top-0 before:bottom-0 before:-left-[2px] before:w-px",
                  )}
                >
                  {week.map((day, dayIdx) => {
                    const key = format(day, "yyyy-MM-dd");
                    const isFuture = isAfter(day, today);

                    if (isFuture) {
                      return null;
                    }

                    const types = sessionsMap.get(key);
                    let colorClass = "bg-heatmap-empty";
                    if (types && types.length > 0) {
                      const hasStrength = types.includes("strength");
                      const hasCardio = types.includes("cardio");

                      if (hasStrength && hasCardio) {
                        colorClass = "bg-heatmap-both";
                      } else if (hasStrength) {
                        colorClass = "bg-primary";
                      } else if (hasCardio) {
                        colorClass = "bg-cardio";
                      }
                    }

                    const isToday = isSameDay(day, today);
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
                              className={cn(
                                "h-full w-full rounded-[2px]",
                                colorClass,
                                isToday && "ring-primary ring-2",
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="font-mono text-xs">
                              {formattedTypes} — {formattedDate}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </AutoScrollContainer>
      </CardContent>
    </Card>
  );
}

// More columns than any viewport can show — the grid is right-aligned and
// clipped on the left, mirroring the real graph after its auto-scroll
const SKELETON_WEEKS = 80;
const SKELETON_ROWS = 7;

export function TrainingConsistencySkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-baseline justify-between">
        <Skeleton className="h-3.5 w-32" />
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
      </CardHeader>
      <CardContent className="flex gap-2.5">
        {/* Day labels */}
        <div className="text-faint flex shrink-0 flex-col gap-[3px] font-mono text-[10px]">
          <div className="h-3.5" />
          <div className="h-3" />
          <Skeleton className="h-3 w-6" />
          <div className="h-3" />
          <Skeleton className="h-3 w-6" />
          <div className="h-3" />
          <Skeleton className="h-3 w-5" />
          <div className="h-3" />
        </div>
        {/* Grid */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {/* Month labels */}
          <div className="mb-[3px] flex h-3.5 justify-end gap-[48px] overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-7 shrink-0" />
            ))}
          </div>
          {/* Dot grid */}
          <div className="flex justify-end gap-[3px]">
            {Array.from({ length: SKELETON_WEEKS }).map((_, w) => (
              <div key={w} className="flex shrink-0 flex-col gap-[3px]">
                {Array.from({ length: SKELETON_ROWS }).map((_, d) => (
                  <div
                    key={d}
                    className="bg-heatmap-empty size-3 animate-pulse rounded-[2px]"
                    style={{ animationDelay: `${(w * 7 + d) * 15}ms` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
