export type TimeType = "fragmented" | "focused" | "mixed";

export type GoalIntake = {
  goal: string;
  motivation: string;
  currentLevel: string;
  deadline: string;
  availableTimePerDay: number;
  timeType: TimeType;
  constraints: string;
  preferredStyle?: string;
};

export type ClarificationAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export type Phase = {
  name: string;
  duration: string;
  objective: string;
};

export type WeeklyPlan = {
  week: number;
  focus: string;
  goals: string[];
  measurableOutcome: string;
  checkpoint: string;
};

export type DailyTask = {
  id: string;
  day: number;
  taskType: "learn" | "practice" | "review" | "build";
  title: string;
  output: string;
  estimatedTime: string;
  estimatedMinutes: number;
  status: "pending" | "complete" | "skipped";
};

export type GeneratedPlan = {
  goalSummary: string;
  assumptions: string[];
  totalDuration: string;
  phases: Phase[];
  weeklyPlan: WeeklyPlan[];
  dailyTasks: DailyTask[];
  resourcesNeeded: string[];
  risks: string[];
  adjustmentRules: string[];
};

export type GeneratePlanRequest = {
  intake: GoalIntake;
  answers: ClarificationAnswer[];
  userId?: string;
  goalId?: string;
  existingPlanId?: string;
};

export type PersistedGeneratedPlan = {
  plan: GeneratedPlan;
  planId: string;
  goalId: string;
  planVersionId: string;
  userId: string;
  planCreatedAt: string;
  planStartDate?: string | null;
};
