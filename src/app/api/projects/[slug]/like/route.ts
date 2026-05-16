import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { ugcLimit } from "@/server/lib/ratelimit";

export async function POST(
  _req: Request,
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
  const rl = await ugcLimit("like", session.user.id);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Zu viele Likes in kurzer Zeit." },
      { status: 429 },
    );
  }
  await prisma.projectLike
    .create({
      data: { userId: session.user.id, projectId: project.id },
    })
    .catch(() => undefined); // idempotent: bereits-geliked = OK
  const count = await prisma.projectLike.count({
    where: { projectId: project.id },
  });
  return NextResponse.json({ ok: true, count, liked: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.projectLike
    .delete({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: project.id,
        },
      },
    })
    .catch(() => undefined);
  const count = await prisma.projectLike.count({
    where: { projectId: project.id },
  });
  return NextResponse.json({ ok: true, count, liked: false });
}
