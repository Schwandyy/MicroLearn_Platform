import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const schema = z.object({
  decision: z.enum(["APPROVE", "REQUEST_CHANGES", "REJECT"]),
  notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const review = await prisma.contentReview.findUnique({
    where: { id },
    include: { lesson: true },
  });
  if (!review || !review.lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();
  if (parsed.data.decision === "APPROVE") {
    await prisma.$transaction([
      prisma.lesson.update({
        where: { id: review.lesson.id },
        data: { isPublished: true, publishedAt: now },
      }),
      prisma.contentReview.update({
        where: { id },
        data: {
          status: "PUBLISHED",
          authorId: session.user.id,
          reviewerNotes: parsed.data.notes ?? null,
          decidedAt: now,
        },
      }),
    ]);
    return NextResponse.json({ ok: true, published: true });
  }

  if (parsed.data.decision === "REJECT") {
    await prisma.contentReview.update({
      where: { id },
      data: {
        status: "REJECTED",
        authorId: session.user.id,
        reviewerNotes: parsed.data.notes ?? null,
        decidedAt: now,
      },
    });
    return NextResponse.json({ ok: true, rejected: true });
  }

  await prisma.contentReview.update({
    where: { id },
    data: {
      status: "CHANGES_REQUESTED",
      authorId: session.user.id,
      reviewerNotes: parsed.data.notes ?? null,
      decidedAt: now,
    },
  });
  return NextResponse.json({ ok: true });
}
