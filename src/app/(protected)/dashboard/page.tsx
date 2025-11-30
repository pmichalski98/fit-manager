import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDateYYYYMMDD } from "@/lib/utils";
import { resolveWeekContext } from "@/modules/dashboard/utils";
import { DashboardTable } from "@/modules/dashboard/ui/components/dashboard-table";
import { DashboardTableSkeleton } from "@/modules/dashboard/ui/components/dashboard-skeleton";
import { TrainingConsistency } from "@/modules/dashboard/ui/components/training-consistency";

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

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <Suspense
        fallback={
          <div className="bg-muted/20 h-[180px] w-full animate-pulse rounded-xl border" />
        }
      >
        <TrainingConsistency />
      </Suspense>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Weekly overview (Mon–Sun)</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`?week=${formatDateYYYYMMDD(previousMonday)}`}>
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`?week=${formatDateYYYYMMDD(nextMonday)}`}>Next</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="?">This week</Link>
          </Button>
        </div>
      </div>

      <Suspense
        fallback={
          <DashboardTableSkeleton dayDates={dayDates} dayKeys={dayKeys} />
        }
      >
        <DashboardTable
          monday={monday}
          sunday={sunday}
          prevMonday={prevMonday}
          prevSunday={prevSunday}
          dayDates={dayDates}
          dayKeys={dayKeys}
        />
      </Suspense>
    </div>
  );
}
