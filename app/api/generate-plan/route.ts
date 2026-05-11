import { NextResponse } from "next/server";

import { getAuthenticatedAppUserId } from "@/lib/auth";
import {
  createGoal,
  ensureAnonymousUser,
  getGoalForUser,
  getPersistedPlanById,
  persistGeneratedPlan,
} from "@/lib/db/persistence";
import { generatedPlanJsonSchema, isGeneratedPlan } from "@/lib/plan-schema";
import type {
  DailyTask,
  GeneratePlanRequest,
  GeneratedPlan,
  PersistedGeneratedPlan,
} from "@/lib/types";

export const runtime = "nodejs";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-4.1-mini";
const FRIENDLY_ERROR_MESSAGE =
  "We could not generate your plan right now. Please try again in a moment.";

type OpenAIContentItem = {
  type?: string;
  text?: string;
  refusal?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAIContentItem[];
};

type OpenAIResponseBody = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
};

function logGeneratePlanError(
  category:
    | "openai_api_error"
    | "database_insert_error"
    | "schema_validation_error"
    | "persistence_function_error"
    | "request_validation_error"
    | "unexpected_error",
  error: unknown,
  context?: Record<string, unknown>,
) {
  const errorRecord =
    typeof error === "object" && error !== null ? (error as Record<string, unknown>) : {};

  console.error("[generate-plan]", {
    category,
    context,
    error:
      error instanceof Error
        ? {
            code: typeof errorRecord.code === "string" ? errorRecord.code : undefined,
            name: error.name,
            message: error.message,
          }
        : error,
  });
}

