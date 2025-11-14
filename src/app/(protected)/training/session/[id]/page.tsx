import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  findSessionById,
  findTrainingByIdWithExercises,
  findLatestStrengthSessionWithDetails,
  findLatestCardioSessionWithMetrics,
} from "@/modules/training/repositories";
import { TrainingStrengthSessionView } from "@/modules/training/ui/views/strength-session-view";
import { TrainingCardioSessionView } from "@/modules/training/ui/views/cardio-session-view";
import { headers } from "next/headers";

type Props = { params: Promise<{ id: string }> };

export default async function TrainingSessionPage(props: Props) {
  const params = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId) notFound();

  type SessionRow = {
    id: string;
    userId: string;
    trainingId: string;
    type: "strength" | "cardio";
    startAt: string | Date;
  };

  const trainingSession = (await findSessionById(
    params.id,
  )) as SessionRow | null;
  if (trainingSession?.userId !== userId) notFound();

  type TemplateExercise = { id: string; name: string; position: number };
  type TemplateRow = {
    id: string;
    name: string;
    type: "strength" | "cardio";
    exercises: TemplateExercise[];
  };

  const tpl = (await findTrainingByIdWithExercises(
    userId,
    trainingSession.trainingId,
  )) as TemplateRow | null;
  if (!tpl) notFound();

  if (trainingSession.type === "strength") {
    type LastStrength = {
      session: { id: string; startAt: string | Date };
      exercises: Array<{
        id: string;
        name: string;
        position: number;
        sets: Array<{ setIndex: number; reps: number; weight: string | null }>;
      }>;
    } | null;

    const last = (await findLatestStrengthSessionWithDetails(
      userId,
      trainingSession.trainingId,
    )) as LastStrength;
    return (
      <TrainingStrengthSessionView
        session={{ id: trainingSession.id, startAt: trainingSession.startAt }}
        template={{ id: tpl.id, name: tpl.name, exercises: tpl.exercises }}
        last={last}
      />
    );
  }

  type LastCardio = {
    session: { id: string; startAt: string | Date };
    metrics: {
      durationSec: number;
      distanceM: number | null;
      kcal: number | null;
      avgHr: number | null;
      avgSpeedKmh: string | null;
      avgPowerW: number | null;
      notes: string | null;
    } | null;
  } | null;
  const last = (await findLatestCardioSessionWithMetrics(
    userId,
    trainingSession.trainingId,
  )) as LastCardio;

  return (
    <TrainingCardioSessionView
      session={{ id: trainingSession.id, startAt: trainingSession.startAt }}
      template={{ id: tpl.id, name: tpl.name }}
      last={last}
    />
  );
}
