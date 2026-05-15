import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/server/db/prisma";

// Wir wiederverwenden NextAuth-Tabelle „VerificationToken" für Reset-Tokens.
// Identifier-Präfix unterscheidet sie von Magic-Link-Tokens.
const RESET_PREFIX = "pwreset:";
const TTL_MINUTES = 30;

export async function createPasswordResetToken(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) return null;
  if (!user.passwordHash) {
    // OAuth-Konto ohne Passwort — Reset macht keinen Sinn
    return null;
  }
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TTL_MINUTES * 60 * 1000);
  await prisma.verificationToken.create({
    data: {
      identifier: `${RESET_PREFIX}${email.toLowerCase()}`,
      token,
      expires,
    },
  });
  return token;
}

export async function consumePasswordResetToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; reason: "invalid" | "expired" | "weak" }> {
  if (newPassword.length < 8) return { ok: false, reason: "weak" };
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || !record.identifier.startsWith(RESET_PREFIX)) {
    return { ok: false, reason: "invalid" };
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken
      .delete({ where: { token } })
      .catch(() => undefined);
    return { ok: false, reason: "expired" };
  }
  const email = record.identifier.slice(RESET_PREFIX.length);
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { passwordHash: hash },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);
  return { ok: true };
}
