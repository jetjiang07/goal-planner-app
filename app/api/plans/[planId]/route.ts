import { NextResponse } from "next/server";

import { ANONYMOUS_USER_ID } from "@/lib/anonymous-user";
import { ensureAnonymousUser, getPersistedPlanById } from "@/lib/db/persistence";
import type { PersistedGeneratedPlan } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    planId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { planId } = await context.params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? ANONYMOUS_USER_ID;

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
  };

  return NextResponse.json(responseBody);
}
