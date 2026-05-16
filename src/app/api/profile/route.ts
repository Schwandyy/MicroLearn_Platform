import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const schema = z.object({
  name: z.string().trim().min(1).max(80).nullable().optional(),
  image: z
    .string()
    .trim()
    .url()
    .max(800)
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
  bio: z.string().trim().max(2000).nullable().optional(),
  preferredLocale: z.enum(["de", "en"]).optional(),
  marketingOptIn: z.boolean().optional(),
  weeklyDigestOptOut: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const {
    name,
    image,
    bio,
    preferredLocale,
    marketingOptIn,
    weeklyDigestOptOut,
  } = parsed.data;

  const userUpdate: Record<string, unknown> = {};
  if (name !== undefined) userUpdate.name = name;
  if (image !== undefined) userUpdate.image = image;
  if (preferredLocale !== undefined) userUpdate.preferredLocale = preferredLocale;
  if (marketingOptIn !== undefined) userUpdate.marketingOptIn = marketingOptIn;
  if (weeklyDigestOptOut !== undefined)
    userUpdate.weeklyDigestOptOut = weeklyDigestOptOut;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(userUpdate).length) {
      await tx.user.update({ where: { id: session.user.id }, data: userUpdate });
    }
    if (bio !== undefined) {
      await tx.profile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, bio: bio ?? null },
        update: { bio: bio ?? null },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
