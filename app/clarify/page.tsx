import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { ClarificationForm } from "@/components/clarification-form";
import { Button } from "@/components/ui/button";

export default function ClarifyPage() {
  return (
    <main className="surface-page min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <header className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
            <Link href="/" className="gap-2 text-soft">
              <ArrowLeft className="h-4 w-4" />
              Back to start
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1.5 text-xs font-medium text-soft shadow-calm">
            <Sparkles className="h-3.5 w-3.5 text-foreground/70" />
            Planning conversation
          </div>
        </header>

        <section className="mx-auto w-full max-w-3xl">
          <div className="mb-8 text-center sm:mb-10">
            <p className="text-sm font-medium text-subtle">A few gentle details</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Let&apos;s shape this around your real life.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-soft sm:text-lg">
              These questions help the plan stay small, useful, and emotionally realistic.
              Answer lightly. There is no perfect response.
            </p>
          </div>
          <ClarificationForm />
        </section>
      </div>
    </main>
  );
}
