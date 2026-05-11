# Goal Planner AI UI/UX Direction

Goal Planner AI should feel like a gentle AI growth companion for people making personal progress outside work. The interface should support small, consistent action in fragmented time without turning the user's life into a dashboard.

The product mood is gentle, calm, emotionally supportive, lightweight, low-pressure, after-work friendly, and focused on small consistent progress.

## 1. Visual Direction

The visual language should be warm, quiet, and breathable. Screens should feel like a supportive personal planning space, not an enterprise productivity tool.

Use:

- Warm neutral page backgrounds.
- Soft white surfaces.
- Rounded cards with low contrast borders.
- Calm typography with a human-feeling display voice.
- Supportive microcopy.
- Pastel accents used sparingly for orientation and warmth.
- Generous spacing around primary actions.

Avoid:

- Enterprise dashboard grids.
- Dense task management layouts.
- Kanban-style metaphors.
- Heavy borders and hard shadows.
- High-pressure progress mechanics.
- Large analytics panels.
- Overly gamified visuals such as trophies, streak pressure, rankings, or celebratory overload.

The interface should answer: "What is the next kind, realistic step I can take?"

## 2. Emotional Design Principles

### Gentle

The product should assume users may be tired, uncertain, or returning after a missed day. UI copy should help them restart without shame.

Use:

- "Let's make today lighter."
- "A small step still counts."
- "This plan can flex around real life."

Avoid:

- "You are behind."
- "You failed to complete your tasks."
- "Increase productivity now."

### Calm

Each screen should reduce cognitive load. Do not show more planning artifacts than the user needs for the current decision.

### Supportive

The product should sound like a steady companion, not a manager. It should acknowledge constraints and offer practical next steps.

### Low-Pressure

Progress should be visible but never coercive. Completion rate is useful; streak pressure, ranks, and failure-colored states are not.

### Adaptive

Adjustments should feel like gentle recalibration. When users miss tasks, the system should lighten future work. When users complete consistently, it can suggest slightly more challenging tasks.

## 3. Typography

The current product direction should move away from default SaaS typography and toward a warmer, more human feel.

Default recommended pairing:

- UI/body text: Inter
- Emotional headlines: Newsreader

Alternative acceptable pairings:

- Inter + Fraunces
- Geist Sans + Newsreader

Implementation guidance:

- Use Inter for navigation, forms, buttons, task text, metadata, and body copy.
- Use Newsreader for welcome headings, emotional overview headings, and reflective plan summaries.
- Do not use Newsreader for dense UI labels or small metadata.
- Keep letter spacing at 0 for normal text.
- Avoid all-caps except for rare metadata labels.
- Prefer sentence case for labels and headings.

Recommended scale:

- Emotional page headline: 36-48px desktop, 30-36px mobile, Newsreader.
- Page title: 28-36px desktop, 26-30px mobile, Inter or Newsreader depending on tone.
- Section title: 20-24px.
- Card title: 16-18px.
- Body text: 15-16px.
- Helper text and metadata: 12-14px.

Typography should make the product feel grounded, clear, and kind.

## 4. Spacing System

Use an 8px-based spacing system with generous breathing room.

- 4px: small icon and label gaps.
- 8px: tight grouped controls.
- 12px: compact text stacks.
- 16px: default control and card rhythm.
- 24px: card padding and grouped content spacing.
- 32px: section separation on mobile.
- 40px: section separation on desktop.
- 56px: major page rhythm for calm screens.

Guidance:

- Mobile should feel spacious, not compressed.
- Avoid placing more than one major decision in the same viewport when possible.
- Use whitespace to show importance instead of adding more borders.
- Keep repeated card spacing consistent.

## 5. Color System

### Base Colors

Use these base colors as the default visual foundation:

- Background: `#FAF8F5`
- Surface: `#FFFFFF`
- Primary text: `#1F2937`
- Secondary text: `#6B7280`

The base page background should be warm neutral. Do not use pastel accent colors as large full-page backgrounds.

### Pastel Accent Themes

Users may choose one pastel accent theme:

- Pink: `#F8C8DC`
- Blue: `#AEDFF7`
- Green: `#B8E6C1`
- Yellow: `#FFF2B2`
- Purple: `#D7C6F5`
- Orange: `#FFD6A5`

Pastel colors should be used only as accents:

- Primary buttons.
- Badges.
- Active states.
- Progress highlights.
- Theme previews.
- Gentle section highlights.
- Selected onboarding options.

Pastels should not dominate the screen. They should create warmth and recognition while the overall product remains calm and readable.

### Functional Color Guidance

