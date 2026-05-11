"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BatteryMedium,
  Coffee,
  Heart,
  Moon,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerStore } from "@/hooks/use-planner-store";
import { cn } from "@/lib/utils";
import type { GoalIntake, TimeType } from "@/lib/types";

type StepId =
  | "goal"
  | "motivation"
  | "level"
  | "capacity"
  | "time"
  | "obstacles"
  | "support";

type ConversationStep = {
  id: StepId;
  eyebrow: string;
  title: string;
  helper: string;
};

const steps: ConversationStep[] = [
  {
    id: "goal",
    eyebrow: "Start gently",
    title: "What would you like to make progress on lately?",
    helper: "A skill, wellness habit, personal project, study goal, or anything you keep meaning to return to.",
  },
  {
    id: "motivation",
    eyebrow: "Why now",
    title: "Why does this matter to you at this point in your life?",
    helper: "This helps the plan stay connected to something real, not just another task list.",
  },
  {
    id: "level",
    eyebrow: "Current place",
    title: "Where are you starting from?",
    helper: "Beginner, rusty, intermediate, already consistent, returning after a break - plain language is perfect.",
  },
  {
    id: "capacity",
    eyebrow: "After-work reality",
    title: "How much time and energy do you realistically have?",
    helper: "Choose a daily amount that would still feel possible on an ordinary tired day.",
  },
  {
    id: "time",
    eyebrow: "Time shape",
    title: "Is your time fragmented, focused, or mixed?",
    helper: "The plan should fit the way your time actually arrives, not assume perfect focus blocks.",
  },
  {
    id: "obstacles",
    eyebrow: "Friction",
    title: "What usually gets in the way?",
    helper: "Name the practical or emotional friction so the plan can stay kind and realistic.",
  },
  {
    id: "support",
    eyebrow: "Support style",
    title: "What kind of support would feel good to receive?",
    helper: "Structured, gentle, direct, tiny steps, hands-on practice, reflective prompts, or something else.",
  },
];

const timeTypes: Array<{
  value: TimeType;
  label: string;
  description: string;
}> = [
  {
    value: "fragmented",
    label: "Fragmented",
    description: "Short pockets, interruptions, or split sessions.",
  },
  {
    value: "focused",
    label: "Focused",
    description: "A clear block where you can settle in.",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "Some focused time, some small pockets.",
  },
];

