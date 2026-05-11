# Goal Planner AI - Product Requirements Document

## 1. Product Overview

### 1.1 Vision

Goal Planner AI is a gentle AI growth companion that helps users turn personal goals into small, adaptive daily actions using fragmented time.

The product is designed for people who want to make steady progress outside work without turning their personal life into another productivity system. It should feel calm, emotionally supportive, lightweight, and realistic for after-work energy.

### 1.2 Product Positioning

Goal Planner AI helps users with:

- After-work growth: making progress when energy is limited and the workday is already done.
- Fragmented-time learning: using small pockets of time for learning, practice, review, and personal output.
- Low-pressure progress: supporting consistency without shame, streak pressure, or productivity guilt.
- Adaptive consistency: adjusting future work based on real completion patterns and changing constraints.
- Emotionally supportive planning: helping users feel oriented, capable, and not behind.
- Gentle execution coaching: translating goals into immediate next actions that fit the user's life.

### 1.3 What The Product Is Not

Goal Planner AI should be clearly different from:

- Motion/Reclaim-style scheduling tools: it does not optimize calendars or automatically schedule every minute.
- Todoist/TickTick-style task managers: it does not ask users to manage long task inventories.
- Notion-style workspaces: it does not become a blank canvas or personal operating system.
- Enterprise project management tools: it avoids dashboards, status-heavy workflows, kanban boards, and team productivity metaphors.

The product should help a user answer: "What is one realistic thing I can do next, given my energy and available time?"

### 1.4 Problem Statement

Users often have meaningful personal goals but struggle to make progress because:

- Their free time is fragmented across evenings, weekends, commutes, breaks, and low-energy moments.
- They over-plan when motivated and then feel discouraged when life interrupts.
- Generic task lists do not account for energy, emotional context, current level, or support style.
- Dense productivity tools make personal growth feel like work.
- Missing a day can make users abandon the goal entirely.

### 1.5 Solution

The app will:

- Guide users through a conversational onboarding flow instead of a static dashboard-style intake form.
- Ask clarifying questions that uncover motivation, context, constraints, energy, time shape, and support preferences.
- Generate a realistic growth plan with small daily actions.
- Separate learning, practice, review, and build/output tasks.
- Respect available time strictly, including fragmented-time constraints.
- Persist plans and completion history.
- Suggest lighter or more ambitious upcoming tasks based on completion patterns without regenerating the full plan.

## 2. Target Users

Primary users:

- Professionals who want after-work growth without a heavy productivity system.
- Adults learning skills in short sessions, such as coding, data, writing, language learning, design, or career development.
- People pursuing wellness or personal goals where consistency matters more than intensity.
- Users with fragmented time who need help choosing appropriately sized next actions.
- Users who want supportive structure but dislike enterprise-style dashboards and hardcore productivity tools.

The product should assume users may be tired, distracted, or uncertain. It should reduce friction and help them restart gently.

## 3. Core MVP Scope

### 3.1 Included Features

1. Conversational goal onboarding
2. AI clarification questions
3. AI-generated growth plan
4. Plan result view focused on current week, today's focus, outcomes, and momentum
5. Daily task tracker
6. Completion persistence
7. Basic progress feedback
8. Subscription-tier-ready persistence model

### 3.2 Excluded From MVP

- Authentication UI
- Payment UI
- Social features
- Team collaboration
- Full calendar scheduling automation
- Native mobile app
- Dense analytics dashboards
- Blank workspace customization

## 4. User Flow

### 4.1 Home Page Concept

The home page should feel like a calm starting point, not a dashboard.

Required structure:

- Header or welcome area with gentle orientation.
- Primary action: "Create a new growth plan"
- Secondary action: "View existing goals"
- Optional theme selector for pastel accent preference.

The home page should not show dense metrics, large task inventories, or enterprise dashboard cards.

### 4.2 Conversational Onboarding Flow

The onboarding experience should collect goal context through a guided conversation. It may use one question per step or a compact conversational sequence, but it should not feel like a static form.

Required questions:

1. What would you like to make progress on lately?
2. Why does this matter to you now?
3. What is your current level?
4. How much time and energy do you realistically have after work?
5. Is your time fragmented, focused, or mixed?
6. What usually gets in the way?
7. What kind of support style do you prefer?

The UI may map these answers into structured fields for persistence and plan generation, but the user-facing flow should feel conversational and supportive.

### 4.3 Clarification Flow

After onboarding, the system may ask 3-5 clarification questions when the initial context is not enough to create a realistic plan.

Clarification questions should focus on:

- Defining a meaningful first outcome.
- Understanding schedule and energy limits.
- Identifying friction points.
- Choosing a support tone.
- Reducing scope before the plan becomes too dense.

### 4.4 Plan Result Flow

The plan result should feel like an adaptive growth companion, not a project dashboard.

The page should prioritize:

- Emotional overview: a brief, supportive summary of the plan.
- Current week focus: the main theme and measurable outcome.
- Today's focus: the next small action.
- Expected outcomes: what the user is building toward.
- Progress momentum: completion rate and gentle adjustment suggestions.

### 4.5 Tracker Flow

The tracker should help users complete or reset daily actions with minimal pressure.

Expected behavior:

- Show current tasks clearly.
- Allow completion and uncompletion.
- Preserve completion status on refresh.
- Roll back local state if persistence fails.
- Show completion rate as helpful context, not a performance score.
- Suggest lighter upcoming tasks when the user misses work.
- Suggest slightly harder upcoming tasks when the user completes consistently.

## 5. Functional Requirements

### 5.1 Onboarding Data

The conversational flow should capture:

