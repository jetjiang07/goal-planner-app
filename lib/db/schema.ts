import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { ClarificationAnswer, GeneratedPlan, GoalIntake } from "@/lib/types";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const subscriptionTierEnum = pgEnum("subscription_tier", ["basic", "advanced"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "expired",
]);
export const goalStatusEnum = pgEnum("goal_status", [
  "draft",
  "active",
  "completed",
  "archived",
]);
export const planStatusEnum = pgEnum("plan_status", [
  "draft",
  "active",
  "superseded",
  "completed",
  "archived",
]);
export const planVersionSourceEnum = pgEnum("plan_version_source", [
  "initial_generation",
  "ai_adjustment",
  "system_adjustment",
  "manual_admin",
]);
export const taskTypeEnum = pgEnum("task_type", ["learn", "practice", "review", "build"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "complete", "skipped"]);
export const taskCompletionStatusEnum = pgEnum("task_completion_status", [
  "complete",
  "skipped",
]);
export const aiAdjustmentStatusEnum = pgEnum("ai_adjustment_status", [
  "pending",
  "processing",
  "applied",
  "rejected",
  "failed",
]);
export const aiAdjustmentReasonEnum = pgEnum("ai_adjustment_reason", [
  "task_completion",
  "missed_tasks",
  "new_requirements",
  "schedule_change",
  "scope_change",
]);
export const integrationProviderEnum = pgEnum("integration_provider", [
  "google_calendar",
  "outlook_calendar",
  "google_tasks",
  "notion",
  "slack",
  "other",
]);
export const integrationStatusEnum = pgEnum("integration_status", [
  "connected",
  "disconnected",
  "error",
  "revoked",
]);
export const externalSyncDirectionEnum = pgEnum("external_sync_direction", [
  "inbound",
  "outbound",
]);
export const externalSyncStatusEnum = pgEnum("external_sync_status", [
  "pending",
  "success",
  "failed",
  "skipped",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email"),
    displayName: text("display_name"),
    timezone: text("timezone").notNull().default("UTC"),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tier: subscriptionTierEnum("tier").notNull().default("basic"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    provider: text("provider"),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_provider_subscription_id_idx").on(table.providerSubscriptionId),
  ],
);

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    rawGoal: text("raw_goal").notNull(),
    motivation: text("motivation").notNull(),
    currentLevel: text("current_level").notNull(),
    deadline: text("deadline").notNull(),
    availableTimePerDayMinutes: integer("available_time_per_day_minutes").notNull(),
    timeType: text("time_type", { enum: ["fragmented", "focused", "mixed"] }).notNull(),
    constraints: text("constraints").notNull().default(""),
    preferredStyle: text("preferred_style"),
    status: goalStatusEnum("status").notNull().default("active"),
    intake: jsonb("intake").$type<GoalIntake>().notNull(),
    clarificationAnswers: jsonb("clarification_answers")
      .$type<ClarificationAnswer[]>()
      .notNull()
      .default([]),
    ...timestamps,
  },
  (table) => [
    index("goals_user_id_idx").on(table.userId),
    index("goals_status_idx").on(table.status),
  ],
);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    currentVersionId: uuid("current_version_id"),
    status: planStatusEnum("status").notNull().default("active"),
    isFixed: boolean("is_fixed").notNull().default(true),
    generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (table) => [
    index("plans_user_id_idx").on(table.userId),
    index("plans_goal_id_idx").on(table.goalId),
  ],
);

export const planVersions = pgTable(
  "plan_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    source: planVersionSourceEnum("source").notNull().default("initial_generation"),
    changeSummary: text("change_summary"),
    planSnapshot: jsonb("plan_snapshot").$type<GeneratedPlan>().notNull(),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("plan_versions_plan_id_version_number_unique").on(
      table.planId,
      table.versionNumber,
    ),
    index("plan_versions_plan_id_idx").on(table.planId),
  ],
);

export const dailyTasks = pgTable(
  "daily_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    planVersionId: uuid("plan_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "cascade" }),
    sourceTaskId: text("source_task_id").notNull(),
    day: integer("day").notNull(),
    taskType: taskTypeEnum("task_type").notNull(),
    title: text("title").notNull(),
    output: text("output").notNull(),
    estimatedTime: text("estimated_time").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    status: taskStatusEnum("status").notNull().default("pending"),
    locked: boolean("locked").notNull().default(true),
    position: integer("position").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("daily_tasks_plan_id_idx").on(table.planId),
    index("daily_tasks_plan_version_id_idx").on(table.planVersionId),
    index("daily_tasks_plan_id_day_idx").on(table.planId, table.day),
    uniqueIndex("daily_tasks_plan_version_source_task_unique").on(
      table.planVersionId,
      table.sourceTaskId,
    ),
  ],
);

export const taskCompletions = pgTable(
  "task_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => dailyTasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: taskCompletionStatusEnum("status").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  },
  (table) => [
    index("task_completions_task_id_idx").on(table.taskId),
    index("task_completions_user_id_idx").on(table.userId),
    uniqueIndex("task_completions_task_user_unique").on(table.taskId, table.userId),
  ],
);

