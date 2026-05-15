import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { uniqueSlug } from "@/server/lib/slug";

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(10).max(8000),
  coverImage: z
    .string()
    .trim()
    .url()
    .max(800)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  isPublic: z.boolean().default(true),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { title, body, coverImage, isPublic } = parsed.data;

  const slug = await uniqueSlug(
    title,
    async (s) => (await prisma.project.findUnique({ where: { slug: s } })) !== null,
  );

  const project = await prisma.project.create({
    data: {
      slug,
      authorId: session.user.id,
      title_de: title,
      title_en: title,
      body_de: body,
      body_en: body,
      coverImage: coverImage ?? null,
      isPublic,
    },
  });

  return NextResponse.json({ ok: true, slug: project.slug }, { status: 201 });
}
