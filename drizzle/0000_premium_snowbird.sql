CREATE TYPE "public"."ai_adjustment_reason" AS ENUM('task_completion', 'missed_tasks', 'new_requirements', 'schedule_change', 'scope_change');--> statement-breakpoint
CREATE TYPE "public"."ai_adjustment_status" AS ENUM('pending', 'processing', 'applied', 'rejected', 'failed');--> statement-breakpoint
CREATE TYPE "public"."external_sync_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."external_sync_status" AS ENUM('pending', 'success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('draft', 'active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('google_calendar', 'outlook_calendar', 'google_tasks', 'notion', 'slack', 'other');--> statement-breakpoint
CREATE TYPE "public"."integration_status" AS ENUM('connected', 'disconnected', 'error', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('draft', 'active', 'superseded', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."plan_version_source" AS ENUM('initial_generation', 'ai_adjustment', 'system_adjustment', 'manual_admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('basic', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."task_completion_status" AS ENUM('complete', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'complete', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('learn', 'practice', 'review', 'build');--> statement-breakpoint
CREATE TABLE "ai_adjustment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"from_plan_version_id" uuid NOT NULL,
	"resulting_plan_version_id" uuid,
	"reason" "ai_adjustment_reason" NOT NULL,
	"status" "ai_adjustment_status" DEFAULT 'pending' NOT NULL,
	"user_request" text,
	"completion_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"model" text,
	"prompt" text,
	"response" jsonb,
	"error_message" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "app_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"status" "integration_status" DEFAULT 'connected' NOT NULL,
	"external_account_id" text,
	"access_token_ref" text,
	"refresh_token_ref" text,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_version_id" uuid NOT NULL,
	"source_task_id" text NOT NULL,
	"day" integer NOT NULL,
	"task_type" "task_type" NOT NULL,
	"title" text NOT NULL,
	"output" text NOT NULL,
	"estimated_time" text NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"locked" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"integration_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"plan_id" uuid,
	"task_id" uuid,
	"direction" "external_sync_direction" NOT NULL,
	"status" "external_sync_status" NOT NULL,
	"external_id" text,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"raw_goal" text NOT NULL,
	"motivation" text NOT NULL,
	"current_level" text NOT NULL,
	"deadline" text NOT NULL,
	"available_time_per_day_minutes" integer NOT NULL,
	"time_type" text NOT NULL,
	"constraints" text DEFAULT '' NOT NULL,
	"preferred_style" text,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"intake" jsonb NOT NULL,
	"clarification_answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"source" "plan_version_source" DEFAULT 'initial_generation' NOT NULL,
	"change_summary" text,
	"plan_snapshot" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"current_version_id" uuid,
	"status" "plan_status" DEFAULT 'active' NOT NULL,
	"is_fixed" boolean DEFAULT true NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" "subscription_tier" DEFAULT 'basic' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"provider" text,
	"provider_customer_id" text,
	"provider_subscription_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "task_completion_status" NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"display_name" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_adjustment_requests" ADD CONSTRAINT "ai_adjustment_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_adjustment_requests" ADD CONSTRAINT "ai_adjustment_requests_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_adjustment_requests" ADD CONSTRAINT "ai_adjustment_requests_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_adjustment_requests" ADD CONSTRAINT "ai_adjustment_requests_from_plan_version_id_plan_versions_id_fk" FOREIGN KEY ("from_plan_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_adjustment_requests" ADD CONSTRAINT "ai_adjustment_requests_resulting_plan_version_id_plan_versions_id_fk" FOREIGN KEY ("resulting_plan_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_integrations" ADD CONSTRAINT "app_integrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_plan_version_id_plan_versions_id_fk" FOREIGN KEY ("plan_version_id") REFERENCES "public"."plan_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_logs" ADD CONSTRAINT "external_sync_logs_integration_id_app_integrations_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."app_integrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_logs" ADD CONSTRAINT "external_sync_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_logs" ADD CONSTRAINT "external_sync_logs_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_logs" ADD CONSTRAINT "external_sync_logs_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_sync_logs" ADD CONSTRAINT "external_sync_logs_task_id_daily_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."daily_tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_versions" ADD CONSTRAINT "plan_versions_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_task_id_daily_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."daily_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_completions" ADD CONSTRAINT "task_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_adjustment_requests_user_id_idx" ON "ai_adjustment_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_adjustment_requests_plan_id_idx" ON "ai_adjustment_requests" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "ai_adjustment_requests_status_idx" ON "ai_adjustment_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "app_integrations_user_provider_idx" ON "app_integrations" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "daily_tasks_plan_id_idx" ON "daily_tasks" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "daily_tasks_plan_version_id_idx" ON "daily_tasks" USING btree ("plan_version_id");--> statement-breakpoint
CREATE INDEX "daily_tasks_plan_id_day_idx" ON "daily_tasks" USING btree ("plan_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_tasks_plan_version_source_task_unique" ON "daily_tasks" USING btree ("plan_version_id","source_task_id");--> statement-breakpoint
CREATE INDEX "external_sync_logs_integration_id_idx" ON "external_sync_logs" USING btree ("integration_id");--> statement-breakpoint
CREATE INDEX "external_sync_logs_user_id_idx" ON "external_sync_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "external_sync_logs_status_idx" ON "external_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "goals_user_id_idx" ON "goals" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "goals_status_idx" ON "goals" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_versions_plan_id_version_number_unique" ON "plan_versions" USING btree ("plan_id","version_number");--> statement-breakpoint
CREATE INDEX "plan_versions_plan_id_idx" ON "plan_versions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "plans_user_id_idx" ON "plans" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plans_goal_id_idx" ON "plans" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_provider_subscription_id_idx" ON "subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
CREATE INDEX "task_completions_task_id_idx" ON "task_completions" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_completions_user_id_idx" ON "task_completions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");