export const aiAdjustmentRequests = pgTable(
  "ai_adjustment_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    fromPlanVersionId: uuid("from_plan_version_id")
      .notNull()
      .references(() => planVersions.id, { onDelete: "cascade" }),
    resultingPlanVersionId: uuid("resulting_plan_version_id").references(
      () => planVersions.id,
      { onDelete: "set null" },
    ),
    reason: aiAdjustmentReasonEnum("reason").notNull(),
    status: aiAdjustmentStatusEnum("status").notNull().default("pending"),
    userRequest: text("user_request"),
    completionSummary: jsonb("completion_summary")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    model: text("model"),
    prompt: text("prompt"),
    response: jsonb("response").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("ai_adjustment_requests_user_id_idx").on(table.userId),
    index("ai_adjustment_requests_plan_id_idx").on(table.planId),
    index("ai_adjustment_requests_status_idx").on(table.status),
  ],
);

export const appIntegrations = pgTable(
  "app_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: integrationProviderEnum("provider").notNull(),
    status: integrationStatusEnum("status").notNull().default("connected"),
    externalAccountId: text("external_account_id"),
    accessTokenRef: text("access_token_ref"),
    refreshTokenRef: text("refresh_token_ref"),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("app_integrations_user_provider_idx").on(table.userId, table.provider),
  ],
);

export const externalSyncLogs = pgTable(
  "external_sync_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationId: uuid("integration_id")
      .notNull()
      .references(() => appIntegrations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id, { onDelete: "set null" }),
    planId: uuid("plan_id").references(() => plans.id, { onDelete: "set null" }),
    taskId: uuid("task_id").references(() => dailyTasks.id, { onDelete: "set null" }),
    direction: externalSyncDirectionEnum("direction").notNull(),
    status: externalSyncStatusEnum("status").notNull(),
    externalId: text("external_id"),
    requestPayload: jsonb("request_payload").$type<Record<string, unknown>>(),
    responsePayload: jsonb("response_payload").$type<Record<string, unknown>>(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("external_sync_logs_integration_id_idx").on(table.integrationId),
    index("external_sync_logs_user_id_idx").on(table.userId),
    index("external_sync_logs_status_idx").on(table.status),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  goals: many(goals),
  plans: many(plans),
  taskCompletions: many(taskCompletions),
  aiAdjustmentRequests: many(aiAdjustmentRequests),
  appIntegrations: many(appIntegrations),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, { fields: [subscriptions.userId], references: [users.id] }),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  plans: many(plans),
  aiAdjustmentRequests: many(aiAdjustmentRequests),
}));

export const plansRelations = relations(plans, ({ one, many }) => ({
  user: one(users, { fields: [plans.userId], references: [users.id] }),
  goal: one(goals, { fields: [plans.goalId], references: [goals.id] }),
  versions: many(planVersions),
  dailyTasks: many(dailyTasks),
  aiAdjustmentRequests: many(aiAdjustmentRequests),
}));

export const planVersionsRelations = relations(planVersions, ({ one, many }) => ({
  plan: one(plans, { fields: [planVersions.planId], references: [plans.id] }),
  createdBy: one(users, {
    fields: [planVersions.createdByUserId],
    references: [users.id],
  }),
  dailyTasks: many(dailyTasks),
}));

export const dailyTasksRelations = relations(dailyTasks, ({ one, many }) => ({
  plan: one(plans, { fields: [dailyTasks.planId], references: [plans.id] }),
  planVersion: one(planVersions, {
    fields: [dailyTasks.planVersionId],
    references: [planVersions.id],
  }),
  completions: many(taskCompletions),
}));

export const taskCompletionsRelations = relations(taskCompletions, ({ one }) => ({
  task: one(dailyTasks, {
    fields: [taskCompletions.taskId],
    references: [dailyTasks.id],
  }),
  user: one(users, { fields: [taskCompletions.userId], references: [users.id] }),
}));

export const aiAdjustmentRequestsRelations = relations(aiAdjustmentRequests, ({ one }) => ({
  user: one(users, { fields: [aiAdjustmentRequests.userId], references: [users.id] }),
  goal: one(goals, { fields: [aiAdjustmentRequests.goalId], references: [goals.id] }),
  plan: one(plans, { fields: [aiAdjustmentRequests.planId], references: [plans.id] }),
  fromPlanVersion: one(planVersions, {
    fields: [aiAdjustmentRequests.fromPlanVersionId],
    references: [planVersions.id],
  }),
  resultingPlanVersion: one(planVersions, {
    fields: [aiAdjustmentRequests.resultingPlanVersionId],
    references: [planVersions.id],
  }),
}));

export const appIntegrationsRelations = relations(appIntegrations, ({ one, many }) => ({
  user: one(users, { fields: [appIntegrations.userId], references: [users.id] }),
  syncLogs: many(externalSyncLogs),
}));

export const externalSyncLogsRelations = relations(externalSyncLogs, ({ one }) => ({
  integration: one(appIntegrations, {
    fields: [externalSyncLogs.integrationId],
    references: [appIntegrations.id],
  }),
  user: one(users, { fields: [externalSyncLogs.userId], references: [users.id] }),
  goal: one(goals, { fields: [externalSyncLogs.goalId], references: [goals.id] }),
  plan: one(plans, { fields: [externalSyncLogs.planId], references: [plans.id] }),
  task: one(dailyTasks, { fields: [externalSyncLogs.taskId], references: [dailyTasks.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type PlanVersion = typeof planVersions.$inferSelect;
export type DailyTaskRow = typeof dailyTasks.$inferSelect;
export type AiAdjustmentRequest = typeof aiAdjustmentRequests.$inferSelect;
