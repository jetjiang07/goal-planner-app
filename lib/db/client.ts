import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "@/lib/db/schema";

let dbInstance: ReturnType<typeof createDatabase> | null = null;

function createDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return drizzle(neon(databaseUrl), { schema });
}

export function getDb() {
  dbInstance ??= createDatabase();
  return dbInstance;
}

export type DbClient = ReturnType<typeof getDb>;
