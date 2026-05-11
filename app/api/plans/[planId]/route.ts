import { NextResponse } from "next/server";

import { getAuthenticatedAppUserId } from "@/lib/auth";
import { ensureAnonymousUser, getPersistedPlanById } from "@/lib/db/persistence";
import type { PersistedGeneratedPlan } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { planId } = await context.params;
  const userId = await getAuthenticatedAppUserId();

  if (!userId) {
    return NextResponse.json({ error: "Sign in to view this plan." }, { status: 401 });
  }

  await ensureAnonymousUser({ userId });

  const persistedPlan = await getPersistedPlanById({ planId, userId });

  if (!persistedPlan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const responseBody: PersistedGeneratedPlan = {
    plan: persistedPlan.generatedPlan,
    planId: persistedPlan.plan.id,
    goalId: persistedPlan.plan.goalId,
    planVersionId: persistedPlan.version.id,
    userId,
    planCreatedAt: persistedPlan.plan.createdAt.toISOString(),
    planStartDate: null,
  };

  return NextResponse.json(responseBody);
}
