import { getAllTrainingsWithExercises } from "@/modules/training/actions";
import { CreateTrainingDialog } from "../components/create-training-dialog";
import { TrainingCard } from "../components/training-card";

export async function TrainingsView({
  showInactive = false,
}: {
  showInactive?: boolean;
}) {
  const { data: trainings } = await getAllTrainingsWithExercises();
  const visible = trainings.filter((t) => showInactive || t.isActive);
  const hiddenCount = trainings.length - visible.length;

  const sortByActive = <T extends { isActive: boolean }>(items: T[]) =>
    [...items].sort((a, b) => Number(b.isActive) - Number(a.isActive));

  const sections = [
    {
      key: "strength",
      label: "Strength",
      marker: "section-marker",
      items: sortByActive(visible.filter((t) => t.type === "strength")),
    },
    {
      key: "cardio",
      label: "Cardio",
      marker: "border-cardio text-cardio border-l-2 pl-2",
      items: sortByActive(visible.filter((t) => t.type === "cardio")),
    },
  ].filter((s) => s.items.length > 0);

  if (sections.length === 0 && hiddenCount > 0) {
    return (
      <div className="rounded-[10px] border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          All {hiddenCount} trainings are inactive. Use “Show inactive” to see
          them.
        </p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[10px] border border-dashed p-12 text-center">
        <div>
          <p className="text-foreground text-lg font-medium">
            No trainings yet
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Create a training to start building a routine you can repeat
            consistently.
          </p>
        </div>
        <CreateTrainingDialog />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.key} className="space-y-3">
          <h2 className="flex items-baseline gap-2 text-[11px] font-semibold tracking-[0.1em] uppercase">
            <span className={section.marker}>{section.label}</span>
            <span className="text-faint font-mono">{section.items.length}</span>
          </h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {section.items.map((training) => (
              <TrainingCard key={training.id} training={training} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
