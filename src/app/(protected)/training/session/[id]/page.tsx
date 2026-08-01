import {
  findInProgressSession,
  findLatestCardioSessionWithMetrics,
  findLatestStrengthSessionWithDetails,
  getExerciseRecords,
  startStrengthSession,
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
    const [lastTrainingSession, inProgress, exerciseRecords] =
      await Promise.all([
        findLatestStrengthSessionWithDetails(trainingTemplate.id),
        findInProgressSession(trainingTemplate.id),
        getExerciseRecords(trainingTemplate.id),
      ]);

    // If no in-progress session, create one
    const sessionInfo = inProgress
      ? { sessionId: inProgress.sessionId, startAt: inProgress.startAt }
      : await startStrengthSession(trainingTemplate.id);

    return (
      <StrengthSessionView
        template={trainingTemplate}
        last={lastTrainingSession}
        trainingId={params.id}
        sessionId={sessionInfo.sessionId}
        inProgress={inProgress}
        records={exerciseRecords}
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
