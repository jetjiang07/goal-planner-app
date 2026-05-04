import { AppShell } from "@/components/app-shell";
import { DailyTaskTracker } from "@/components/daily-task-tracker";

export default function TrackerPage() {
  return (
    <AppShell
      currentPath="/tracker"
      eyebrow="Daily Tracker"
      title="Track execution and let completion data guide adjustments."
      description="Mark tasks complete or skipped. The mock adjustment logic responds to completion and missed-task rates."
    >
      <DailyTaskTracker />
    </AppShell>
  );
}
