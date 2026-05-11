"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Leaf,
  ListChecks,
  Sparkles,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePlannerStore } from "@/hooks/use-planner-store";

export function PlanResult() {
  const { completionStats, plan, progressFeedback } = usePlannerStore();
  const firstPendingTask = plan.dailyTasks.find((task) => task.status === "pending");
  const todayDay = firstPendingTask?.day ?? plan.dailyTasks[0]?.day ?? 1;
  const todaysTasks = plan.dailyTasks
    .filter((task) => task.day === todayDay)
    .slice(0, 3);
  const currentWeekNumber = Math.max(1, Math.ceil(todayDay / 7));
  const currentWeek =
    plan.weeklyPlan.find((week) => week.week === currentWeekNumber) ?? plan.weeklyPlan[0];
  const currentPhase = plan.phases[0];
  const primaryOutcomes = [
    currentWeek?.measurableOutcome,
    currentWeek?.checkpoint,
    ...plan.weeklyPlan.flatMap((week) => week.goals).slice(0, 2),
  ].filter(Boolean);
  const guidingAssumptions = plan.assumptions.slice(0, 3);
  const gentleRisk = plan.risks[0];

  return (
    <div className="mx-auto grid max-w-5xl gap-8">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <Card className="border-primary/15 bg-card shadow-none">
          <CardHeader className="space-y-5 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted">{plan.totalDuration || "Plan in progress"}</Badge>
              <Badge variant="outline">{completionStats.completionRate}% complete</Badge>
            </div>
            <div className="grid gap-3">
              <CardTitle className="max-w-3xl text-3xl font-semibold leading-tight tracking-normal sm:text-4xl">
                {plan.goalSummary || "Your plan will appear here after generation."}
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7">
                This plan is intentionally paced around what you can do next, not everything you
                could do someday.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 pb-6 sm:px-8 sm:pb-8">
            {guidingAssumptions.length > 0 ? (
              <div className="grid gap-3">
                <p className="text-sm font-medium text-muted-foreground">What the coach is assuming</p>
                <div className="grid gap-2">
                  {guidingAssumptions.map((assumption) => (
                    <div key={assumption} className="flex gap-3 text-sm leading-6">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                      <span>{assumption}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="bg-muted/40 shadow-none">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Leaf className="h-5 w-5 text-primary" />
              Progress Momentum
            </CardTitle>
            <CardDescription>{progressFeedback.message}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 px-6 pb-6">
            <Progress value={completionStats.completionRate} />
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md border bg-card p-3">
                <p className="text-xl font-semibold">{completionStats.complete}</p>
                <p className="text-muted-foreground">Done</p>
              </div>
              <div className="rounded-md border bg-card p-3">
                <p className="text-xl font-semibold">{completionStats.skipped}</p>
                <p className="text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-md border bg-card p-3">
                <p className="text-xl font-semibold">{completionStats.completionRate}%</p>
                <p className="text-muted-foreground">Rate</p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/tracker">
                Track today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card className="shadow-none">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Compass className="h-5 w-5 text-primary" />
              Current Week Focus
            </CardTitle>
            <CardDescription>
              Week {currentWeek?.week ?? currentWeekNumber}: {currentWeek?.focus ?? "Keep the next step clear"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 px-6 pb-6">
            <p className="text-lg leading-8">
              {currentPhase?.objective ?? currentWeek?.measurableOutcome ?? "Build steady progress with a small, realistic set of actions."}
            </p>
            {currentWeek?.checkpoint ? (
              <div className="rounded-md border bg-muted/40 p-4">
                <p className="text-sm font-medium">Checkpoint</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {currentWeek.checkpoint}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-none">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-5 w-5 text-primary" />
              Today&apos;s Focus
            </CardTitle>
            <CardDescription>Day {todayDay}: keep it specific and finishable.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 pb-6">
            {todaysTasks.length > 0 ? (
              todaysTasks.map((task) => (
                <div key={task.id} className="rounded-md border bg-card p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{task.taskType}</Badge>
                    <span className="text-sm text-muted-foreground">{task.estimatedTime}</span>
                  </div>
                  <p className="mt-3 text-base font-medium leading-6">{task.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Output: {task.output}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                No daily tasks are available yet. Generate a plan to see today&apos;s focus.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
        <Card className="shadow-none">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-primary" />
              Expected Outcomes
            </CardTitle>
            <CardDescription>Small signs that the plan is working.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 px-6 pb-6">
            {primaryOutcomes.length > 0 ? (
              primaryOutcomes.slice(0, 4).map((outcome) => (
                <div key={outcome} className="flex gap-3 rounded-md border bg-muted/30 p-4">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-6">{outcome}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                Outcomes will become clearer once the plan has weekly checkpoints.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-accent/40 shadow-none">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListChecks className="h-5 w-5 text-primary" />
              Adaptive Support
            </CardTitle>
            <CardDescription>
              The plan can soften or stretch upcoming work based on completion.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 pb-6 text-sm leading-6 text-muted-foreground">
            <p>{plan.adjustmentRules[0] ?? "Keep the workload realistic and responsive."}</p>
            {gentleRisk ? <p>{gentleRisk}</p> : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
