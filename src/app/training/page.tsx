import { TrainingView } from "@/modules/training/ui/views/training-view";
import { startTrainingSessionAction } from "@/modules/training/actions";
import { findAllTrainingsWithExercises } from "@/modules/training/repositories";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function TrainingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  let trainings: Awaited<ReturnType<typeof findAllTrainingsWithExercises>> = [];
  if (userId) {
    trainings = await findAllTrainingsWithExercises(userId);
  }

  return (
    <div className="space-y-8">
      <TrainingView />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your trainings</h2>
        {trainings.length === 0 ? (
          <p className="text-muted-foreground">No trainings yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trainings.map((t) => (
              <li key={t.id} className="rounded-md border p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-muted-foreground text-xs capitalize">
                      {t.type}
                    </div>
                  </div>
                  <form action={startTrainingSessionAction}>
                    <input type="hidden" name="trainingId" value={t.id} />
                    <button className="bg-primary text-primary-foreground inline-flex h-8 items-center rounded-md px-3 text-sm">
                      Start
                    </button>
                  </form>
                </div>
                {t.type === "strength" && t.exercises?.length ? (
                  <ol className="text-muted-foreground text-sm">
                    {(
                      t.exercises as Array<{
                        id: string;
                        position: number;
                        name: string;
                      }>
                    ).map((e) => (
                      <li key={e.id}>
                        {e.position + 1}. {e.name}
                      </li>
                    ))}
                  </ol>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