function logGeneratePlanStep(step: string, metadata?: Record<string, unknown>) {
  console.error("[generate-plan]", {
    step,
    ...metadata,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getGeneratedPlanValidationErrors(value: unknown) {
  const errors: string[] = [];

  if (!isRecord(value)) {
    return ["Generated plan is not an object."];
  }

  const requiredStringFields = ["goalSummary", "totalDuration"];
  const requiredArrayFields = [
    "assumptions",
    "phases",
    "weeklyPlan",
    "dailyTasks",
    "resourcesNeeded",
    "risks",
    "adjustmentRules",
  ];

  for (const field of requiredStringFields) {
    if (typeof value[field] !== "string") {
      errors.push(`${field} must be a string.`);
    }
  }

  for (const field of requiredArrayFields) {
    if (!Array.isArray(value[field])) {
      errors.push(`${field} must be an array.`);
    }
  }

  if (Array.isArray(value.dailyTasks)) {
    value.dailyTasks.forEach((task, index) => {
      if (!isRecord(task)) {
        errors.push(`dailyTasks[${index}] must be an object.`);
        return;
      }

      if (!["learn", "practice", "review", "build"].includes(String(task.taskType))) {
        errors.push(`dailyTasks[${index}].taskType is invalid.`);
      }

      if (typeof task.output !== "string") {
        errors.push(`dailyTasks[${index}].output must be a string.`);
      }

      if (typeof task.estimatedMinutes !== "number") {
        errors.push(`dailyTasks[${index}].estimatedMinutes must be a number.`);
      }
    });
  }

  if (Array.isArray(value.weeklyPlan)) {
    value.weeklyPlan.forEach((week, index) => {
      if (!isRecord(week)) {
        errors.push(`weeklyPlan[${index}] must be an object.`);
        return;
      }

      if (typeof week.measurableOutcome !== "string") {
        errors.push(`weeklyPlan[${index}].measurableOutcome must be a string.`);
      }

      if (typeof week.checkpoint !== "string") {
        errors.push(`weeklyPlan[${index}].checkpoint must be a string.`);
      }
    });
  }

  return errors;
}

function isGeneratePlanRequest(value: unknown): value is GeneratePlanRequest {
  if (typeof value !== "object" || value === null || !("intake" in value)) {
    return false;
  }

  const request = value as Partial<GeneratePlanRequest>;
  const intake = request.intake;

  if (typeof intake !== "object" || intake === null) {
    return false;
  }

  return (
    typeof intake.goal === "string" &&
    typeof intake.motivation === "string" &&
    typeof intake.currentLevel === "string" &&
    typeof intake.deadline === "string" &&
    typeof intake.availableTimePerDay === "number" &&
    (intake.timeType === "fragmented" ||
      intake.timeType === "focused" ||
      intake.timeType === "mixed") &&
    typeof intake.constraints === "string" &&
    (typeof intake.preferredStyle === "string" || intake.preferredStyle === undefined) &&
    Array.isArray(request.answers) &&
    request.answers.every(
      (answer) =>
        typeof answer.questionId === "string" &&
        typeof answer.question === "string" &&
        typeof answer.answer === "string",
    )
  );
}

function getOutputText(body: OpenAIResponseBody): string | null {
  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  for (const output of body.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "refusal" && content.refusal) {
        throw new Error(content.refusal);
      }

      if ((content.type === "output_text" || content.type === "text") && content.text) {
        return content.text;
      }
    }
  }

  return null;
}

function buildPrompt({ intake, answers }: GeneratePlanRequest) {
  const dailyMinutes = Math.max(15, Math.round(intake.availableTimePerDay * 60));
  const maxTaskMinutes =
    intake.timeType === "fragmented"
      ? Math.min(30, dailyMinutes)
      : intake.timeType === "mixed"
        ? Math.min(45, dailyMinutes)
        : dailyMinutes;

  return [
    "Create a realistic execution plan from the user's goal intake and clarification answers.",
    "",
    "Planning rules:",
    `- Treat ${dailyMinutes} minutes as a hard daily cap. The combined estimated time for all tasks on the same day must not exceed this cap.`,
    `- No single task should exceed ${maxTaskMinutes} minutes.`,
    "- If the goal cannot realistically fit the deadline or time budget, narrow the scope in the plan instead of overloading the day.",
    "- Make assumptions explicit, practical, and testable. Do not ask questions in the assumptions; state what you are assuming because the user did not provide it.",
    "- Break work into observable actions that a user can mark complete, such as read a named topic, build a specific artifact, solve a defined practice set, review notes, or publish/export a concrete output.",
    "- Each daily task must include taskType set to exactly one of: learn, practice, review, build.",
    "- Each daily task must include output: the concrete thing the user produces, updates, solves, writes, records, exports, or checks.",
    "- Each daily task must include estimatedMinutes as a number and estimatedTime as matching display text.",
    "- Separate task intent by naming each daily task with one of these prefixes: Learning:, Practice:, Review:, or Build:.",
    "- Include a balanced mix of learn, practice, review, and build tasks across the plan. Do not put all learning first and all build work at the end.",
    "- Design for fragmented time by making tasks independently completable, resumable, and small enough to do between commitments.",
    "- Avoid generic advice such as 'study more', 'practice regularly', 'stay consistent', 'watch tutorials', or 'review concepts' unless the exact topic, output, or completion condition is specified.",
    "- Prefer fewer, better tasks per day over an ambitious list. Leave buffer for setup, switching context, and fatigue.",
    "- Every daily task must start with status pending.",
    "- Return only JSON that matches the provided schema.",
    "",
    "Field guidance:",
    "- goalSummary: one sentence describing the narrowed realistic outcome.",
    "- assumptions: 3 to 6 realistic assumptions about scope, schedule, starting level, resources, or missing details.",
    "- phases: each phase needs a clear objective, not a theme.",
    "- weeklyPlan.goals: concrete weekly outcomes that can be checked.",
    "- weeklyPlan.measurableOutcome: one observable result that proves the week worked.",
    "- weeklyPlan.checkpoint: one review question, test, demo, or artifact check used at the end of that week.",
    "- dailyTasks.title: begin with Learning:, Practice:, Review:, or Build:, then describe one specific action and its completion condition.",
    "- dailyTasks.output: name the concrete artifact or evidence produced by the task.",
    "- dailyTasks.estimatedMinutes: use a number that fits inside the hard daily cap.",
    "- dailyTasks.estimatedTime: mirror estimatedMinutes as readable text, such as '25 min'.",
    "- risks: include risks caused by time limits, fragmented attention, deadline pressure, and user constraints.",
    "- adjustmentRules: include simple workload changes based on skipped or completed tasks.",
    "",
    "Realism check before responding:",
    `- For every day, add estimatedMinutes for all tasks with that day number. The total must be <= ${dailyMinutes}.`,
    "- If any day exceeds the cap, remove or shrink lower-value tasks before responding.",
    "- If the whole plan is too dense, reduce scope by narrowing the goalSummary, reducing weekly goals, and keeping the most important learn/practice/review/build tasks.",
    "",
    `Goal: ${intake.goal}`,
    `Motivation: ${intake.motivation}`,
    `Current level: ${intake.currentLevel}`,
    `Deadline or duration: ${intake.deadline}`,
    `Available time per day: ${intake.availableTimePerDay} hours`,
    `Time type: ${intake.timeType}`,
    `Constraints: ${intake.constraints || "None provided"}`,
    `Preferred style: ${intake.preferredStyle || "No preference provided"}`,
    "",
    "Clarification answers:",
    ...answers.map((answer) => `- ${answer.question}: ${answer.answer || "No answer"}`),
  ].join("\n");
}

function getDailyMinutes(availableTimePerDay: number) {
  return Math.max(15, Math.round(availableTimePerDay * 60));
}

function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

function normalizeTaskTime(task: DailyTask, dailyMinutes: number): DailyTask {
  const estimatedMinutes = Math.min(
    dailyMinutes,
    Math.max(5, Math.round(task.estimatedMinutes)),
  );

  return {
    ...task,
    estimatedMinutes,
    estimatedTime: formatMinutes(estimatedMinutes),
    status: "pending",
  };
}

function reduceDailyScope(tasks: DailyTask[], dailyMinutes: number) {
  let reduced = false;
  const tasksByDay = new Map<number, DailyTask[]>();

  for (const task of tasks) {
    const dayTasks = tasksByDay.get(task.day) ?? [];
    dayTasks.push(normalizeTaskTime(task, dailyMinutes));
    tasksByDay.set(task.day, dayTasks);
  }

  const reducedTasks: DailyTask[] = [];

  for (const dayTasks of tasksByDay.values()) {
    let usedMinutes = 0;
    const keptTasks: DailyTask[] = [];

    for (const task of dayTasks) {
      if (usedMinutes + task.estimatedMinutes <= dailyMinutes) {
        keptTasks.push(task);
        usedMinutes += task.estimatedMinutes;
      } else {
        reduced = true;
      }
    }

    if (keptTasks.length === 0 && dayTasks.length > 0) {
      const shortestTask = [...dayTasks].sort(
        (first, second) => first.estimatedMinutes - second.estimatedMinutes,
      )[0];
      keptTasks.push({
        ...shortestTask,
        estimatedMinutes: Math.min(shortestTask.estimatedMinutes, dailyMinutes),
        estimatedTime: formatMinutes(Math.min(shortestTask.estimatedMinutes, dailyMinutes)),
      });
      reduced = true;
    }

    reducedTasks.push(...keptTasks);
  }

  return {
    reduced,
    tasks: reducedTasks.sort((first, second) => first.day - second.day),
  };
}

function applyRealismCheck(plan: GeneratedPlan, availableTimePerDay: number): GeneratedPlan {
  const dailyMinutes = getDailyMinutes(availableTimePerDay);
  const { reduced, tasks } = reduceDailyScope(plan.dailyTasks, dailyMinutes);

  if (!reduced) {
    return {
      ...plan,
      dailyTasks: tasks,
    };
  }

  return {
    ...plan,
    goalSummary: `${plan.goalSummary} Scope has been reduced to fit the daily time budget.`,
    assumptions: [
      ...plan.assumptions,
      `Realism check applied: daily work was capped at ${dailyMinutes} minutes and lower-priority tasks were removed where needed.`,
    ],
    weeklyPlan: plan.weeklyPlan.map((week) => ({
      ...week,
      goals: week.goals.slice(0, 2),
    })),
    dailyTasks: tasks,
    risks: [
      ...plan.risks,
      "The original goal may require more time or a longer deadline than provided.",
    ],
    adjustmentRules: [
      ...plan.adjustmentRules,
      "If daily work still feels too dense, reduce the next day to one practice or build task plus one short review task.",
    ],
  };
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      logGeneratePlanError("openai_api_error", "OPENAI_API_KEY is not configured.");
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
    }

    const payload: unknown = await request.json().catch(() => null);

    if (!isGeneratePlanRequest(payload)) {
      logGeneratePlanError("request_validation_error", "Invalid generate plan request.", {
        hasPayload: payload !== null,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 400 });
    }

    const userId = await getAuthenticatedAppUserId();

    if (!userId) {
      logGeneratePlanError("request_validation_error", "Unauthenticated plan generation request.");
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 401 });
    }

    logGeneratePlanStep("request_validated", {
      userId,
      hasGoalId: Boolean(payload.goalId),
      hasExistingPlanId: Boolean(payload.existingPlanId),
      clarificationAnswerCount: payload.answers.length,
    });

    logGeneratePlanStep("openai_request_started", {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    });

    let response: Response;

    try {
      response = await fetch(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
          input: [
            {
              role: "system",
              content:
                "You are a professional planning coach who creates realistic, execution-first plans for busy users. Be specific, conservative with time, and strict about the JSON schema.",
            },
            {
              role: "user",
              content: buildPrompt(payload),
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "generated_plan",
              strict: true,
              schema: generatedPlanJsonSchema,
            },
          },
        }),
      });
    } catch (error) {
      logGeneratePlanError("openai_api_error", error, {
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 502 });
    }

    const body = (await response.json()) as OpenAIResponseBody;

    logGeneratePlanStep("openai_response_received", {
      status: response.status,
      outputItems: body.output?.length ?? 0,
      hasOutputText: typeof body.output_text === "string",
    });

    if (!response.ok) {
      logGeneratePlanError("openai_api_error", body.error?.message ?? body, {
        status: response.status,
        model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      });
      return NextResponse.json(
        { error: FRIENDLY_ERROR_MESSAGE },
        { status: response.status },
      );
    }

    let outputText: string | null;

    try {
      outputText = getOutputText(body);
    } catch (error) {
      logGeneratePlanError("schema_validation_error", error, {
        stage: "extract_output_text",
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 502 });
    }

    if (!outputText) {
      logGeneratePlanError("schema_validation_error", "OpenAI returned no plan text.", {
        outputItems: body.output?.length ?? 0,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 502 });
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      logGeneratePlanError("schema_validation_error", error, {
        stage: "parse_openai_json",
        outputLength: outputText.length,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 502 });
    }

    if (!isGeneratedPlan(parsed)) {
      logGeneratePlanError("schema_validation_error", "Generated plan failed runtime schema.", {
        parsedType: typeof parsed,
        validationErrors: getGeneratedPlanValidationErrors(parsed),
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 502 });
    }

    logGeneratePlanStep("validate_generated_plan", {
      dailyTaskCount: parsed.dailyTasks.length,
      weeklyPlanCount: parsed.weeklyPlan.length,
      phaseCount: parsed.phases.length,
    });

    const generatedPlan: GeneratedPlan = applyRealismCheck(
      {
        ...parsed,
        dailyTasks: parsed.dailyTasks.map((task) => ({ ...task, status: "pending" })),
      },
      payload.intake.availableTimePerDay,
    );

    try {
      logGeneratePlanStep("ensure_anonymous_user_started", { userId });
      await ensureAnonymousUser({ userId });
      logGeneratePlanStep("ensure_anonymous_user", { userId });
    } catch (error) {
      logGeneratePlanError("database_insert_error", error, {
        operation: "ensure_anonymous_user",
        userId,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
    }

    let goal: string;

    try {
      logGeneratePlanStep("create_find_goal_started", {
        userId,
        existingGoalId: payload.goalId,
      });
      const existingGoal = payload.goalId
        ? await getGoalForUser({ goalId: payload.goalId, userId })
        : null;
      goal =
        existingGoal?.id ??
        (
          await createGoal({
            userId,
            title: payload.intake.goal.slice(0, 120) || "Untitled goal",
            intake: payload.intake,
            clarificationAnswers: payload.answers,
          })
        ).id;
      logGeneratePlanStep("create_find_goal", {
        userId,
        goalId: goal,
        created: !existingGoal,
      });
    } catch (error) {
      logGeneratePlanError("database_insert_error", error, {
        operation: "create_goal",
        userId,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
    }

    let persisted: Awaited<ReturnType<typeof persistGeneratedPlan>>;

    try {
      persisted = await persistGeneratedPlan({
        userId,
        goalId: goal,
        plan: generatedPlan,
        tier: "basic",
        existingPlanId: payload.existingPlanId,
        onStep: (step, metadata) => {
          logGeneratePlanStep(step, metadata);
        },
      });
    } catch (error) {
      logGeneratePlanError("persistence_function_error", error, {
        operation: "persist_generated_plan",
        userId,
        goalId: goal,
        existingPlanId: payload.existingPlanId,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
    }

    let persistedPlan: Awaited<ReturnType<typeof getPersistedPlanById>>;

    try {
      persistedPlan = await getPersistedPlanById({
        userId,
        planId: persisted.plan.id,
      });
      logGeneratePlanStep("return_db_backed_plan_loaded", {
        userId,
        goalId: goal,
        planId: persisted.plan.id,
        planVersionId: persisted.version.id,
        dailyTaskCount: persistedPlan?.generatedPlan.dailyTasks.length ?? 0,
      });
    } catch (error) {
      logGeneratePlanError("persistence_function_error", error, {
        operation: "get_persisted_plan_by_id",
        userId,
        planId: persisted.plan.id,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
    }

    if (!persistedPlan) {
      logGeneratePlanError("persistence_function_error", "Persisted plan lookup returned null.", {
        userId,
        planId: persisted.plan.id,
      });
      return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
    }

    const responseBody: PersistedGeneratedPlan = {
      plan: persistedPlan.generatedPlan,
      planId: persisted.plan.id,
      goalId: goal,
      planVersionId: persisted.version.id,
      userId,
      planCreatedAt: persistedPlan.plan.createdAt.toISOString(),
      planStartDate: null,
    };

    logGeneratePlanStep("return_db_backed_plan", {
      userId,
      goalId: goal,
      planId: responseBody.planId,
      planVersionId: responseBody.planVersionId,
      dailyTaskCount: responseBody.plan.dailyTasks.length,
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    logGeneratePlanError("unexpected_error", error);
    return NextResponse.json({ error: FRIENDLY_ERROR_MESSAGE }, { status: 500 });
  }
}
