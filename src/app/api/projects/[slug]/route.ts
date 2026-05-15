import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

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
  const isOwner = project.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await prisma.project.delete({ where: { id: project.id } });
  return NextResponse.json({ ok: true });
}
