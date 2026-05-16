import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; assignmentId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id, assignmentId } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.classroomAssignment.delete({ where: { id: assignmentId } });
  return NextResponse.json({ ok: true });
}
