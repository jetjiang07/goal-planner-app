"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Sparkles } from "lucide-react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerStore } from "@/hooks/use-planner-store";
import type { GoalIntake, TimeType } from "@/lib/types";

export function IntakeForm() {
  const router = useRouter();
  const { intake, isReady, setIntake } = usePlannerStore();
  const [form, setForm] = useState<GoalIntake>(intake);

  useEffect(() => {
    if (isReady) {
      setForm(intake);
    }
  }, [intake, isReady]);

  const updateField = <K extends keyof GoalIntake>(field: K, value: GoalIntake[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIntake(form);
    router.push("/clarify");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Goal Intake</CardTitle>
            <CardDescription>
              Capture enough context to turn a vague outcome into a realistic plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Field htmlFor="goal" label="Goal">
              <Textarea
                id="goal"
                required
                value={form.goal}
                onChange={(event) => updateField("goal", event.target.value)}
                placeholder="I want to become confident using Power BI for work reports."
              />
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field htmlFor="motivation" label="Motivation">
                <Textarea
                  id="motivation"
                  required
                  value={form.motivation}
                  onChange={(event) => updateField("motivation", event.target.value)}
                  placeholder="Why this matters now"
                />
              </Field>
              <Field htmlFor="currentLevel" label="Current level">
                <Textarea
                  id="currentLevel"
                  required
                  value={form.currentLevel}
                  onChange={(event) => updateField("currentLevel", event.target.value)}
                  placeholder="Beginner, intermediate, returning after a break..."
                />
              </Field>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Field htmlFor="deadline" label="Deadline or duration">
                <Input
                  id="deadline"
                  required
                  value={form.deadline}
                  onChange={(event) => updateField("deadline", event.target.value)}
                  placeholder="4 weeks, July 15, before exams..."
                />
              </Field>
              <Field htmlFor="availableTimePerDay" label="Available hours per day">
                <Input
                  id="availableTimePerDay"
                  min={0.25}
                  step={0.25}
                  type="number"
                  value={form.availableTimePerDay}
                  onChange={(event) =>
                    updateField("availableTimePerDay", Number(event.target.value))
                  }
                />
              </Field>
            </div>
            <Field
              htmlFor="timeType"
              label="Time type"
              description="This helps later plans avoid assuming long uninterrupted blocks."
            >
              <RadioGroup
                id="timeType"
                className="grid gap-3 sm:grid-cols-3"
                value={form.timeType}
                onValueChange={(value) => updateField("timeType", value as TimeType)}
              >
                {["focused", "fragmented", "mixed"].map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-3 rounded-md border bg-card p-3 text-sm capitalize"
                  >
                    <RadioGroupItem value={type} />
                    {type}
                  </label>
                ))}
              </RadioGroup>
            </Field>
            <div className="grid gap-5 md:grid-cols-2">
              <Field htmlFor="constraints" label="Constraints">
                <Textarea
                  id="constraints"
                  value={form.constraints}
                  onChange={(event) => updateField("constraints", event.target.value)}
                  placeholder="Low energy after work, childcare, no weekends..."
                />
              </Field>
              <Field htmlFor="preferredStyle" label="Preferred style">
                <Textarea
                  id="preferredStyle"
                  value={form.preferredStyle}
                  onChange={(event) => updateField("preferredStyle", event.target.value)}
                  placeholder="Hands-on, structured, deep reading, video first..."
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="lg">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
      <aside className="grid content-start gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              MVP behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            The current skeleton uses deterministic mock planning data. The storage and module
            boundaries are ready for a future API route that calls an AI planner.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Planning principle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            Daily work is constrained by available time first, then stretched only when completion
            rates show the plan is too easy.
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
