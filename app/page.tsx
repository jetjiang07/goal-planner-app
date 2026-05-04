import { AppShell } from "@/components/app-shell";
import { IntakeForm } from "@/components/intake-form";

export default function Home() {
  return (
    <AppShell
      currentPath="/"
      eyebrow="Goal Planner MVP"
      title="Turn a vague goal into a workable execution plan."
      description="Start with the context that matters: goal, deadline, capacity, constraints, and preferred working style."
    >
      <IntakeForm />
    </AppShell>
  );
}
