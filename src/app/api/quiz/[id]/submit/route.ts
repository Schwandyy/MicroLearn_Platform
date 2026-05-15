import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { grantXP, XP } from "@/server/lib/xp";

const schema = z.object({
  answers: z.record(z.string(), z.string()),
});

interface QuizQuestion {
  id: string;
  correctKey: string;
  weight?: number;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const quiz = await prisma.quiz.findUnique({ where: { id } });
  if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const questions = (quiz.questions as unknown as QuizQuestion[]) ?? [];
  let earned = 0;
  let max = 0;
  let allCorrect = true;
  for (const q of questions) {
    const w = q.weight ?? 1;
    max += w;
    if (parsed.data.answers[q.id] === q.correctKey) earned += w;
    else allCorrect = false;
  }
  const score = max === 0 ? 0 : Math.round((earned / max) * 100);
  const passed = score >= quiz.passScore;

  await prisma.quizResult.create({
    data: {
      quizId: quiz.id,
      userId: session.user.id,
      score,
      passed,
      answers: parsed.data.answers,
    },
  });

  if (passed) {
    await grantXP({
      userId: session.user.id,
      amount: allCorrect ? XP.QUIZ_PERFECT : XP.QUIZ_PASS,
      reason: allCorrect ? "QUIZ_PERFECT" : "QUIZ_PASS",
      refId: quiz.id,
    });
  }

  return NextResponse.json({ score, passed });
}
