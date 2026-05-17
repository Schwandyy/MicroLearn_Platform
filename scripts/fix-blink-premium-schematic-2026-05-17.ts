// Aktiviert das Premium-Blink-Schaltbild für alle BUILD- und SIMULATE-Steps
// der Blink-Lesson. Setzt `payload.schematic = "blink-premium"` als Opt-in
// Flag. Andere Lessons bleiben unverändert (Phase A / Fritzing-Engine folgt).

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) {
    console.error(`Lesson ${LESSON_SLUG} not found.`);
    process.exit(1);
  }

  // Build-Steps haben sortOrder 5, 6, 7 (kind=BUILD). SIMULATE = sortOrder 11.
  const targets = await prisma.lessonStep.findMany({
    where: {
      lessonId: lesson.id,
      OR: [{ kind: "BUILD" }, { kind: "SIMULATE" }],
    },
    select: { id: true, sortOrder: true, kind: true, payload: true },
  });

  // Pro Step die buildStage-Hinweise erhalten, schematic-Flag setzen.
  const stageByOrder: Record<number, 1 | 2 | 3 | "all"> = {
    5: 1, // Widerstand
    6: 2, // LED
    7: 3, // Drähte
    11: "all", // Simulator
  };

  let updated = 0;
  for (const step of targets) {
    const payload = (step.payload as Record<string, unknown> | null) ?? {};
    const stage = stageByOrder[step.sortOrder] ?? "all";
    const newPayload = {
      ...payload,
      schematic: "blink-premium",
      buildStage: stage,
    } as Prisma.InputJsonValue;
    await prisma.lessonStep.update({
      where: { id: step.id },
      data: { payload: newPayload },
    });
    updated++;
    console.log(`[${step.sortOrder}/${step.kind}] schematic=blink-premium, buildStage=${stage}`);
  }

  console.log(`\n✅ ${updated} Step(s) auf Premium-Schaltbild umgestellt.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
