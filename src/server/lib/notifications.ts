import type { NotificationType } from "@prisma/client";
import { prisma } from "@/server/db/prisma";
import { sendPush } from "@/server/lib/push";

interface CreateInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}

async function maybePush(input: CreateInput): Promise<void> {
  try {
    await sendPush(input.userId, {
      title_de: input.title,
      title_en: input.title,
      body_de: input.body ?? "",
      body_en: input.body ?? "",
      url: input.link ?? "/",
    });
  } catch {
    // best-effort
  }
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
    return; // best-effort
  }
  await maybePush(input);
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
    return; // best-effort
  }
  await Promise.all(inputs.map(maybePush));
}
