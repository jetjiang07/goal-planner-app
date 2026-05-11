import Link from "next/link";
import { ArrowLeft, Heart } from "lucide-react";

import { DailyTaskTracker } from "@/components/daily-task-tracker";
import { Button } from "@/components/ui/button";

export default function TrackerPage() {
  return (
    <main className="surface-page min-h-screen">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <header className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="px-0 hover:bg-transparent">
            <Link href="/plan" className="gap-2 text-soft">
              <ArrowLeft className="h-4 w-4" />
              Back to plan
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full bg-card/75 px-3 py-1.5 text-xs font-medium text-soft shadow-calm">
            <Heart className="h-3.5 w-3.5 text-foreground/70" />
            Gentle daily progress
          </div>
        </header>

        <section className="mx-auto w-full">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <p className="text-sm font-medium text-subtle">Today&apos;s gentle progress</p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Today&apos;s small steps
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-soft sm:text-lg">
              A quiet place to notice what is doable today. Finish what fits, leave what
              does not, and let small progress count.
            </p>
          </div>
          <DailyTaskTracker />
        </section>
      </div>
    </main>
  );
}
