import { AppShell } from "@/components/app-shell";
import { ClarificationForm } from "@/components/clarification-form";

export default function ClarifyPage() {
  return (
    <AppShell
      currentPath="/clarify"
      eyebrow="Clarification"
      title="Answer the questions that shape the plan."
      description="The MVP uses mock follow-up questions, preserving the slot where AI-generated questions will live."
    >
      <ClarificationForm />
    </AppShell>
  );
}
