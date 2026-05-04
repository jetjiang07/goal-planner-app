"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Layers3, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlannerStore } from "@/hooks/use-planner-store";

export function PlanResult() {
  const { plan } = usePlannerStore();

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{plan.totalDuration}</Badge>
              <Badge variant="secondary">{plan.dailyTasks.length} starter tasks</Badge>
            </div>
            <CardTitle className="text-2xl leading-8">{plan.goalSummary}</CardTitle>
            <CardDescription>
              Structured output is shaped to match the PRD plan schema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Assumptions
            </h2>
            <ul className="mt-3 grid gap-2 text-sm leading-6">
              {plan.assumptions.map((assumption) => (
                <li key={assumption} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Adjustment Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
            {plan.adjustmentRules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
            <Button asChild className="mt-2">
              <Link href="/tracker">
                Track today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {plan.phases.map((phase) => (
          <Card key={phase.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers3 className="h-4 w-4 text-primary" />
                {phase.name}
              </CardTitle>
              <CardDescription>{phase.duration}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {phase.objective}
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Plan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {plan.weeklyPlan.map((week) => (
              <div key={week.week} className="rounded-md border p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Week {week.week}</h3>
                  <Badge variant="muted">{week.focus}</Badge>
                </div>
                <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
                  {week.goals.map((goal) => (
                    <li key={goal}>- {goal}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resources and Risks</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm leading-6">
            <div>
              <h3 className="font-semibold">Resources needed</h3>
              <ul className="mt-2 grid gap-1 text-muted-foreground">
                {plan.resourcesNeeded.map((resource) => (
                  <li key={resource}>- {resource}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Risks</h3>
              <ul className="mt-2 grid gap-1 text-muted-foreground">
                {plan.risks.map((risk) => (
                  <li key={risk}>- {risk}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