- `goal`: what the user wants to make progress on.
- `motivation`: why it matters now.
- `currentLevel`: current experience or baseline.
- `deadline` or `duration`: timeline when available.
- `availableTimePerDay`: realistic daily time in minutes or hours.
- `timeType`: `fragmented`, `focused`, or `mixed`.
- `constraints`: what usually gets in the way.
- `preferredStyle`: preferred support style.
- `energyLevel`: optional indicator for after-work capacity.
- `themePreference`: optional pastel accent theme.

### 5.2 Plan Generation

The AI-generated plan must be structured, realistic, and suitable for fragmented time.

The plan must include:

- Goal summary.
- Realistic assumptions.
- Total duration.
- Phases.
- Weekly plan with measurable outcome and checkpoint.
- Daily tasks.
- Resources needed.
- Risks.
- Adjustment rules.

Each daily task must include:

- `task_type`: `learn`, `practice`, `review`, or `build`.
- Clear output: what the user produces, reviews, decides, writes, records, practices, or completes.
- Estimated time.
- Time fit: total daily task time must be less than or equal to the user's available time.

If the generated plan is too dense, the system must reduce scope before returning the plan.

### 5.3 Daily Task Tracking

Users must be able to:

- Mark a task complete.
- Uncheck a completed task.
- Preserve completion status across refreshes.
- Avoid duplicate task completion records.
- See friendly error handling if a completion update fails.

### 5.4 Progress Feedback

The product should provide simple adaptive feedback:

- Show completion rate as a percentage.
- If the user misses tasks, suggest a lighter next day.
- If the user completes consistently, suggest slightly harder upcoming tasks.
- Do not regenerate the full plan for simple progress feedback.
- Adjust upcoming days only.

Feedback language should avoid shame. Prefer "Tomorrow can be lighter so you can restart cleanly" over "You are behind."

### 5.5 Subscription Tier Behavior

Basic users:

- Can create a fixed plan.
- Can track completion.
- Can later sync or receive reminders through external productivity or calendar apps.
- Cannot modify generated daily task details after the plan is created.

Advanced users:

- Can request AI-assisted adjustments.
- Can revise future daily task details based on completion history.
- Can revise future daily task details based on new requirements or changed constraints.
- Should not rewrite past completed history when requesting adjustments.

The UI does not need authentication or payment surfaces yet, but the schema and persistence layer should preserve this product distinction.

## 6. Non-Functional Requirements

- Mobile-first and responsive.
- Fast UI interactions.
- Friendly failure states for AI and persistence errors.
- Accessible color contrast for text and controls.
- Type-safe API and persistence operations.
- No sensitive server details exposed to the client.
- Calm visual system with low cognitive load.
- Clear enough structure for users who have only a few minutes.
- Clerk authentication protects saved plan generation, plan viewing, and task tracking before deployment.

## 7. Tech Stack

- Frontend: Next.js App Router
- UI: Tailwind CSS and shadcn/ui
- Backend: Next.js API Routes
- Database: Neon Postgres
- ORM: Drizzle ORM
- AI: OpenAI API
- Authentication: Clerk
- Deployment: Vercel

## 8. AI Design Requirements

The AI should behave like a gentle growth coach.

It must:

- Respect the user's daily available time strictly.
- Assume after-work energy may be limited.
- Break work into small, concrete actions.
- Separate learning, practice, review, and build/output tasks.
- Support fragmented time with tasks that can be paused and resumed.
- Ask realistic assumptions instead of pretending certainty.
- Avoid generic advice.
- Reduce scope when the requested goal is too ambitious for the available time.
- Use emotionally supportive language without being sentimental or patronizing.

## 9. Visual And UX Direction

The interface should feel gentle, calm, emotionally supportive, lightweight, low-pressure, after-work friendly, and focused on small consistent progress.

Use:

- Warm neutral background.
- Soft white surfaces.
- Rounded cards.
- Low contrast borders.
- Calm typography.
- Supportive microcopy.
- Pastel accent themes used sparingly.

Avoid:

- Enterprise dashboard layouts.
- Dense task-management screens.
- Hardcore productivity optimizer language.
- Large analytics surfaces.
- Gamified pressure mechanics.

Detailed visual guidance lives in `docs/ui-ux-direction.md`.

## 10. Success Metrics

Product success should measure steady progress, not intensity.

Useful metrics:

- Onboarding completion rate.
- Plan generation success rate.
- Return rate after plan creation.
- Daily completion rate.
- Number of users who recover after missing a day.
- Number of successful lightweight adjustments.
- Reduction in abandoned plans caused by over-scoping.

Avoid over-optimizing for streak length or task volume, since those can pressure users into unrealistic plans.

## 11. Future Enhancements

- User-selectable pastel accent themes.
- Calendar or productivity app sync for reminders.
- Advanced AI adjustment requests.
- Multi-goal support.
- Gentle reflection prompts.
- Optional weekly review.
- Lightweight export or sharing.
- More nuanced support styles.

## 12. Risks

- Plans become too ambitious and discourage users.
- The UI drifts back into generic SaaS dashboard patterns.
- Progress feedback feels punitive.
- The product becomes too feature-heavy for after-work use.
- AI-generated tasks become vague instead of actionable.
- Subscription behavior becomes confusing without clear task-editing rules.

## 13. MVP Definition Of Done

The MVP is complete when:

- A user can start from a calm home page.
- A user can enter goal context through a conversational onboarding flow.
- The system can ask clarification questions when needed.
- The system can generate a realistic structured plan.
- The plan respects available time and fragmented-time constraints.
- The user can view the plan in a supportive, low-pressure format.
- The user can track daily tasks.
- Completion data persists across refreshes.
- Basic and Advanced tier behavior is represented in the persistence model.
