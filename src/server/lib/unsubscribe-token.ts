import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed unsubscribe tokens for the weekly digest mail.
 *
 * The mail link looks like `/api/unsubscribe?u=<userId>&k=weekly&t=<sig>` —
 * the route verifies `t` and flips the corresponding User column. Tokens do
 * not expire (a teacher may unsubscribe months later from a stale mail),
 * but they invalidate if the secret rotates.
 */

const SECRET =
  process.env.UNSUBSCRIBE_SECRET ??
  process.env.AUTH_SECRET ??
  "microlearn-dev-unsubscribe-secret";

export type UnsubKind = "weekly" | "parentMonthly";

function payload(userId: string, kind: UnsubKind): string {
  return `${kind}|${userId}`;
}

export function signUnsubscribeToken(userId: string, kind: UnsubKind): string {
  return createHmac("sha256", SECRET).update(payload(userId, kind)).digest("hex");
}

export function verifyUnsubscribeToken(
  userId: string,
  kind: UnsubKind,
  token: string,
): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  const expected = signUnsubscribeToken(userId, kind);
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(token, "hex"));
  } catch {
    return false;
  }
}
