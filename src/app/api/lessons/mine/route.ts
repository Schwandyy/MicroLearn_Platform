import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const reviews = await prisma.contentReview.findMany({
    where: { authorId: session.user.id, lessonId: { not: null } },
    orderBy: { updatedAt: "desc" },
    include: {
      lesson: {
        select: {
          id: true,
          slug: true,
          title_de: true,
          title_en: true,
          isPublished: true,
          publishedAt: true,
          updatedAt: true,
          course: {
            select: {
              slug: true,
              title_de: true,
              title_en: true,
              path: { select: { slug: true, title_de: true, title_en: true } },
            },
          },
          steps: { select: { id: true } },
        },
      },
    },
  });

  return NextResponse.json({
    items: reviews
      .filter((r) => r.lesson)
      .map((r) => {
        const l = r.lesson!;
        return {
          lessonId: l.id,
          slug: l.slug,
          title_de: l.title_de,
          title_en: l.title_en,
          isPublished: l.isPublished,
          publishedAt: l.publishedAt?.toISOString() ?? null,
          updatedAt: l.updatedAt.toISOString(),
          stepCount: l.steps.length,
          course: l.course
            ? {
                slug: l.course.slug,
                title_de: l.course.title_de,
                title_en: l.course.title_en,
                path: l.course.path,
              }
            : null,
          reviewStatus: r.status,
          reviewerNotes: r.reviewerNotes,
        };
      }),
  });
}
