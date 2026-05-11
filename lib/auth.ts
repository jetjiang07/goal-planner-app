import "server-only";

import { createHash } from "crypto";

import { auth } from "@clerk/nextjs/server";

export function mapClerkUserIdToAppUserId(clerkUserId: string) {
  const hash = createHash("sha256").update(`clerk:${clerkUserId}`).digest("hex");
  const bytes = hash.slice(0, 32).split("");

  bytes[12] = "5";
  bytes[16] = ((parseInt(bytes[16], 16) & 0x3) | 0x8).toString(16);

  const uuid = bytes.join("");

  return [
    uuid.slice(0, 8),
    uuid.slice(8, 12),
    uuid.slice(12, 16),
    uuid.slice(16, 20),
    uuid.slice(20, 32),
  ].join("-");
}

export async function getAuthenticatedAppUserId() {
  const { userId } = await auth();

  return userId ? mapClerkUserIdToAppUserId(userId) : null;
}
