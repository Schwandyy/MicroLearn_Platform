/**
 * Step 5 "Wie funktioniert das Steckbrett?" soll das Brett OHNE ESP zeigen.
 * Bisher: payload.showBreadboardExplainer = true (rendert ESP mit drin).
 * Neu: payload.breadboardVariant = "boardOnly".
 *
 * Begründung: Der Step erklärt Reihen, Spalten und Schienen — der ESP lenkt
 * davon ab. Erst danach kommt Step 6 „So setzt du den ESP32 ins Brett ein".
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) throw new Error(`Lesson ${LESSON_SLUG} not found.`);

  const step = await prisma.lessonStep.findFirst({
    where: {
      lessonId: lesson.id,
      title_de: "Wie funktioniert das Steckbrett?",
    },
    select: { id: true, payload: true, sortOrder: true },
  });
  if (!step) throw new Error("Step nicht gefunden.");

  const oldPayload = (step.payload as Record<string, unknown> | null) ?? {};
  // showBreadboardExplainer raus, breadboardVariant=boardOnly rein.
  const newPayload: Record<string, unknown> = { ...oldPayload };
  delete newPayload.showBreadboardExplainer;
  newPayload.breadboardVariant = "boardOnly";

  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { payload: newPayload as Prisma.InputJsonValue },
  });

  console.log(`✅ Step ${step.sortOrder} „Wie funktioniert das Steckbrett?" → breadboardVariant=boardOnly`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
