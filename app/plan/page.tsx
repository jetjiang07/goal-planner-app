import { AppShell } from "@/components/app-shell";
import { PlanResult } from "@/components/plan-result";

export default function PlanPage() {
  return (
    <AppShell
      currentPath="/plan"
      eyebrow="Execution Coach"
      title="A calmer path from goal to action."
      description="Focus on the next useful step, the current week, and the outcomes that make progress visible."
    >
      <PlanResult />
    </AppShell>
  );
}
