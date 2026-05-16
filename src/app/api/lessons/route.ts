import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { slugify, uniqueSlug } from "@/server/lib/slug";

const STEP_KINDS = [
  "INTRO",
  "EXPLAIN",
  "BUILD",
  "CODE_WALK",
  "CELEBRATE",
] as const;

const stepSchema = z.object({
  kind: z.enum(STEP_KINDS),
  title_de: z.string().trim().max(120).optional().nullable(),
  title_en: z.string().trim().max(120).optional().nullable(),
  body_de: z.string().trim().max(8000).optional().nullable(),
  body_en: z.string().trim().max(8000).optional().nullable(),
});

const schema = z.object({
  courseId: z.string().cuid(),
  title_de: z.string().trim().min(3).max(120),
  title_en: z.string().trim().min(3).max(120),
  summary_de: z.string().trim().min(10).max(800),
  summary_en: z.string().trim().min(10).max(800),
  estimatedMinutes: z.number().int().min(5).max(240).optional(),
  xpReward: z.number().int().min(0).max(500).optional(),
  steps: z.array(stepSchema).max(20).default([]),
});

function canAuthor(role: string | null | undefined): boolean {
  return role === "TEACHER" || role === "INSTRUCTOR" || role === "ADMIN";
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!canAuthor(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const course = await prisma.course.findUnique({
    where: { id: parsed.data.courseId },
    select: { id: true },
  });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const base = slugify(parsed.data.title_de);
  const slug = await uniqueSlug(base, async (s) => {
    const existing = await prisma.lesson.findUnique({ where: { slug: s } });
    return existing !== null;
  });

  const lesson = await prisma.lesson.create({
    data: {
      courseId: parsed.data.courseId,
      slug,
      title_de: parsed.data.title_de,
      title_en: parsed.data.title_en,
      summary_de: parsed.data.summary_de,
      summary_en: parsed.data.summary_en,
      body_de: parsed.data.summary_de,
      body_en: parsed.data.summary_en,
      kind: "CONCEPT",
      estimatedMinutes: parsed.data.estimatedMinutes ?? null,
      xpReward: parsed.data.xpReward ?? 50,
      isPublished: false,
      steps: {
        create: parsed.data.steps.map((s, i) => ({
          sortOrder: i,
          kind: s.kind,
          title_de: s.title_de ?? null,
          title_en: s.title_en ?? null,
          body_de: s.body_de ?? null,
          body_en: s.body_en ?? null,
        })),
      },
      review: {
        create: {
          status: "PENDING",
          authorId: session.user.id,
        },
      },
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(
    { id: lesson.id, slug: lesson.slug },
    { status: 201 },
  );
}
