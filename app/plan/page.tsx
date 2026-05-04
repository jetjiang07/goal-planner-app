import { AppShell } from "@/components/app-shell";
import { PlanResult } from "@/components/plan-result";

export default function PlanPage() {
  return (
    <AppShell
      currentPath="/plan"
      eyebrow="Generated Plan"
      title="Review the structured plan before execution."
      description="See phases, weekly focus, daily tasks, resources, risks, and basic adjustment rules in one place."
    >
      <PlanResult />
    </AppShell>
  );
}
