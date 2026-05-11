import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, Circle, Sparkles } from "lucide-react";

import { IntakeForm } from "@/components/intake-form";
import { ThemeSelector } from "@/components/theme-selector";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="surface-page min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-calm">
              <Sparkles className="h-4 w-4" />
            </span>
            Goal Planner AI
          </Link>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button>Create account</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/plan" prefetch={false}>
                  Continue existing goals
                </Link>
              </Button>
              <UserButton />
            </Show>
          </div>
        </header>

        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1fr)] lg:gap-14">
          <div className="pt-4 sm:pt-8 lg:sticky lg:top-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm text-soft shadow-calm">
              <Circle className="h-2.5 w-2.5 fill-primary text-primary" />
              Gentle plans for fragmented time
            </div>
            <h1 className="mt-8 max-w-3xl font-display text-5xl leading-[0.98] text-foreground sm:text-6xl lg:text-7xl">
              Small progress for the time you actually have.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-soft sm:text-xl">
              A calm AI growth companion for after-work learning, skill-building,
              wellness, and personal goals. Start with what matters, then shape it
              into daily actions that respect your real energy.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="justify-between sm:justify-center">
                <a href="#growth-plan-start">
                  Create a new growth plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/plan" prefetch={false}>
                  Continue existing goals
                </Link>
              </Button>
            </div>

            <ThemeSelector />
          </div>

          <div id="growth-plan-start" className="scroll-mt-6">
            <IntakeForm />
          </div>
        </section>
      </div>
    </main>
  );
}