export function IntakeForm() {
  const router = useRouter();
  const { intake, isReady, setIntake } = usePlannerStore();
  const [form, setForm] = useState<GoalIntake>(intake);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isReady) {
      setForm(intake);
    }
  }, [intake, isReady]);

  const step = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const updateField = <K extends keyof GoalIntake>(field: K, value: GoalIntake[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const canContinue = useMemo(() => {
    switch (step.id) {
      case "goal":
        return form.goal.trim().length > 0;
      case "motivation":
        return form.motivation.trim().length > 0;
      case "level":
        return form.currentLevel.trim().length > 0;
      case "capacity":
        return form.availableTimePerDay > 0 && form.deadline.trim().length > 0;
      case "time":
        return Boolean(form.timeType);
      case "obstacles":
        return form.constraints.trim().length > 0;
      case "support":
        return Boolean(form.preferredStyle?.trim());
      default:
        return false;
    }
  }, [form, step.id]);

  const goNext = () => {
    if (!canContinue) {
      return;
    }

    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLastStep) {
      goNext();
      return;
    }

    if (!canContinue) {
      return;
    }

    setIntake(form);
    router.push("/clarify");
  };

  return (
    <Card className="overflow-hidden" variant="elevated">
      <form onSubmit={onSubmit}>
        <CardContent className="p-0">
          <div className="border-b border-border/45 bg-card px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-tint px-3 py-1.5 text-xs font-medium text-soft">
                <Sparkles className="h-3.5 w-3.5 text-foreground/70" />
                Guided growth plan
              </div>
              <p className="text-sm text-subtle">
                {stepIndex + 1} of {steps.length}
              </p>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid gap-8 p-5 sm:p-7">
            <div>
              <p className="text-sm font-medium text-subtle">{step.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                {step.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-soft">{step.helper}</p>
            </div>

            <div className="min-h-[260px]">
              {step.id === "goal" ? (
                <Textarea
                  autoFocus
                  required
                  value={form.goal}
                  onChange={(event) => updateField("goal", event.target.value)}
                  placeholder="I want to rebuild my coding confidence in small evening sessions."
                  className="min-h-44 text-base"
                />
              ) : null}

              {step.id === "motivation" ? (
                <Textarea
                  autoFocus
                  required
                  value={form.motivation}
                  onChange={(event) => updateField("motivation", event.target.value)}
                  placeholder="It would help me feel more capable at work and less stuck after hours."
                  className="min-h-44 text-base"
                />
              ) : null}

              {step.id === "level" ? (
                <Textarea
                  autoFocus
                  required
                  value={form.currentLevel}
                  onChange={(event) => updateField("currentLevel", event.target.value)}
                  placeholder="I know the basics, but I have not practiced consistently for a while."
                  className="min-h-44 text-base"
                />
              ) : null}

              {step.id === "capacity" ? (
                <div className="grid gap-5">
                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <BatteryMedium className="h-4 w-4 text-subtle" />
                      Available time per day
                    </span>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <Input
                        autoFocus
                        min={0.25}
                        step={0.25}
                        type="number"
                        value={form.availableTimePerDay}
                        onChange={(event) =>
                          updateField("availableTimePerDay", Number(event.target.value))
                        }
                      />
                      <span className="rounded-md bg-muted px-3 py-2 text-sm text-soft">
                        hours
                      </span>
                    </div>
                    <span className="text-xs leading-5 text-subtle">
                      If the honest answer is 15 minutes, use 0.25. That is useful signal.
                    </span>
                  </label>

                  <label className="grid gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Moon className="h-4 w-4 text-subtle" />
                      Timeline or gentle target
                    </span>
                    <Input
                      required
                      value={form.deadline}
                      onChange={(event) => updateField("deadline", event.target.value)}
                      placeholder="4 weeks, before July, no hard deadline..."
                    />
                  </label>

                  <div className="rounded-lg border border-primary/20 bg-surface-tint/70 p-4 text-sm leading-6 text-soft">
                    A realistic plan starts by protecting your energy. The generated daily tasks
                    will stay within this available time.
                  </div>
                </div>
              ) : null}

              {step.id === "time" ? (
                <RadioGroup
                  className="grid gap-3"
                  value={form.timeType}
                  onValueChange={(value) => updateField("timeType", value as TimeType)}
                >
                  {timeTypes.map((type) => (
                    <label
                      key={type.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:bg-surface-tint/50",
                        form.timeType === type.value && "border-primary/70 bg-surface-tint",
                      )}
                    >
                      <RadioGroupItem value={type.value} className="mt-1" />
                      <span>
                        <span className="block font-medium">{type.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-subtle">
                          {type.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              ) : null}

              {step.id === "obstacles" ? (
                <Textarea
                  autoFocus
                  required
                  value={form.constraints}
                  onChange={(event) => updateField("constraints", event.target.value)}
                  placeholder="Low energy after work, childcare, decision fatigue, inconsistent weekends..."
                  className="min-h-44 text-base"
                />
              ) : null}

              {step.id === "support" ? (
                <div className="grid gap-5">
                  <Textarea
                    autoFocus
                    required
                    value={form.preferredStyle ?? ""}
                    onChange={(event) => updateField("preferredStyle", event.target.value)}
                    placeholder="Gentle and structured, with tiny daily outputs and reminders to keep scope small."
                    className="min-h-36 text-base"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: Heart, label: "Gentle", text: "Kind restart language." },
                      { icon: Coffee, label: "Tiny steps", text: "Short, doable actions." },
                      { icon: Sparkles, label: "Structured", text: "Clear daily outputs." },
                    ].map((item) => {
                      const Icon = item.icon;

                      return (
                        <div
                          key={item.label}
                          className="rounded-lg border border-border/45 bg-surface-soft/70 p-4"
                        >
                          <Icon className="h-4 w-4 text-subtle" />
                          <p className="mt-3 text-sm font-medium">{item.label}</p>
                          <p className="mt-1 text-xs leading-5 text-subtle">{item.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-border/45 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={isFirstStep}
                onClick={goBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button type="submit" size="lg" disabled={!canContinue}>
                {isLastStep ? "Continue to gentle questions" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
