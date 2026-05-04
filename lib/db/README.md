# Persistence Layer

This folder contains the Neon Postgres + Drizzle ORM persistence foundation.

## Files

- `schema.ts` defines the database tables, enums, indexes, relations, and row types.
- `client.ts` creates the server-only Neon/Drizzle client from `DATABASE_URL`.
- `persistence.ts` contains typed helpers for common writes.

## Commands

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Tier Behavior

- Basic plans are persisted with `plans.is_fixed = true` and `daily_tasks.locked = true`.
- Advanced plans are persisted with editable task rows and can create `ai_adjustment_requests`.
- Full auth and payment wiring are intentionally not included yet.
