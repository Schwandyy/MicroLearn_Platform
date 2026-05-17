import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const checklistSchema = z.object({
  bom: z.boolean(),
  schematic: z.boolean(),
  codeCompiles: z.boolean(),
  flashOk: z.boolean(),
  expectedResult: z.boolean(),
  quizAnswers: z.boolean(),
  notes: z.string().max(2000).optional().nullable(),
});

const verifySchema = z.object({
  checklist: checklistSchema,
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = verifySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const lesson = await prisma.lesson.findUnique({ where: { id }, select: { id: true } });
  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { checklist } = parsed.data;
  const allPassed =
    checklist.bom &&
    checklist.schematic &&
    checklist.codeCompiles &&
    checklist.flashOk &&
    checklist.expectedResult &&
    checklist.quizAnswers;

  const now = new Date();
  const [, , updated] = await prisma.$transaction([
    prisma.lessonVerification.create({
      data: {
        lessonId: id,
        verifiedBy: session.user.id,
        verifiedAt: now,
        checklist,
        passed: allPassed,
      },
    }),
    prisma.lesson.update({
      where: { id },
      data: {
        verificationChecklist: checklist,
        // Nur bei vollständigem Pass setzen wir den Stempel — sonst bleibt die Lesson "in Überarbeitung"
        verifiedOnHardwareAt: allPassed ? now : null,
        verifiedOnHardwareBy: allPassed ? session.user.id : null,
      },
    }),
    prisma.lesson.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title_de: true,
        verifiedOnHardwareAt: true,
        verifiedOnHardwareBy: true,
        verificationChecklist: true,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, passed: allPassed, lesson: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  await prisma.lesson.update({
    where: { id },
    data: {
      verifiedOnHardwareAt: null,
      verifiedOnHardwareBy: null,
      verificationChecklist: Prisma.JsonNull,
    },
  });

  return NextResponse.json({ ok: true, reset: true });
}
