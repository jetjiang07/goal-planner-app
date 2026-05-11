import { NextResponse } from "next/server";

import { getAuthenticatedUserIds } from "@/lib/auth";
import {
  ensureAnonymousUser,
  getSafePersistenceError,
  getTaskOwnershipInfo,
  recordTaskCompletion,
  resetTaskCompletion,
} from "@/lib/db/persistence";
import type { DailyTask } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

function isTaskStatus(value: unknown): value is DailyTask["status"] {
  return value === "pending" || value === "complete" || value === "skipped";
}

function logTaskCompletionError(error: unknown, context: Record<string, unknown>) {
  const errorRecord =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          code:
            typeof (error as Error & { code?: unknown }).code === "string"
              ? (error as Error & { code?: unknown }).code
              : undefined,
        }
      : error;

  console.error("[task-completion]", {
    context,
    error: errorRecord,
  });
}

function logTaskCompletionStep(step: string, metadata?: Record<string, unknown>) {
  console.error("[task-completion]", {
    step,
    ...metadata,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const payload = (await request.json().catch(() => null)) as {
    status?: unknown;
  } | null;

  logTaskCompletionStep("request_received", {
    taskId,
    hasStatus: payload?.status !== undefined,
  });

  if (!isTaskStatus(payload?.status)) {
    logTaskCompletionStep("invalid_status", {
      taskId,
      status: payload?.status,
    });
    return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
  }

  const { clerkUserId, appUserId } = await getAuthenticatedUserIds();

  logTaskCompletionStep("auth_checked", {
    hasClerkUserId: Boolean(clerkUserId),
    mappedUserId: appUserId,
    taskId,
  });

  if (!appUserId) {
    return NextResponse.json(
      { error: "Sign in to save task progress." },
      { status: 401 },
    );
  }

  try {
    await ensureAnonymousUser({ userId: appUserId });

    const ownership = await getTaskOwnershipInfo({ taskId });
    const ownershipPassed = ownership?.planUserId === appUserId;

    logTaskCompletionStep("ownership_checked", {
      taskId,
      mappedUserId: appUserId,
      taskFound: Boolean(ownership),
      planId: ownership?.planId,
      ownershipPassed,
    });

    if (!ownershipPassed) {
      return NextResponse.json(
        { error: "We could not save that task update. Please try again." },
        { status: 404 },
      );
    }

    if (payload.status === "pending") {
      const task = await resetTaskCompletion({ taskId, userId: appUserId });
      logTaskCompletionStep("completion_reset", {
        taskId,
        mappedUserId: appUserId,
      });
      return NextResponse.json({ task });
    }

    const result = await recordTaskCompletion({
      taskId,
      userId: appUserId,
      status: payload.status,
    });

    logTaskCompletionStep("completion_recorded", {
      taskId,
      mappedUserId: appUserId,
      status: payload.status,
    });

    return NextResponse.json(result);
  } catch (error) {
    logTaskCompletionError(error, {
      taskId,
      mappedUserId: appUserId,
      status: payload.status,
      dbError: getSafePersistenceError(error),
    });
    return NextResponse.json(
      { error: "We could not save that task update. Please try again." },
      { status: 500 },
    );
  }
}
