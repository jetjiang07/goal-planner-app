"use client";

import {
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
  SkipForward,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { usePlannerStore } from "@/hooks/use-planner-store";
import type { DailyTask } from "@/lib/types";
import { cn } from "@/lib/utils";

type DayGroup = {
  day: number;
  tasks: DailyTask[];
};

function formatTaskType(taskType: DailyTask["taskType"]) {
  const labels: Record<DailyTask["taskType"], string> = {
    learn: "Learn",
    practice: "Practice",
    review: "Review",
    build: "Build",
  };

  return labels[taskType];
}

function getDefaultDay(groups: DayGroup[]) {
  return groups[0]?.day ?? null;
}

function getDayGroups(tasks: DailyTask[]) {
  const groups = new Map<number, DailyTask[]>();

  tasks.forEach((task) => {
    groups.set(task.day, [...(groups.get(task.day) ?? []), task]);
  });

  return Array.from(groups.entries())
    .map(([day, dayTasks]) => ({
      day,
      tasks: dayTasks,
    }))
    .sort((a, b) => a.day - b.day);
}

function getDayStats(tasks: DailyTask[]) {
  const completed = tasks.filter((task) => task.status === "complete").length;
  const skipped = tasks.filter((task) => task.status === "skipped").length;
  const totalMinutes = tasks.reduce((total, task) => total + task.estimatedMinutes, 0);
  const progressValue = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return {
    completed,
    skipped,
    total: tasks.length,
    totalMinutes,
    progressValue,
    allDone: tasks.length > 0 && completed === tasks.length,
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function getLocalCalendarDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getCurrentPlanDay(
  planStartDate: string | null,
  planCreatedAt: string | null,
  totalPlanDays: number,
) {
  const anchorValue = planStartDate ?? planCreatedAt;

  if (!anchorValue || totalPlanDays <= 0) {
    return totalPlanDays > 0 ? 1 : null;
  }

  const anchorDate = new Date(anchorValue);

  if (Number.isNaN(anchorDate.getTime())) {
    return totalPlanDays > 0 ? 1 : null;
  }

  const today = getLocalCalendarDay(new Date());
  const startDay = getLocalCalendarDay(anchorDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const calendarDayDifference = Math.round(
    (today.getTime() - startDay.getTime()) / millisecondsPerDay,
  );

  return clamp(calendarDayDifference + 1, 1, totalPlanDays);
}

function getDayTone(day: number, currentPlanDay: number | null) {
  if (!currentPlanDay || day === currentPlanDay) {
    return "Today";
  }

  return day < currentPlanDay ? "Earlier" : "Coming up";
}

function getGentleCopy(day: number, currentPlanDay: number | null, allDone: boolean) {
  if (allDone) {
    return "That is enough for this day. Let the progress settle.";
  }

  if (!currentPlanDay || day === currentPlanDay) {
    return "Small progress still counts. Start with the next gentle step.";
  }

  if (day < currentPlanDay) {
    return "A quiet look back can show what already moved forward.";
  }

  return "Coming up soon. You can leave this for later or start early if it feels easy.";
}

export function DailyTaskTracker() {
  const {
    plan,
    planCreatedAt,
    planId,
    planStartDate,
    taskUpdateError,
    updateTaskStatus,
  } = usePlannerStore();
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const hasInitializedCarouselRef = useRef(false);
  const lastInitializedPlanKeyRef = useRef<string | null>(null);
  const lastInitializedCurrentDayRef = useRef<number | null>(null);
  const userHasNavigatedRef = useRef(false);
  const dragState = useRef({
    isDragging: false,
    startX: 0,
    startScrollLeft: 0,
  });
  const dayGroups = useMemo(() => getDayGroups(plan.dailyTasks), [plan.dailyTasks]);
  const planTaskKey = useMemo(
    () => plan.dailyTasks.map((task) => task.id).join(":"),
    [plan.dailyTasks],
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const currentPlanDay = useMemo(
    () => getCurrentPlanDay(planStartDate, planCreatedAt, dayGroups.length),
    [dayGroups.length, planCreatedAt, planStartDate],
  );

  const centerDay = useCallback((day: number, behavior: ScrollBehavior = "smooth") => {
    const targetCard = document.getElementById(`tracker-day-${day}`);

    setSelectedDay(day);

    targetCard?.scrollIntoView({
      behavior,
      block: "nearest",
      inline: "center",
    });
  }, []);

  useEffect(() => {
    if (dayGroups.length === 0) {
      setSelectedDay(null);
      hasInitializedCarouselRef.current = false;
      lastInitializedPlanKeyRef.current = null;
      lastInitializedCurrentDayRef.current = null;
      userHasNavigatedRef.current = false;
      return;
    }

    const planKey = planId ?? planTaskKey;
    const planChanged = lastInitializedPlanKeyRef.current !== planKey;

    if (planChanged) {
      hasInitializedCarouselRef.current = false;
      lastInitializedPlanKeyRef.current = planKey;
      lastInitializedCurrentDayRef.current = null;
      userHasNavigatedRef.current = false;
    }

    if (!currentPlanDay) {
      return;
    }

    const currentDayChanged =
      lastInitializedCurrentDayRef.current !== null &&
      lastInitializedCurrentDayRef.current !== currentPlanDay;

    if (
      hasInitializedCarouselRef.current &&
      (userHasNavigatedRef.current || !currentDayChanged)
    ) {
      return;
    }

    lastInitializedCurrentDayRef.current = currentPlanDay;
    hasInitializedCarouselRef.current = true;
    centerDay(currentPlanDay ?? getDefaultDay(dayGroups) ?? 1, "auto");
  }, [centerDay, currentPlanDay, dayGroups, planId, planTaskKey]);

  const selectedIndex = dayGroups.findIndex((group) => group.day === selectedDay);
  const centeredGroup = selectedIndex >= 0 ? dayGroups[selectedIndex] : dayGroups[0];
  const centeredStats = centeredGroup ? getDayStats(centeredGroup.tasks) : null;

  const scrollToIndex = (index: number) => {
    const nextGroup = dayGroups[index];

    if (!nextGroup) {
      return;
    }

    userHasNavigatedRef.current = true;
    centerDay(nextGroup.day);
  };

  const returnToToday = () => {
    if (!currentPlanDay) {
      return;
    }

    userHasNavigatedRef.current = true;
    centerDay(currentPlanDay);
  };

  const updateCenteredDayFromScroll = () => {
    const carousel = carouselRef.current;

    if (!carousel || dayGroups.length === 0) {
      return;
    }

    const carouselCenter = carousel.scrollLeft + carousel.clientWidth / 2;
    let closestDay = dayGroups[0].day;
    let closestDistance = Number.POSITIVE_INFINITY;

    dayGroups.forEach((group) => {
      const card = document.getElementById(`tracker-day-${group.day}`);

      if (!card) {
        return;
      }

      const cardCenter = card.offsetLeft + card.clientWidth / 2;
      const distance = Math.abs(cardCenter - carouselCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestDay = group.day;
      }
    });

    setSelectedDay(closestDay);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    dragState.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: carousel.scrollLeft,
    };
    userHasNavigatedRef.current = true;
    carousel.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;

    if (!carousel || !dragState.current.isDragging) {
      return;
    }

    const distance = event.clientX - dragState.current.startX;
    carousel.scrollLeft = dragState.current.startScrollLeft - distance;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const carousel = carouselRef.current;

    if (!carousel) {
      return;
    }

    dragState.current.isDragging = false;
    carousel.releasePointerCapture(event.pointerId);
    updateCenteredDayFromScroll();
  };

  if (dayGroups.length === 0) {
    return (
      <Card variant="elevated">
        <CardContent className="grid gap-4 p-6 sm:p-8">
          <p className="font-display text-3xl leading-tight">Nothing planned for today.</p>
          <p className="max-w-xl text-base leading-7 text-soft">
            A quiet day can still be part of progress. Rest, reflection, or simply
            returning tomorrow can belong in the plan too.
          </p>
          <Button asChild className="w-fit" variant="outline">
            <a href="/plan">Return to plan</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <Card className="overflow-hidden" variant="elevated">
        <CardContent className="grid gap-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-subtle">
                {getDayTone(centeredGroup.day, currentPlanDay)}
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                Day {centeredGroup.day}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-soft">
                {centeredStats
                  ? getGentleCopy(centeredGroup.day, currentPlanDay, centeredStats.allDone)
                  : "Small progress still counts."}
              </p>
            </div>
            {centeredStats ? (
              <div className="rounded-lg border border-border/45 bg-card/70 p-4 sm:min-w-64">
                <div className="flex items-center gap-2 text-sm font-medium text-soft">
                  <Clock3 className="h-4 w-4" />
                  Centered day
                </div>
                <p className="mt-3 text-sm text-soft">
                  {centeredStats.completed} of {centeredStats.total} small steps done
                </p>
                <Progress className="mt-3" value={centeredStats.progressValue} />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-border/45 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={selectedIndex <= 0}
              onClick={() => scrollToIndex(selectedIndex - 1)}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Earlier
            </Button>
            <p className="hidden text-sm text-subtle sm:block">
              Drag, swipe, or use the buttons to browse your days.
            </p>
            {currentPlanDay && selectedDay !== currentPlanDay ? (
              <Button type="button" variant="ghost" onClick={returnToToday}>
                Return to today
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              disabled={selectedIndex < 0 || selectedIndex >= dayGroups.length - 1}
              onClick={() => scrollToIndex(selectedIndex + 1)}
            >
              Coming up
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div
        ref={carouselRef}
        className="flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[calc((100%-min(92vw,560px))/2)] py-4 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={() => {
          userHasNavigatedRef.current = true;
        }}
        onScroll={() => {
          window.clearTimeout(Number(carouselRef.current?.dataset.scrollTimeout));
          const timeout = window.setTimeout(updateCenteredDayFromScroll, 120);
          if (carouselRef.current) {
            carouselRef.current.dataset.scrollTimeout = String(timeout);
          }
        }}
      >
        {dayGroups.map((group) => {
          const isCentered = group.day === selectedDay;
          const stats = getDayStats(group.tasks);
          const focusTask =
            group.tasks.find((task) => task.status === "pending") ??
            group.tasks.find((task) => task.status !== "complete") ??
            group.tasks[0];

          return (
            <Card
              id={`tracker-day-${group.day}`}
              key={group.day}
              onClick={() => {
                userHasNavigatedRef.current = true;
                centerDay(group.day);
              }}
              className={cn(
                "min-h-[620px] w-[min(92vw,560px)] shrink-0 snap-center overflow-hidden transition-all duration-300",
                isCentered
                  ? "scale-100 opacity-100 shadow-calm"
                  : "scale-[0.94] opacity-70 shadow-none",
              )}
              variant="elevated"
            >
              <CardHeader className="border-b border-border/40 bg-card/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant={group.day === currentPlanDay ? "default" : "outline"}>
                      {getDayTone(group.day, currentPlanDay)}
                    </Badge>
                    <CardTitle className="mt-4 font-display text-3xl leading-tight">
                      Day {group.day}
                    </CardTitle>
                    <p className="mt-3 text-sm leading-6 text-soft">
                      {focusTask?.title ?? "A gentle step for this day."}
                    </p>
                  </div>
                  <div className="rounded-lg bg-surface-tint px-3 py-2 text-right">
                    <p className="text-lg font-semibold">{stats.totalMinutes}</p>
                    <p className="text-xs text-subtle">min</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="grid gap-5 p-5 sm:p-6">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <p className="font-medium text-foreground">
                      {stats.completed} of {stats.total} small steps done
                    </p>
                    <p className="text-subtle">Small progress still counts</p>
                  </div>
                  <Progress value={stats.progressValue} />
                  <p className="text-sm leading-6 text-soft">
                    {getGentleCopy(group.day, currentPlanDay, stats.allDone)}
                  </p>
                </div>

                <div className="grid gap-3">
                  {group.tasks.map((task) => {
                    const isComplete = task.status === "complete";
                    const isSkipped = task.status === "skipped";

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "grid gap-4 rounded-lg border border-border/45 bg-card/75 p-4 transition-colors",
                          isComplete && "border-primary/60 bg-surface-tint/75",
                          isSkipped && "bg-surface-soft/75",
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={isComplete ? "default" : "outline"}>
                                {formatTaskType(task.taskType)}
                              </Badge>
                              <span className="text-sm text-subtle">{task.estimatedTime}</span>
                            </div>
                            <p className="mt-3 text-base font-medium leading-6 text-foreground">
                              {task.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-soft">{task.output}</p>
                          </div>
                          <Badge variant={isComplete ? "default" : "muted"}>
                            {isComplete
                              ? "Done"
                              : isSkipped
                                ? "Set aside"
                                : "Ready"}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                          <Button
                            type="button"
                            className="w-full sm:w-fit"
                            variant={isComplete ? "outline" : "default"}
                            onClick={() =>
                              updateTaskStatus(task.id, isComplete ? "pending" : "complete")
                            }
                          >
                            {isComplete ? (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reopen gently
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Mark done
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            className="w-full sm:w-fit"
                            variant="ghost"
                            onClick={() =>
                              updateTaskStatus(task.id, isSkipped ? "pending" : "skipped")
                            }
                          >
                            {isSkipped ? (
                              <>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Bring back
                              </>
                            ) : (
                              <>
                                <SkipForward className="mr-2 h-4 w-4" />
                                Set aside
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {taskUpdateError ? (
        <div
          className="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{taskUpdateError}</p>
        </div>
      ) : null}
    </div>
  );
}
