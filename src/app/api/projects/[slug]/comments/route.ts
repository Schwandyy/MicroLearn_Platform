import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const schema = z.object({ body: z.string().trim().min(2).max(2000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project || !project.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      projectId: project.id,
      authorId: session.user.id,
      body: parsed.data.body,
    },
  });
  return NextResponse.json({ ok: true, id: comment.id }, { status: 201 });
}
