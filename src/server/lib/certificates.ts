import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/server/db/prisma";

/**
 * Stellt sicher, dass für (userId, pathId) ein Zertifikat existiert,
 * falls ALLE veröffentlichten Lessons des Pfades abgeschlossen wurden.
 *
 * Idempotent: gibt das bestehende Zertifikat zurück, wenn schon vorhanden.
 * Gibt null zurück, wenn der Pfad noch nicht komplett ist.
 */
export async function issueCertificateIfPathDone(
  userId: string,
  pathId: string,
): Promise<{ publicSlug: string } | null> {
  const existing = await prisma.certificate.findUnique({
    where: { userId_pathId: { userId, pathId } },
  });
  if (existing) return { publicSlug: existing.publicSlug };

  const path = await prisma.learningPath.findUnique({
    where: { id: pathId },
    select: { isPublished: true },
  });
  if (!path || !path.isPublished) return null;

  const totalLessons = await prisma.lesson.count({
    where: {
      isPublished: true,
      course: { pathId, isPublished: true },
    },
  });
  if (totalLessons === 0) return null;

  const doneLessons = await prisma.userProgress.count({
    where: {
      userId,
      completedAt: { not: null },
      lesson: {
        isPublished: true,
        course: { pathId, isPublished: true },
      },
    },
  });
  if (doneLessons < totalLessons) return null;

  const publicSlug = crypto.randomBytes(9).toString("base64url");
  const cert = await prisma.certificate.create({
    data: { userId, pathId, publicSlug },
  });
  return { publicSlug: cert.publicSlug };
}
