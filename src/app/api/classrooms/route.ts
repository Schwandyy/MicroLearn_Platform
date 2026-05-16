import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { getUserEntitlement } from "@/server/lib/access";

const schema = z.object({
  name: z.string().min(1).max(120),
  curriculumTag: z.string().max(40).nullable().optional(),
  state: z.string().trim().max(8).nullable().optional(),
  grade: z.number().int().min(1).max(13).nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const ent = await getUserEntitlement(session.user.id);
  if (ent !== "institution" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Institution required" }, { status: 402 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const stateValue = parsed.data.state?.toUpperCase() || null;
  const classroom = await prisma.classroom.create({
    data: {
      name: parsed.data.name,
      curriculumTag: parsed.data.curriculumTag ?? null,
      state: stateValue,
      grade: parsed.data.grade ?? null,
      teacherId: session.user.id,
    },
  });
  return NextResponse.json({ id: classroom.id });
}
