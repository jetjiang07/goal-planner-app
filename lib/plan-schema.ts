import type { DailyTask, GeneratedPlan } from "@/lib/types";

type JsonSchema = {
  type: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  additionalProperties?: boolean;
  enum?: string[];
};

const stringArraySchema: JsonSchema = {
  type: "array",
  items: { type: "string" },
};

export const generatedPlanJsonSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "goalSummary",
    "assumptions",
    "totalDuration",
    "phases",
    "weeklyPlan",
    "dailyTasks",
    "resourcesNeeded",
    "risks",
    "adjustmentRules",
  ],
  properties: {
    goalSummary: { type: "string" },
    assumptions: stringArraySchema,
    totalDuration: { type: "string" },
    phases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "duration", "objective"],
        properties: {
          name: { type: "string" },
          duration: { type: "string" },
          objective: { type: "string" },
        },
      },
    },
    weeklyPlan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["week", "focus", "goals", "measurableOutcome", "checkpoint"],
        properties: {
          week: { type: "number" },
          focus: { type: "string" },
          goals: stringArraySchema,
          measurableOutcome: { type: "string" },
          checkpoint: { type: "string" },
        },
      },
    },
    dailyTasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "day",
          "taskType",
          "title",
          "output",
          "estimatedTime",
          "estimatedMinutes",
          "status",
        ],
        properties: {
          id: { type: "string" },
          day: { type: "number" },
          taskType: { type: "string", enum: ["learn", "practice", "review", "build"] },
          title: { type: "string" },
          output: { type: "string" },
          estimatedTime: { type: "string" },
          estimatedMinutes: { type: "number" },
          status: { type: "string", enum: ["pending", "complete", "skipped"] },
        },
      },
    },
    resourcesNeeded: stringArraySchema,
    risks: stringArraySchema,
    adjustmentRules: stringArraySchema,
  },
};

export const emptyPlan: GeneratedPlan = {
  goalSummary: "",
  assumptions: [],
  totalDuration: "",
  phases: [],
  weeklyPlan: [],
  dailyTasks: [],
  resourcesNeeded: [],
  risks: [],
  adjustmentRules: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isTaskStatus(value: unknown): value is DailyTask["status"] {
  return value === "pending" || value === "complete" || value === "skipped";
}

function isTaskType(value: unknown): value is DailyTask["taskType"] {
  return value === "learn" || value === "practice" || value === "review" || value === "build";
}

export function isGeneratedPlan(value: unknown): value is GeneratedPlan {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.goalSummary === "string" &&
    isStringArray(value.assumptions) &&
    typeof value.totalDuration === "string" &&
    Array.isArray(value.phases) &&
    value.phases.every(
      (phase) =>
        isRecord(phase) &&
        typeof phase.name === "string" &&
        typeof phase.duration === "string" &&
        typeof phase.objective === "string",
    ) &&
    Array.isArray(value.weeklyPlan) &&
    value.weeklyPlan.every(
      (week) =>
        isRecord(week) &&
        typeof week.week === "number" &&
        typeof week.focus === "string" &&
        isStringArray(week.goals) &&
        typeof week.measurableOutcome === "string" &&
        typeof week.checkpoint === "string",
    ) &&
    Array.isArray(value.dailyTasks) &&
    value.dailyTasks.every(
      (task) =>
        isRecord(task) &&
        typeof task.id === "string" &&
        typeof task.day === "number" &&
        isTaskType(task.taskType) &&
        typeof task.title === "string" &&
        typeof task.output === "string" &&
        typeof task.estimatedTime === "string" &&
        typeof task.estimatedMinutes === "number" &&
        isTaskStatus(task.status),
    ) &&
    isStringArray(value.resourcesNeeded) &&
    isStringArray(value.risks) &&
    isStringArray(value.adjustmentRules)
  );
}
