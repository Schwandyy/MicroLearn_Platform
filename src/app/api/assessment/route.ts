import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { scoreAssessment, type AssessmentAnswers } from "@/lib/assessment";

const optionSchema = z.enum(["a", "b", "c", "d"]);
const answerSchema = z
  .object({
    soldering: optionSchema,
    coding: optionSchema,
    circuits: optionSchema,
    boards: optionSchema,
    protocols: optionSchema,
    goal: optionSchema,
    context: optionSchema,
    age: optionSchema,
  })
  .partial();

const schema = z.object({
  answers: answerSchema,
  score: z.number().int().min(0).max(100),
  level: z.enum(["L1_BEGINNER", "L2_NOVICE", "L3_INTERMEDIATE", "L4_EXPERT"]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  // Re-score server-side to prevent client tampering
  const verified = scoreAssessment(parsed.data.answers as AssessmentAnswers);

  const result = await prisma.assessmentResult.create({
    data: {
      userId: session.user.id,
      answers: parsed.data.answers,
      score: verified.score,
      level: verified.level,
    },
  });

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, currentLevel: verified.level },
    update: { currentLevel: verified.level },
  });

  return NextResponse.json({ resultId: result.id, ...verified });
}
