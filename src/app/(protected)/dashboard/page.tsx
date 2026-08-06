import { Suspense } from "react";
import { format, getISOWeek } from "date-fns";
import {
  QuickLogSection,
  QuickLogSectionSkeleton,
} from "@/modules/dashboard/ui/components/quick-log-section";
import {
  KpiStrip,
  KpiStripSkeleton,
} from "@/modules/dashboard/ui/components/kpi-strip";
import {
  DailyGoalsPanel,
  DailyGoalsPanelSkeleton,
} from "@/modules/dashboard/ui/components/daily-goals-panel";
import { resolveWeekContext } from "@/modules/dashboard/utils";
import {
  WeekOverview,
  WeekOverviewSkeleton,
} from "@/modules/dashboard/ui/components/week-overview";

type PageProps = {
  searchParams: Promise<{ week?: string }>;
};

export default async function DashboardPage(props: PageProps) {
  const { week: weekParam } = await props.searchParams;
  const {
    monday,
    sunday,
    nextMonday,
    previousMonday,
    prevMonday,
    prevSunday,
    dayDates,
    dayKeys,
  } = resolveWeekContext(weekParam);

  const now = new Date();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
          {format(now, "EEE · d MMM yyyy")} · week {getISOWeek(now)}
        </p>
      </div>

      <Suspense fallback={<QuickLogSectionSkeleton />}>
        <QuickLogSection />
      </Suspense>

      <Suspense fallback={<KpiStripSkeleton />}>
        <KpiStrip
          monday={monday}
          sunday={sunday}
          prevMonday={prevMonday}
          prevSunday={prevSunday}
        />
      </Suspense>

      <Suspense fallback={<DailyGoalsPanelSkeleton />}>
        <DailyGoalsPanel />
      </Suspense>

      <Suspense fallback={<WeekOverviewSkeleton />}>
        <WeekOverview
          monday={monday}
          sunday={sunday}
          prevMonday={prevMonday}
          prevSunday={prevSunday}
          previousMonday={previousMonday}
          nextMonday={nextMonday}
          dayDates={dayDates}
          dayKeys={dayKeys}
        />
      </Suspense>
    </div>
  );
}
