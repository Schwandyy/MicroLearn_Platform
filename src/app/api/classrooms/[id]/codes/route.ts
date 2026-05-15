import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { generateClassroomCode } from "@/server/auth/student-code";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.teacherId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  let code = generateClassroomCode();
  for (let i = 0; i < 5; i++) {
    const existing = await prisma.classroomCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateClassroomCode();
  }

  const created = await prisma.classroomCode.create({
    data: {
      classroomId: id,
      code,
      expiresAt,
      maxUses: 50,
    },
  });
  return NextResponse.json({ code: created.code, expiresAt: created.expiresAt });
}
