import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { getDb, type DbClient } from "@/lib/db/client";
import {
  aiAdjustmentRequests,
  dailyTasks,
  goals,
  plans,
  planVersions,
  subscriptions,
  taskCompletions,
  users,
} from "@/lib/db/schema";
import type { ClarificationAnswer, GeneratedPlan, GoalIntake } from "@/lib/types";

type SubscriptionTier = "basic" | "advanced";
type AdjustmentReason =
  | "task_completion"
  | "missed_tasks"
  | "new_requirements"
  | "schedule_change"
  | "scope_change";

export type CreateUserInput = {
  email?: string;
  displayName?: string;
  timezone?: string;
};

export type CreateGoalInput = {
  userId: string;
  title: string;
  intake: GoalIntake;
  clarificationAnswers?: ClarificationAnswer[];
};

export type EnsureAnonymousUserInput = {
  userId: string;
};

export type PersistGeneratedPlanInput = {
  userId: string;
  goalId: string;
  plan: GeneratedPlan;
  tier: SubscriptionTier;
  existingPlanId?: string;
  onStep?: (step: string, metadata?: Record<string, unknown>) => void;
};

export type RecordTaskCompletionInput = {
  taskId: string;
  userId: string;
  status: "complete" | "skipped";
  note?: string;
  metadata?: Record<string, unknown>;
};

export type CreateAiAdjustmentRequestInput = {
  userId: string;
  goalId: string;
  planId: string;
  fromPlanVersionId: string;
  reason: AdjustmentReason;
  userRequest?: string;
  completionSummary?: Record<string, unknown>;
};

function toDailyMinutes(hours: number) {
  return Math.max(15, Math.round(hours * 60));
}

function isAdvancedTier(tier: SubscriptionTier) {
  return tier === "advanced";
}

function logPersistenceStep(
  input: PersistGeneratedPlanInput,
  step: string,
  metadata?: Record<string, unknown>,
) {
  input.onStep?.(step, metadata);
}

function getSafeDbError(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const errorRecord = error as Error & { code?: unknown };

  return {
    code: typeof errorRecord.code === "string" ? errorRecord.code : undefined,
    message: error.message,
  };
}

export async function ensureAnonymousUser(
  input: EnsureAnonymousUserInput,
  db: DbClient = getDb(),
) {
  const [existingUser] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);

  if (existingUser) {
    return existingUser;
  }

  const [user] = await db
    .insert(users)
    .values({
      id: input.userId,
      displayName: "Anonymous User",
      timezone: "UTC",
    })
    .returning();

  await createSubscription({ userId: user.id, tier: "basic" }, db);

  return user;
}

export async function createUser(input: CreateUserInput, db: DbClient = getDb()) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      displayName: input.displayName,
      timezone: input.timezone ?? "UTC",
    })
    .returning();

  return user;
}

export async function createSubscription(
  input: {
    userId: string;
    tier: SubscriptionTier;
    status?: "trialing" | "active" | "past_due" | "canceled" | "expired";
  },
  db: DbClient = getDb(),
) {
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      userId: input.userId,
      tier: input.tier,
      status: input.status ?? "active",
    })
    .returning();

  return subscription;
}

export async function getActiveSubscription(userId: string, db: DbClient = getDb()) {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return subscription ?? null;
}

export async function createGoal(input: CreateGoalInput, db: DbClient = getDb()) {
  const [goal] = await db
    .insert(goals)
    .values({
      userId: input.userId,
      title: input.title,
      rawGoal: input.intake.goal,
      motivation: input.intake.motivation,
      currentLevel: input.intake.currentLevel,
      deadline: input.intake.deadline,
      availableTimePerDayMinutes: toDailyMinutes(input.intake.availableTimePerDay),
      timeType: input.intake.timeType,
      constraints: input.intake.constraints,
      preferredStyle: input.intake.preferredStyle,
      intake: input.intake,
      clarificationAnswers: input.clarificationAnswers ?? [],
    })
    .returning();

  return goal;
}

