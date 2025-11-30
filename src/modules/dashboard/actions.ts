"use server";

import { requireUserId } from "@/lib/user";
import { sessionRepository } from "@/modules/session/repositories/session.repo";

export async function getConsistencyGraphData() {
  const userId = await requireUserId();

  // Fetch ALL sessions for this user (lightweight)
  const distribution = await sessionRepository.getSessionDistribution(userId);

  if (!distribution.length) {
    return {
      firstSessionDate: null,
      distribution: [],
    };
  }

  // The distribution is sorted by date ASC from the repo
  const firstSessionDate = distribution[0]?.date ?? null;

  return {
    firstSessionDate,
    distribution,
  };
}
