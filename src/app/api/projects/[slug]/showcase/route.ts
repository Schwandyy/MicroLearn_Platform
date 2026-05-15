import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const schema = z.object({
  featured: z.boolean(),
  rank: z.number().int().min(0).max(9999).nullable().optional(),
});

function canFeature(role: string | undefined): boolean {
  return role === "ADMIN" || role === "TEACHER" || role === "INSTRUCTOR";
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!canFeature(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (parsed.data.featured) {
    await prisma.projectShowcase.upsert({
      where: { projectId: project.id },
      create: { projectId: project.id, rank: parsed.data.rank ?? null },
      update: { rank: parsed.data.rank ?? null },
    });
  } else {
    await prisma.projectShowcase
      .delete({ where: { projectId: project.id } })
      .catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