export async function persistGeneratedPlan(
  input: PersistGeneratedPlanInput,
  db: DbClient = getDb(),
) {
  const isFixed = !isAdvancedTier(input.tier);

  const plan = input.existingPlanId
    ? (
        await db
          .select()
          .from(plans)
          .where(
            and(
              eq(plans.id, input.existingPlanId),
              eq(plans.userId, input.userId),
              eq(plans.goalId, input.goalId),
            ),
          )
          .limit(1)
      )[0]
    : null;

  if (plan?.currentVersionId) {
    const [version] = await db
      .select()
      .from(planVersions)
      .where(eq(planVersions.id, plan.currentVersionId))
      .limit(1);

    if (!version) {
      logPersistenceStep(input, "existing_plan_version_missing", {
        planId: plan.id,
        planVersionId: plan.currentVersionId,
      });
      throw new Error("Existing plan version could not be found.");
    }

    logPersistenceStep(input, "existing_plan_found", {
      planId: plan.id,
      planVersionId: version?.id,
    });

    return { plan, version };
  }

  const persistedPlan =
    plan ??
    (await (async () => {
      logPersistenceStep(input, "insert_plan_started", {
        userId: input.userId,
        goalId: input.goalId,
        isFixed,
      });

      try {
        return (
          await db
            .insert(plans)
            .values({
              userId: input.userId,
              goalId: input.goalId,
              isFixed,
            })
            .returning()
        )[0];
      } catch (error) {
        logPersistenceStep(input, "insert_plan_failed", getSafeDbError(error));
        throw error;
      }
    })());

  logPersistenceStep(input, "insert_plan", {
    planId: persistedPlan.id,
    goalId: persistedPlan.goalId,
    userId: persistedPlan.userId,
    isFixed: persistedPlan.isFixed,
  });

  logPersistenceStep(input, "insert_plan_version_started", {
    planId: persistedPlan.id,
    dailyTaskCount: input.plan.dailyTasks.length,
  });

  let version: typeof planVersions.$inferSelect;

  try {
    [version] = await db
      .insert(planVersions)
      .values({
        planId: persistedPlan.id,
        versionNumber: 1,
        source: "initial_generation",
        changeSummary: "Initial generated plan.",
        planSnapshot: input.plan,
        createdByUserId: input.userId,
      })
      .returning();
  } catch (error) {
    logPersistenceStep(input, "insert_plan_version_failed", {
      planId: persistedPlan.id,
      ...getSafeDbError(error),
    });
    throw error;
  }

  logPersistenceStep(input, "insert_plan_version", {
    planId: persistedPlan.id,
    planVersionId: version.id,
    versionNumber: version.versionNumber,
  });

  try {
    await db
      .update(plans)
      .set({
        currentVersionId: version.id,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, persistedPlan.id));
  } catch (error) {
    logPersistenceStep(input, "update_plan_current_version_failed", {
      planId: persistedPlan.id,
      planVersionId: version.id,
      ...getSafeDbError(error),
    });
    throw error;
  }

  if (input.plan.dailyTasks.length > 0) {
    logPersistenceStep(input, "insert_daily_tasks_started", {
      planId: persistedPlan.id,
      planVersionId: version.id,
      dailyTaskCount: input.plan.dailyTasks.length,
    });

    try {
      await db.insert(dailyTasks).values(
        input.plan.dailyTasks.map((task, index) => ({
          planId: persistedPlan.id,
          planVersionId: version.id,
          sourceTaskId: task.id,
          day: task.day,
          taskType: task.taskType,
          title: task.title,
          output: task.output,
          estimatedTime: task.estimatedTime,
          estimatedMinutes: task.estimatedMinutes,
          status: task.status,
          locked: isFixed,
          position: index,
        })),
      );
    } catch (error) {
      logPersistenceStep(input, "insert_daily_tasks_failed", {
        planId: persistedPlan.id,
        planVersionId: version.id,
        dailyTaskCount: input.plan.dailyTasks.length,
        ...getSafeDbError(error),
      });
      throw error;
    }
  }

  logPersistenceStep(input, "insert_daily_tasks", {
    planId: persistedPlan.id,
    planVersionId: version.id,
    dailyTaskCount: input.plan.dailyTasks.length,
  });

  return {
    plan: { ...persistedPlan, currentVersionId: version.id, isFixed },
    version,
  };
}

