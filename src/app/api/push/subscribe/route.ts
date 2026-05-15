import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const schema = z.object({
  endpoint: z.string().url().min(1).max(2000),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  locale: z.enum(["de", "en"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId: session.user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      locale: parsed.data.locale ?? "de",
      enabled: true,
    },
    update: {
      userId: session.user.id,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      enabled: true,
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  await prisma.pushSubscription.updateMany({
    where: { endpoint, userId: session.user.id },
    data: { enabled: false },
  });
  return NextResponse.json({ ok: true });
}
