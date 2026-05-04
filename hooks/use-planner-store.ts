"use client";

import { useEffect, useMemo, useState } from "react";

import { ANONYMOUS_USER_ID } from "@/lib/anonymous-user";
import { emptyPlan, isGeneratedPlan } from "@/lib/plan-schema";
import type {
  ClarificationAnswer,
  DailyTask,
  GeneratedPlan,
  GeneratePlanRequest,
  GoalIntake,
  PersistedGeneratedPlan,
} from "@/lib/types";

const INTAKE_KEY = "goal-planner:intake";
const ANSWERS_KEY = "goal-planner:answers";
const PLAN_KEY = "goal-planner:generated-plan";
const PLAN_ID_KEY = "goal-planner:plan-id";
const GOAL_ID_KEY = "goal-planner:goal-id";
const USER_ID_KEY = "goal-planner:user-id";

const defaultIntake: GoalIntake = {
  goal: "",
  motivation: "",
  currentLevel: "",
  deadline: "",
  availableTimePerDay: 1,
  timeType: "mixed",
  constraints: "",
  preferredStyle: "",
};

type CompletionStats = {
  total: number;
  attempted: number;
  complete: number;
  skipped: number;
  completionRate: number;
  attemptedCompletionRate: number;
  skippedRate: number;
};

type ProgressFeedback = {
  mode: "lighter" | "harder" | "steady";
  message: string;
};

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function isPersistedGeneratedPlan(value: unknown): value is PersistedGeneratedPlan {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as Partial<PersistedGeneratedPlan>;

  return (
    typeof response.planId === "string" &&
    typeof response.goalId === "string" &&
    typeof response.planVersionId === "string" &&
    typeof response.userId === "string" &&
    isGeneratedPlan(response.plan)
  );
}

function formatMinutes(minutes: number) {
  return `${minutes} min`;
}

function getDailyCap(availableTimePerDay: number) {
  return Math.max(15, Math.round(availableTimePerDay * 60));
}

function getCompletionStats(tasks: DailyTask[]): CompletionStats {
  const total = tasks.length;
  const complete = tasks.filter((task) => task.status === "complete").length;
  const skipped = tasks.filter((task) => task.status === "skipped").length;
  const attempted = complete + skipped;
  const completionRate = total ? Math.round((complete / total) * 100) : 0;
  const attemptedCompletionRate = attempted ? Math.round((complete / attempted) * 100) : 0;
  const skippedRate = total ? Math.round((skipped / total) * 100) : 0;

  return {
    total,
    attempted,
    complete,
    skipped,
    completionRate,
    attemptedCompletionRate,
    skippedRate,
  };
}

function getProgressFeedback(stats: CompletionStats): ProgressFeedback {
  if (stats.skipped > 0) {
    return {
      mode: "lighter",
      message: "You missed at least one task. The next pending day is softened where possible so it is easier to restart.",
    };
  }

  if (stats.attempted >= 3 && stats.attemptedCompletionRate >= 90) {
    return {
      mode: "harder",
      message: "You are completing tasks consistently. The next pending day can take a small stretch if there is time available.",
    };
  }

  return {
    mode: "steady",
    message: "Keep the current workload steady until there is a clearer completion pattern.",
  };
}

function getNextPendingDay(tasks: DailyTask[]) {
  const attemptedDays = tasks
    .filter((task) => task.status !== "pending")
    .map((task) => task.day);
  const latestAttemptedDay = attemptedDays.length ? Math.max(...attemptedDays) : 0;
  const upcomingDays = tasks
    .filter((task) => task.status === "pending" && task.day > latestAttemptedDay)
    .map((task) => task.day);

  if (upcomingDays.length > 0) {
    return Math.min(...upcomingDays);
  }

  const pendingDays = tasks
    .filter((task) => task.status === "pending")
    .map((task) => task.day);

  return pendingDays.length ? Math.min(...pendingDays) : null;
}

function removeAdjustmentPrefix(title: string) {
  return title.replace(/^(Light|Stretch):\s+/, "");
}

function lightenTask(task: DailyTask): DailyTask {
  if (task.title.startsWith("Light:")) {
    return task;
  }

  const estimatedMinutes = Math.max(10, Math.round(task.estimatedMinutes * 0.75));

  return {
    ...task,
    title: `Light: ${removeAdjustmentPrefix(task.title)}`,
    output: `Smaller version of: ${task.output}`,
    estimatedMinutes,
    estimatedTime: formatMinutes(estimatedMinutes),
  };
}

function stretchTask(task: DailyTask, extraMinutes: number): DailyTask {
  if (task.title.startsWith("Stretch:") || extraMinutes <= 0) {
    return task;
  }

  const estimatedMinutes = task.estimatedMinutes + extraMinutes;

  return {
    ...task,
    title: `Stretch: ${removeAdjustmentPrefix(task.title)}`,
    output: `${task.output} plus one extra example, rep, test case, or improvement.`,
    estimatedMinutes,
    estimatedTime: formatMinutes(estimatedMinutes),
  };
}

