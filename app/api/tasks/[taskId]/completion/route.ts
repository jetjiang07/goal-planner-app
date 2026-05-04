import { NextResponse } from "next/server";

import { ANONYMOUS_USER_ID } from "@/lib/anonymous-user";
import {
  ensureAnonymousUser,
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

export async function POST(request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  const payload = (await request.json().catch(() => null)) as {
    userId?: string;
    status?: unknown;
  } | null;

  if (!isTaskStatus(payload?.status)) {
    return NextResponse.json({ error: "Invalid task status." }, { status: 400 });
  }

  const userId = payload.userId ?? ANONYMOUS_USER_ID;

  try {
    await ensureAnonymousUser({ userId });

    if (payload.status === "pending") {
      const task = await resetTaskCompletion({ taskId, userId });
      return NextResponse.json({ task });
    }

    const result = await recordTaskCompletion({
      taskId,
      userId,
      status: payload.status,
    });

    return NextResponse.json(result);
  } catch (error) {
    logTaskCompletionError(error, {
      taskId,
      userId,
      status: payload.status,
    });
    return NextResponse.json(
      { error: "We could not save that task update. Please try again." },
      { status: 500 },
    );
  }
}
