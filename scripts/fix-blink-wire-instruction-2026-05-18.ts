/**
 * Sprint 9.5: Step 10 Body — physisch korrekte Kabel-Anweisung.
 *
 * Vorher: „vom GND-Pin am ESP32 (Reihe i, Spalte 14)…"
 *         → Der Pin sitzt schon im Brett-Loch, M-M-Kabel passt da nicht rein.
 *
 * Nachher: „in das Loch DIREKT UNTER dem GND-Pin (Reihe j, Spalte 14)…"
 *          + Erklärung, dass das Brett alle Löcher der Spalte-f-bis-j-Reihe
 *          intern auf dasselbe Signal verbindet.
 *
 * Idempotent.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: "esp32-blink-led" },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  if (!lesson) throw new Error("Lesson nicht gefunden");

  const step10 = lesson.steps.find((s) => s.sortOrder === 10);
  if (!step10) {
    console.log("Step 10 nicht gefunden");
    return;
  }

  const targetDe = `Du brauchst zwei Jumper-Kabel (gerne blau für Minus). Erstes Kabel: vom kurzen LED-Beinchen (Spalte 29) zur BLAUEN Minus-Schiene ganz unten. Zweites Kabel: NICHT in den GND-Pin selbst (der ist schon vom ESP belegt), sondern in das freie Loch DIREKT UNTER dem GND-Pin — Reihe j, Spalte 14. Das Brett verbindet alle Löcher der unteren 5er-Spalte (Reihen f-g-h-i-j) intern auf dasselbe Signal — Reihe j Spalte 14 ist also elektrisch derselbe Punkt wie der GND-Pin. Von dort geht das Kabel zur Minus-Schiene. Jetzt ist der Stromkreis geschlossen: GPIO {{SIGNAL_GPIO}} → Widerstand → LED → Minus-Schiene → GND.`;

  const targetEn = `You need two jumper wires (blue is nice for minus). First wire: from the short LED leg (column 29) down to the BLUE minus rail at the bottom. Second wire: NOT into the GND pin itself (that hole is already occupied by the ESP pin), but into the free hole DIRECTLY BELOW the GND pin — row j, column 14. The breadboard connects all holes of the lower 5-hole column (rows f-g-h-i-j) internally to the same signal — so row j column 14 is electrically the same as the GND pin. From there the wire goes to the minus rail. The circuit is now closed: GPIO {{SIGNAL_GPIO}} → resistor → LED → minus rail → GND.`;

  if (step10.body_de === targetDe && step10.body_en === targetEn) {
    console.log("  ⊘ Step 10: bereits aktuell");
    return;
  }

  await prisma.lessonStep.update({
    where: { id: step10.id },
    data: { body_de: targetDe, body_en: targetEn },
  });
  console.log("  ✓ Step 10: GND-Kabel-Anweisung physisch korrekt");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
