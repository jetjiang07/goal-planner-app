# Authentication Model

Goal Planner AI uses Clerk for minimal authentication before deployment.

## Protected Routes

The following routes require a signed-in Clerk session:

- `/plan`
- `/tracker`
- `/api/generate-plan`
- `/api/plans/*`
- `/api/tasks/*`

The home and onboarding screens can still be viewed without signing in, but persisted plan generation and saved task progress require authentication.

## Sign-In And Sign-Up

The app provides Clerk-powered auth routes:

- `/sign-in`
- `/sign-up`

The home page also exposes lightweight sign-in and account creation actions without changing the calm product direction.

## User ID Mapping

Clerk user IDs are strings such as `user_...`, while the existing database schema uses UUID primary keys.

To avoid a schema rewrite before deployment, the app maps each Clerk user ID to a stable internal UUID:

- Input: Clerk `userId`
- Mapping: deterministic SHA-256 based UUID
- Output: internal app `users.id`

This means the same Clerk user always maps to the same app user record, and plan ownership remains enforced through the existing UUID foreign keys.

## Guest Data

The previous anonymous flow used a fixed anonymous UUID. It remains isolated as temporary guest-local state only.

Important behavior:

- Guest localStorage keys are separated from authenticated localStorage keys.
- Authenticated users do not reuse guest plan IDs or goal IDs.
- Server APIs ignore client-supplied user IDs and use the Clerk session instead.
- Guest data is not automatically migrated into an authenticated account yet.

Future migration can add an explicit "save guest plan to account" flow if needed.

## Ownership Rules

Server route handlers derive the active app user from Clerk auth.

- Plan reads are scoped by `planId` and authenticated app user ID.
- Plan generation creates goals and plans under the authenticated app user ID.
- Task completion verifies the task belongs to a plan owned by the authenticated app user before updating status.

This prevents guest data or another user's task IDs from overwriting authenticated user data.

## Required Environment Variables

Set these for Clerk:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Recommended route configuration:

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/plan`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/plan`

Existing required environment variables still apply, including database and OpenAI configuration.
