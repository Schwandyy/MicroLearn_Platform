import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET =
  process.env.WAITLIST_SECRET ??
  process.env.AUTH_SECRET ??
  "microlearn-dev-waitlist-secret";

export function generateWaitlistToken(email: string): string {
  const rand = randomBytes(16).toString("hex");
  const sig = createHmac("sha256", SECRET)
    .update(`${email}|${rand}`)
    .digest("hex");
  return `${rand}.${sig}`;
}

export function verifyWaitlistToken(email: string, token: string): boolean {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [rand, sig] = token.split(".");
  if (!rand || !sig) return false;
  const expected = createHmac("sha256", SECRET)
    .update(`${email}|${rand}`)
    .digest("hex");
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
  } catch {
    return false;
  }
}
