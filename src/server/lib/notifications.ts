import type { NotificationType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

interface CreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

export async function createNotification(input: CreateInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch {
    // Notifications are best-effort — never break the caller flow
  }
}

export async function createManyNotifications(
  inputs: CreateInput[],
): Promise<void> {
  if (inputs.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: inputs.map((i) => ({
        userId: i.userId,
        type: i.type,
        title: i.title,
        body: i.body ?? null,
        link: i.link ?? null,
      })),
    });
  } catch {
    // Best-effort
  }
}
