"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { usePlannerStore } from "@/hooks/use-planner-store";
import { clarificationQuestions } from "@/lib/mock-data";
import type { ClarificationAnswer } from "@/lib/types";

const PLAN_GENERATION_ERROR =
  "We could not generate your plan right now. Your answers are saved, so you can retry in a moment.";

export function ClarificationForm() {
  const router = useRouter();
  const { answers, generatePlan, isReady, setAnswers } = usePlannerStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formAnswers, setFormAnswers] = useState<ClarificationAnswer[]>(
    clarificationQuestions.map((question) => ({
      questionId: question.id,
      question: question.label,
      answer: "",
    })),
  );

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

  const updateAnswer = (questionId: string, answer: string) => {
    setErrorMessage(null);
    setFormAnswers((current) =>
      current.map((item) => (item.questionId === questionId ? { ...item, answer } : item)),
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsGenerating(true);
    setAnswers(formAnswers);
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
      <Card>
        <CardHeader>
          <CardTitle>Clarification Questions</CardTitle>
          <CardDescription>
            Mock questions stand in for the future AI question-generation step.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {clarificationQuestions.map((question, index) => (
            <Field key={question.id} htmlFor={question.id} label={`${index + 1}. ${question.label}`}>
              <Textarea
                id={question.id}
                required={index < 3}
                value={
                  formAnswers.find((answer) => answer.questionId === question.id)?.answer ?? ""
                }
                onChange={(event) => updateAnswer(question.id, event.target.value)}
                placeholder={question.placeholder}
              />
            </Field>
          ))}
          {errorMessage ? (
            <div
              className="flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Plan generation did not finish.</p>
                <p className="mt-1 text-destructive/80">{errorMessage}</p>
              </div>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={isGenerating}
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button type="submit" size="lg" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating plan
                </>
              ) : (
                <>
                  {errorMessage ? "Try again" : "Generate plan"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
