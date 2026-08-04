import { Button } from "@/components/ui/button";
import { StravaConnectCard } from "@/modules/strava/ui/strava-connect-card";
import { CreateTrainingDialog } from "@/modules/training/ui/components/create-training-dialog";
import { TrainingsSkeleton } from "@/modules/training/ui/components/trainings-skeleton";
import { TrainingsView } from "@/modules/training/ui/views/trainings-view";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

type PageProps = {
  searchParams: Promise<{ hidden?: string }>;
};

export default async function TrainingPage(props: PageProps) {
  const { hidden } = await props.searchParams;
  const showInactive = hidden === "1";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Training</h1>
          <p className="text-muted-foreground mt-1 text-[11px] font-medium tracking-[0.08em] uppercase">
            Training templates · start a session in one click
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={showInactive ? "/training" : "/training?hidden=1"}>
              {showInactive ? <EyeOff /> : <Eye />}
              {showInactive ? "Hide inactive" : "Show inactive"}
            </Link>
          </Button>
          <CreateTrainingDialog />
        </div>
      </div>

      <Suspense key={String(showInactive)} fallback={<TrainingsSkeleton />}>
        <TrainingsView showInactive={showInactive} />
      </Suspense>

      <StravaConnectCard />
    </div>
  );
}
