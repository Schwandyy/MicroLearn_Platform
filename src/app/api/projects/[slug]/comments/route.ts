import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { ugcLimit } from "@/server/lib/ratelimit";
import { createNotification } from "@/server/lib/notifications";

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
  const rl = await ugcLimit("comment", session.user.id);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Zu viele Kommentare in kurzer Zeit." },
      { status: 429 },
    );
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

  if (project.authorId !== session.user.id) {
    const author = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, name: true },
    });
    const who = author?.username ?? author?.name ?? "Jemand";
    const projectTitle = project.title_de;
    await createNotification({
      userId: project.authorId,
      type: "COMMENT",
      title: `${who} hat dein Projekt kommentiert`,
      body: `${projectTitle}: „${parsed.data.body.slice(0, 140)}${
        parsed.data.body.length > 140 ? "…" : ""
      }"`,
      link: `/projects/${project.slug}`,
    });
  }

  return NextResponse.json({ ok: true, id: comment.id }, { status: 201 });
}
