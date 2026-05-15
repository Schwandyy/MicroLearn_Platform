import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { slug, id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { project: true },
  });
  if (!comment || comment.project?.slug !== slug) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAuthor = comment.authorId === session.user.id;
  const isProjectOwner = comment.project?.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isProjectOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
