import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export const runtime = "nodejs";

const ALLOWED_ROLES = new Set(["TEACHER", "INSTRUCTOR", "ADMIN"]);

const schema = z.object({
  standardIds: z.array(z.string().cuid()).max(40),
});

async function canEdit(
  userId: string,
  role: string,
  lessonId: string,
): Promise<boolean> {
  if (role === "ADMIN") return true;
  if (!ALLOWED_ROLES.has(role)) return false;
  const review = await prisma.contentReview.findUnique({
    where: { lessonId },
    select: { authorId: true },
  });
  return review?.authorId === userId;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await prisma.lessonCurriculumStandard.findMany({
    where: { lessonId: id },
    include: { standard: true },
    orderBy: { standard: { sortOrder: "asc" } },
  });
  return NextResponse.json({
    standards: rows.map((r) => r.standard),
  });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  const ok = await canEdit(session.user.id, session.user.role, id);
  if (!ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const standardIds = Array.from(new Set(parsed.data.standardIds));

  await prisma.$transaction([
    prisma.lessonCurriculumStandard.deleteMany({ where: { lessonId: id } }),
    ...(standardIds.length > 0
      ? [
          prisma.lessonCurriculumStandard.createMany({
            data: standardIds.map((standardId) => ({
              lessonId: id,
              standardId,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true, count: standardIds.length });
}
