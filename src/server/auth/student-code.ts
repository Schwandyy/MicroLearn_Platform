import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/server/db/prisma";

/**
 * Schüler-Code-System — DSGVO-konform für Minderjährige
 * - Lehrer generiert 6-stelligen, ablaufenden Klassen-Code
 * - Schüler registriert sich mit Code + selbstgewähltem Benutzernamen
 * - Keine E-Mail, kein Passwort, keine PII gespeichert
 */

export function generateClassroomCode(): string {
  // 6 chars, alphabet excludes confusing 0/O/1/I
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function redeemStudentCode(input: {
  code: string;
  username: string;
}) {
  const now = new Date();
  const code = await prisma.classroomCode.findUnique({
    where: { code: input.code.toUpperCase() },
    include: { classroom: true },
  });

  if (!code) return { ok: false as const, error: "INVALID_CODE" };
  if (code.expiresAt < now) return { ok: false as const, error: "EXPIRED" };
  if (code.uses >= code.maxUses)
    return { ok: false as const, error: "EXHAUSTED" };

  const username = input.username.trim().slice(0, 40);
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(username))
    return { ok: false as const, error: "INVALID_USERNAME" };

  const taken = await prisma.user.findUnique({ where: { username } });
  if (taken) return { ok: false as const, error: "USERNAME_TAKEN" };

  const user = await prisma.user.create({
    data: {
      username,
      role: "STUDENT_CODE",
      preferredLocale: "de",
      classroomMember: {
        create: { classroomId: code.classroomId, isActive: true },
      },
    },
  });

  await prisma.classroomCode.update({
    where: { id: code.id },
    data: { uses: { increment: 1 } },
  });

  return { ok: true as const, userId: user.id };
}
