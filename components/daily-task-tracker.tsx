"use client";

import { Check, RotateCcw, SkipForward } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePlannerStore } from "@/hooks/use-planner-store";
import { cn } from "@/lib/utils";

export function DailyTaskTracker() {
  const { completionStats, plan, progressFeedback, updateTaskStatus } = usePlannerStore();

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{"Today's Progress"}</CardTitle>
            <CardDescription>
              {completionStats.complete} of {completionStats.total} tasks complete
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Progress value={completionStats.completionRate} />
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-md border p-3">
                <p className="text-xl font-semibold">{completionStats.complete}</p>
                <p className="text-muted-foreground">Done</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xl font-semibold">{completionStats.skipped}</p>
                <p className="text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xl font-semibold">{completionStats.completionRate}%</p>
                <p className="text-muted-foreground">Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rule-Based Adjustment</CardTitle>
            <CardDescription>
              <span className="capitalize">{progressFeedback.mode}</span>
              {completionStats.attempted > 0
                ? ` - ${completionStats.attemptedCompletionRate}% of attempted tasks completed`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {progressFeedback.message}
          </CardContent>
        </Card>
      </aside>
      <section className="grid task-grid gap-4">
        {plan.dailyTasks.map((task) => (
          <Card
            key={task.id}
            className={cn(
              "transition-colors",
              task.status === "complete" && "border-primary/50 bg-primary/5",
              task.status === "skipped" && "border-destructive/30 bg-destructive/5",
            )}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Day {task.day}</CardTitle>
                  <CardDescription>{task.estimatedTime}</CardDescription>
                </div>
                <Badge
                  variant={
                    task.status === "complete"
                      ? "default"
                      : task.status === "skipped"
                        ? "secondary"
                        : "muted"
                  }
                >
                  {task.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="min-h-16 text-sm leading-6">{task.title}</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  aria-label="Mark complete"
                  size="icon"
                  variant={task.status === "complete" ? "default" : "outline"}
                  onClick={() => updateTaskStatus(task.id, "complete")}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  aria-label="Skip task"
                  size="icon"
                  variant={task.status === "skipped" ? "secondary" : "outline"}
                  onClick={() => updateTaskStatus(task.id, "skipped")}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button
                  aria-label="Reset task"
                  size="icon"
                  variant="outline"
                  onClick={() => updateTaskStatus(task.id, "pending")}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
