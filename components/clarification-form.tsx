"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerStore } from "@/hooks/use-planner-store";
import { clarificationQuestions } from "@/lib/mock-data";
import type { ClarificationAnswer } from "@/lib/types";

const PLAN_GENERATION_ERROR =
  "We could not create your plan right now. Your answers are saved, so you can retry in a moment.";

const helpers = [
  "Think of the first small win, not the whole mountain.",
  "This gives the plan a reason to matter on tired days.",
  "Confidence is not a scorecard. It just helps us choose a kind starting point.",
  "Low energy is useful information. The plan should respect it.",
  "Fragmented time can still hold real progress when the tasks are shaped well.",
  "Naming the friction helps the plan avoid accidentally recreating it.",
  "Your support style tells the coach how to sound when life gets uneven.",
];

function buildInitialAnswers(): ClarificationAnswer[] {
  return clarificationQuestions.map((question) => ({
    questionId: question.id,
    question: question.label,
    answer: "",
  }));
}

export function ClarificationForm() {
  const router = useRouter();
  const { answers, generatePlan, isReady, setAnswers } = usePlannerStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [formAnswers, setFormAnswers] = useState<ClarificationAnswer[]>(buildInitialAnswers);

  useEffect(() => {
    if (!isReady || answers.length === 0) {
      return;
    }

    setFormAnswers(
      clarificationQuestions.map((question) => {
        const existing = answers.find((answer) => answer.questionId === question.id);
        return {
          questionId: question.id,
          question: question.label,
          answer: existing?.answer ?? "",
        };
      }),
    );
  }, [answers, isReady]);

  const currentQuestion = clarificationQuestions[stepIndex];
  const currentAnswer =
    formAnswers.find((answer) => answer.questionId === currentQuestion.id)?.answer ?? "";
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === clarificationQuestions.length - 1;
  const progress = Math.round(((stepIndex + 1) / clarificationQuestions.length) * 100);

  const answeredCount = useMemo(() => {
    return formAnswers.filter((answer) => answer.answer.trim().length > 0).length;
  }, [formAnswers]);

  const persistAnswers = (nextAnswers = formAnswers) => {
    setAnswers(nextAnswers);
  };

  const updateAnswer = (questionId: string, answer: string) => {
    setErrorMessage(null);
    setFormAnswers((current) => {
      const nextAnswers = current.map((item) =>
        item.questionId === questionId ? { ...item, answer } : item,
      );
      setAnswers(nextAnswers);
      return nextAnswers;
    });
  };

  const goBack = () => {
    persistAnswers();
    if (isFirstStep) {
      router.push("/");
      return;
    }
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const goNext = () => {
    persistAnswers();
    setStepIndex((current) => Math.min(current + 1, clarificationQuestions.length - 1));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLastStep) {
      goNext();
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    persistAnswers();

    try {
      await generatePlan(formAnswers);
      router.push("/plan");
    } catch {
      setErrorMessage(PLAN_GENERATION_ERROR);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <Card className="overflow-hidden" variant="elevated">
        <CardContent className="p-0">
          <div className="border-b border-border/45 bg-card px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-surface-tint px-3 py-1.5 text-xs font-medium text-soft">
                <MessageCircle className="h-3.5 w-3.5 text-foreground/70" />
                Reflective planning
              </div>
              <p className="text-sm text-subtle">
                {stepIndex + 1} of {clarificationQuestions.length}
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
            <div className="rounded-lg border border-primary/20 bg-surface-tint/70 p-4 text-sm leading-6 text-soft">
              <div className="flex gap-3">
                <Heart className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
                <p>
                  You can answer in fragments. A sentence, a note, or a rough feeling is
                  enough for the plan to become more realistic.
                </p>
              </div>
            </div>

            <div className="min-h-[320px]">
              <p className="text-sm font-medium text-subtle">
                {helpers[stepIndex]}
              </p>
              <h2 className="mt-3 font-display text-3xl leading-tight text-foreground sm:text-4xl">
                {currentQuestion.label}
              </h2>
              <Textarea
                autoFocus
                className="mt-7 min-h-44 text-base"
                disabled={isGenerating}
                id={currentQuestion.id}
                value={currentAnswer}
                onChange={(event) => updateAnswer(currentQuestion.id, event.target.value)}
                placeholder={currentQuestion.placeholder}
              />
              <p className="mt-3 text-sm leading-6 text-subtle">
                Skip is okay. The plan can still start gently with what you have already shared.
              </p>
            </div>

            {errorMessage ? (
              <div
                className="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">The plan did not finish yet.</p>
                  <p className="mt-1 text-destructive/80">{errorMessage}</p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 border-t border-border/45 pt-5">
              <div className="flex items-center justify-between text-sm text-subtle">
                <span>
                  {answeredCount} of {clarificationQuestions.length} reflections answered
                </span>
                <span>{currentAnswer.trim() ? "Saved" : "Optional"}</span>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isGenerating}
                  onClick={goBack}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {isFirstStep ? "Back to start" : "Back"}
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  {!isLastStep ? (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={isGenerating}
                      onClick={goNext}
                    >
                      Skip for now
                    </Button>
                  ) : null}
                  <Button type="submit" size="lg" disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating your plan
                      </>
                    ) : (
                      <>
                        {isLastStep ? (
                          <>
                            {errorMessage ? "Try again" : "Create my gentle plan"}
                            <Sparkles className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
