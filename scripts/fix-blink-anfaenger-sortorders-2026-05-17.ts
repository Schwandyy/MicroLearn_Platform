/**
 * Fix für add-blink-anfaenger-steps-2026-05-17.ts: die Steps mit
 * ursprünglichem sortOrder >= 9 (SETUP, CODE_WALK, SIMULATE, QUIZ, CELEBRATE)
 * sind durch eine fehlerhafte Default-Formel auf negative sortOrders (-988 …)
 * gerutscht. Wir setzen sie auf 12, 13, 14, 15, 16 in Reihenfolge.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) throw new Error(`Lesson ${LESSON_SLUG} not found.`);

  // Negative sortOrders einsammeln (in Reihenfolge der originalen sortOrder).
  const broken = await prisma.lessonStep.findMany({
    where: { lessonId: lesson.id, sortOrder: { lt: 0 } },
    select: { id: true, sortOrder: true, title_de: true, kind: true },
    orderBy: { sortOrder: "asc" }, // -988, -987, -986, …
  });

  if (broken.length === 0) {
    console.log("Keine negativen sortOrders — nichts zu reparieren.");
    return;
  }

  // Welcher sortOrder ist aktuell der höchste „gesunde"? Davon zählen wir hoch.
  const lastGood = await prisma.lessonStep.findFirst({
    where: { lessonId: lesson.id, sortOrder: { gte: 0 } },
    select: { sortOrder: true },
    orderBy: { sortOrder: "desc" },
  });
  let next = (lastGood?.sortOrder ?? -1) + 1;

  for (const s of broken) {
    await prisma.lessonStep.update({
      where: { id: s.id },
      data: { sortOrder: next },
    });
    console.log(`  ${s.sortOrder} → ${next}  [${s.kind}] ${s.title_de}`);
    next++;
  }

  const finalSteps = await prisma.lessonStep.findMany({
    where: { lessonId: lesson.id },
    select: { sortOrder: true, kind: true, title_de: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\n✅ Finale Reihenfolge:\n");
  for (const s of finalSteps) {
    console.log(`  ${String(s.sortOrder).padStart(2, " ")}  ${s.kind.padEnd(10)}  ${s.title_de}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