- Error states should use restrained red and human copy.
- Success states should be gentle, not celebratory overload.
- Progress should use the selected accent color with accessible text contrast.
- Disabled states should remain clear but soft.

## 6. Surface And Background Hierarchy

Use a simple hierarchy:

- Page background: warm neutral `#FAF8F5`.
- Primary content surface: white `#FFFFFF`.
- Secondary surface: subtle warm off-white derived from the page background.
- Accent surface: selected pastel used at low visual weight for highlights only.

Cards should feel soft and premium:

- Border radius: 14-20px for main companion cards.
- Small controls may use 8-12px radius.
- Borders should be low contrast.
- Shadows should be soft and minimal.
- Avoid heavy outlines and dense divider stacks.

Do not nest cards inside cards unless the nested element is an actual repeated item, such as a task row inside today's focus.

## 7. Card Patterns

Cards should create emotional clarity, not dashboard density.

Recommended card types:

- Welcome card: introduces the next supportive action.
- Current week focus card: shows theme, outcome, and checkpoint.
- Today's focus card: shows one small set of actions.
- Progress momentum card: shows completion rate and adjustment suggestion.
- Reflection card: supports a brief check-in or restart moment.

Card content rules:

- One primary message per card.
- One primary action per card.
- Use muted helper text for explanation.
- Keep task lists short and scannable.
- Use icons only when they clarify meaning.

Avoid:

- Equal-weight metric tiles.
- Dense dashboard card grids.
- Cards used purely as decoration.
- Heavy borders between every row.

## 8. Layout Rules

Design each page around the user's current emotional and practical need.

Home:

- Header or welcome area.
- Primary action: "Create a new growth plan"
- Secondary action: "View existing goals"
- Optional theme selector.
- No dense metrics or dashboard summaries.

Onboarding:

- Guided conversation rather than static form.
- One clear prompt at a time or a short conversational stack.
- Helpful examples can appear as soft supporting text.
- Make the user's time and energy constraints feel normal.

Plan:

- Emotional overview first.
- Current week focus second.
- Today's focus above dense plan details.
- Expected outcomes and progress momentum below the immediate action.
- Keep long daily lists collapsed or visually secondary.

Tracker:

- Prioritize today's tasks.
- Preserve completion status clearly.
- Show completion rate with low pressure.
- Keep adjustment suggestions near upcoming tasks.

Global layout:

- Use a readable max-width container.
- Favor single-column mobile layouts.
- Use two columns only when the secondary column supports the current action.
- Avoid enterprise sidebars unless navigation complexity truly requires them.

## 9. Interaction Philosophy

Interactions should feel forgiving and steady.

- User inputs should feel saved or preserved where possible.
- AI generation failures should show friendly retry states.
- Task completion should update immediately and roll back if persistence fails.
- Missing tasks should trigger lighter suggestions, not warnings.
- Consistent completion should unlock slightly harder suggestions, not pressure.
- Basic users should see fixed plan behavior without feeling punished.
- Advanced users should be able to request future-task adjustments without rewriting completed history.

Microcopy should be concrete and supportive:

- Good: "Tomorrow is lighter so you can restart cleanly."
- Good: "This fits into two short sessions."
- Good: "Keep the output small: one note, one draft, or one practice round."
- Avoid: "Optimize your productivity."
- Avoid: "You missed your goal."

## 10. Mobile-First Considerations

Many users will check the product after work, between commitments, or from the couch. Mobile screens should feel like a lightweight companion, not a compressed desktop dashboard.

Mobile guidance:

- Keep the primary action visible without scrolling too far.
- Use single-column flows.
- Use large tap targets.
- Keep task cards stable when toggled.
- Avoid horizontal scrolling.
- Collapse secondary plan details.
- Keep copy short enough for tired users.
- Use the selected pastel accent sparingly for active states and progress.
- Make retry states obvious and non-technical.

## 11. Implementation Guidance For Future UI Work

When implementing UI changes:

- Start from the warm neutral background and white surface hierarchy.
- Add the pastel theme system as accent tokens, not background themes.
- Introduce Inter and Newsreader before major layout redesigns.
- Convert static intake into conversational onboarding.
- Replace dashboard-style sections with companion-style cards.
- Keep the plan page focused on current week, today's focus, expected outcomes, and progress momentum.
- Keep tracker interactions simple, persistent, and forgiving.

## Product Feel Summary

Goal Planner AI should feel like:

- A gentle companion for after-work growth.
- A calm place to restart.
- A realistic plan that respects energy and fragmented time.
- A supportive guide for small consistent progress.

It should not feel like:

- Enterprise project management software.
- A hardcore productivity optimizer.
- A dense task manager.
- A gamified streak system.
- A blank workspace users have to design themselves.