export async function recordTaskCompletion(
  input: RecordTaskCompletionInput,
  db: DbClient = getDb(),
) {
  const completedAt = new Date();
  const [previousTask] = await db
    .select()
    .from(dailyTasks)
    .where(eq(dailyTasks.id, input.taskId))
    .limit(1);

  if (!previousTask) {
    throw new Error("Task not found.");
  }

  const [task] = await db
    .update(dailyTasks)
    .set({
      status: input.status,
      updatedAt: completedAt,
    })
    .where(eq(dailyTasks.id, input.taskId))
    .returning();

  if (!task) {
    throw new Error("Task not found.");
  }

  try {
    const [completion] = await db
      .insert(taskCompletions)
      .values({
        taskId: input.taskId,
        userId: input.userId,
        status: input.status,
        note: input.note,
        metadata: input.metadata ?? {},
        completedAt,
      })
      .onConflictDoUpdate({
        target: [taskCompletions.taskId, taskCompletions.userId],
        set: {
          status: input.status,
          note: input.note,
          metadata: input.metadata ?? {},
          completedAt,
        },
      })
      .returning();

    return { task, completion };
  } catch (error) {
    await db
      .update(dailyTasks)
      .set({
        status: previousTask.status,
        updatedAt: new Date(),
      })
      .where(eq(dailyTasks.id, input.taskId));
    throw error;
  }
}

export async function resetTaskCompletion(
  input: { taskId: string; userId: string },
  db: DbClient = getDb(),
) {
  const [previousTask] = await db
    .select()
    .from(dailyTasks)
    .where(eq(dailyTasks.id, input.taskId))
    .limit(1);

  if (!previousTask) {
    throw new Error("Task not found.");
  }

  const [task] = await db
    .update(dailyTasks)
    .set({
      status: "pending",
      updatedAt: new Date(),
    })
    .where(eq(dailyTasks.id, input.taskId))
    .returning();

  if (!task) {
    throw new Error("Task not found.");
  }

  try {
    await db
      .delete(taskCompletions)
      .where(
        and(
          eq(taskCompletions.taskId, input.taskId),
          eq(taskCompletions.userId, input.userId),
        ),
      );
  } catch (error) {
    await db
      .update(dailyTasks)
      .set({
        status: previousTask.status,
        updatedAt: new Date(),
      })
      .where(eq(dailyTasks.id, input.taskId));
    throw error;
  }

  return task;
}

export async function getPersistedPlanById(
  input: { planId: string; userId: string },
  db: DbClient = getDb(),
) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, input.planId), eq(plans.userId, input.userId)))
    .limit(1);

  if (!plan?.currentVersionId) {
    return null;
  }

  const [version] = await db
    .select()
    .from(planVersions)
    .where(eq(planVersions.id, plan.currentVersionId))
    .limit(1);

  if (!version) {
    return null;
  }

  const taskRows = await db
    .select()
    .from(dailyTasks)
    .where(eq(dailyTasks.planVersionId, version.id))
    .orderBy(dailyTasks.day, dailyTasks.position);

  const planSnapshot: GeneratedPlan = {
    ...version.planSnapshot,
    dailyTasks: taskRows.map((task) => ({
      id: task.id,
      day: task.day,
      taskType: task.taskType,
      title: task.title,
      output: task.output,
      estimatedTime: task.estimatedTime,
      estimatedMinutes: task.estimatedMinutes,
      status: task.status,
    })),
  };

  return {
    plan,
    version,
    generatedPlan: planSnapshot,
  };
}

export async function createAiAdjustmentRequest(
  input: CreateAiAdjustmentRequestInput,
  db: DbClient = getDb(),
) {
  const subscription = await getActiveSubscription(input.userId, db);

  if (subscription?.tier !== "advanced") {
    throw new Error("AI-assisted adjustments require an advanced subscription.");
  }

  const [request] = await db
    .insert(aiAdjustmentRequests)
    .values({
      userId: input.userId,
      goalId: input.goalId,
      planId: input.planId,
      fromPlanVersionId: input.fromPlanVersionId,
      reason: input.reason,
      userRequest: input.userRequest,
      completionSummary: input.completionSummary ?? {},
    })
    .returning();

  return request;
}

export async function canEditDailyTasks(userId: string, db: DbClient = getDb()) {
  const subscription = await getActiveSubscription(userId, db);
  return subscription?.tier === "advanced";
}