function adjustUpcomingDays(
  plan: GeneratedPlan,
  feedback: ProgressFeedback,
  dailyCapMinutes: number,
): GeneratedPlan {
  if (feedback.mode === "steady") {
    return plan;
  }

  const nextPendingDay = getNextPendingDay(plan.dailyTasks);

  if (!nextPendingDay) {
    return plan;
  }

  if (feedback.mode === "lighter") {
    return {
      ...plan,
      dailyTasks: plan.dailyTasks.map((task) => {
        if (task.status !== "pending" || task.day !== nextPendingDay) {
          return task;
        }

        return lightenTask(task);
      }),
    };
  }

  const nextDayTasks = plan.dailyTasks.filter(
    (task) => task.status === "pending" && task.day === nextPendingDay,
  );
  const currentDayMinutes = nextDayTasks.reduce(
    (total, task) => total + task.estimatedMinutes,
    0,
  );
  const headroomMinutes = dailyCapMinutes - currentDayMinutes;

  if (headroomMinutes < 10) {
    return plan;
  }

  const stretchTarget =
    nextDayTasks.find((task) => task.taskType === "practice" || task.taskType === "build") ??
    nextDayTasks[0];
  const extraMinutes = Math.min(15, headroomMinutes);

  return {
    ...plan,
    dailyTasks: plan.dailyTasks.map((task) =>
      task.id === stretchTarget.id ? stretchTask(task, extraMinutes) : task,
    ),
  };
}

export function usePlannerStore() {
  const [intake, setIntakeState] = useState<GoalIntake>(defaultIntake);
  const [answers, setAnswersState] = useState<ClarificationAnswer[]>([]);
  const [plan, setPlanState] = useState<GeneratedPlan>(emptyPlan);
  const [planId, setPlanIdState] = useState<string | null>(null);
  const [goalId, setGoalIdState] = useState<string | null>(null);
  const [userId, setUserIdState] = useState(ANONYMOUS_USER_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedPlan = readStorage<unknown>(PLAN_KEY, emptyPlan);
    const storedPlanId = readStorage<string | null>(PLAN_ID_KEY, null);
    const storedGoalId = readStorage<string | null>(GOAL_ID_KEY, null);
    const storedUserId = readStorage<string>(USER_ID_KEY, ANONYMOUS_USER_ID);

    setIntakeState(readStorage(INTAKE_KEY, defaultIntake));
    setAnswersState(readStorage(ANSWERS_KEY, []));
    setPlanState(isGeneratedPlan(storedPlan) ? storedPlan : emptyPlan);
    setPlanIdState(storedPlanId);
    setGoalIdState(storedGoalId);
    setUserIdState(storedUserId);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !planId) {
      return;
    }

    let isCancelled = false;

    async function loadPersistedPlan() {
      const response = await fetch(`/api/plans/${planId}?userId=${userId}`);

      if (!response.ok) {
        return;
      }

      const body: unknown = await response.json();

      if (!isPersistedGeneratedPlan(body) || isCancelled) {
        return;
      }

      setPlanState(body.plan);
      setGoalIdState(body.goalId);
      setUserIdState(body.userId);
      writeStorage(PLAN_KEY, body.plan);
      writeStorage(GOAL_ID_KEY, body.goalId);
      writeStorage(USER_ID_KEY, body.userId);
    }

    void loadPersistedPlan();

    return () => {
      isCancelled = true;
    };
  }, [isReady, planId, userId]);

  const setIntake = (value: GoalIntake) => {
    setIntakeState(value);
    writeStorage(INTAKE_KEY, value);
  };

  const setAnswers = (value: ClarificationAnswer[]) => {
    setAnswersState(value);
    writeStorage(ANSWERS_KEY, value);
  };

  const generatePlan = async (latestAnswers = answers) => {
    const currentIntake = intake.goal.trim()
      ? intake
      : readStorage(INTAKE_KEY, defaultIntake);
    const request: GeneratePlanRequest = {
      intake: currentIntake,
      answers: latestAnswers,
      userId,
      goalId: goalId ?? undefined,
      existingPlanId: planId ?? undefined,
    };

    const response = await fetch("/api/generate-plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errorBody?.error ?? "Plan generation failed.");
    }

    const generatedPlan: unknown = await response.json();

    if (!isPersistedGeneratedPlan(generatedPlan)) {
      throw new Error("Generated plan did not match the persisted app schema.");
    }

    setPlanState(generatedPlan.plan);
    setPlanIdState(generatedPlan.planId);
    setGoalIdState(generatedPlan.goalId);
    setUserIdState(generatedPlan.userId);
    writeStorage(PLAN_KEY, generatedPlan.plan);
    writeStorage(PLAN_ID_KEY, generatedPlan.planId);
    writeStorage(GOAL_ID_KEY, generatedPlan.goalId);
    writeStorage(USER_ID_KEY, generatedPlan.userId);
    return generatedPlan.plan;
  };

  const updateTaskStatus = async (taskId: string, status: DailyTask["status"]) => {
    const previousPlan = plan;
    const statusUpdatedPlan = {
      ...plan,
      dailyTasks: plan.dailyTasks.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    };
    const nextStats = getCompletionStats(statusUpdatedPlan.dailyTasks);
    const currentIntake = intake.goal.trim()
      ? intake
      : readStorage(INTAKE_KEY, defaultIntake);
    const updatedPlan = adjustUpcomingDays(
      statusUpdatedPlan,
      getProgressFeedback(nextStats),
      getDailyCap(currentIntake.availableTimePerDay),
    );

    setPlanState(updatedPlan);
    writeStorage(PLAN_KEY, updatedPlan);

    try {
      const response = await fetch(`/api/tasks/${taskId}/completion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Task completion update failed.");
      }
    } catch (error) {
      setPlanState(previousPlan);
      writeStorage(PLAN_KEY, previousPlan);
      console.error(error);
    }
  };

  const completionStats = useMemo(() => {
    return getCompletionStats(plan.dailyTasks);
  }, [plan]);
  const progressFeedback = useMemo(
    () => getProgressFeedback(completionStats),
    [completionStats],
  );

  return {
    answers,
    completionStats,
    generatePlan,
    intake,
    isReady,
    plan,
    planId,
    progressFeedback,
    setAnswers,
    setIntake,
    updateTaskStatus,
  };
}
