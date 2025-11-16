import {
  findLatestCardioSessionWithMetrics,
  findLatestStrengthSessionWithDetails,
} from "@/modules/session/actions";
import { CardioSessionView } from "@/modules/session/ui/views/cardio-session-view";
import { StrengthSessionView } from "@/modules/session/ui/views/strength-session-view";
import { findTrainingByIdWithExercises } from "@/modules/training/actions";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export default async function TrainingSessionPage(props: Props) {
  const params = await props.params;

  const trainingTemplate = await findTrainingByIdWithExercises(params.id);
  if (!trainingTemplate) notFound();

  if (trainingTemplate.type === "strength") {
    const lastTrainingSession = await findLatestStrengthSessionWithDetails(
      trainingTemplate.id,
    );
    return (
      <StrengthSessionView
        template={trainingTemplate}
        last={lastTrainingSession}
        trainingId={params.id}
      />
    );
  }

  const lastCardioSession = await findLatestCardioSessionWithMetrics(
    trainingTemplate.id,
  );

  return (
    <CardioSessionView template={trainingTemplate} last={lastCardioSession} />
  );
}
