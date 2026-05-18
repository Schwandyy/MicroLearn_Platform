/**
 * Sprint 9.1 Hot-Fix: Blink-Lesson auf echte 38-Pin AZ-Delivery ESP32 +
 * 60-Spalten 830-Pin-Breadboard umstellen.
 *
 * Bisherige Step-Texte gehen davon aus:
 *   • 30-Pin ESP, Pin-Reihen sitzen auf Brett-Reihen e + f (über die Mittelrille)
 *   • Schaltung in Spalten 18 / 21 / 22, GND-Pin auf Spalte 2 untere Pin-Reihe
 *
 * REALITÄT (User-Foto-Audit 2026-05-18):
 *   • 38-Pin ESP, Pin-Reihen sitzen auf Brett-Reihen a + i (überspannen fast
 *     die ganze Brett-Breite, NICHT die Mittelrille)
 *   • Schaltung in Spalten 25 / 28 / 29 (RECHTS vom ESP), GND-Pin auf
 *     Reihe i Spalte 14 (kürzester Weg zur Minus-Schiene)
 *
 * Idempotent — kann mehrfach laufen.
 *
 * Aufruf:
 *   pnpm tsx scripts/fix-blink-38pin-spalten-2026-05-18.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: "esp32-blink-led" },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  if (!lesson) throw new Error("Lesson esp32-blink-led nicht gefunden");

  console.log(`Lesson gefunden: ${lesson.title_de} (${lesson.steps.length} Steps)\n`);

  const updates: Array<{
    sortOrder: number;
    field: "title_de" | "title_en" | "body_de" | "body_en";
    from: string;
    to: string;
  }> = [
    // === Step 6 (EXPLAIN: So setzt du den ESP32 ins Steckbrett) ===
    // Komplett neu schreiben — 38-Pin platziert sich anders als 30-Pin
    {
      sortOrder: 6,
      field: "body_de",
      from: "Halte den ESP32 mit dem USB-Anschluss NACH LINKS. Die zwei Pin-Reihen müssen über die MITTLERE RILLE des Steckbretts gehen — eine Reihe oben (Reihe e), eine Reihe unten (Reihe f). Setze ihn vorsichtig drauf, sodass alle 30 Pins genau in 30 Löcher zeigen. Dann drück mittig und gleichmäßig nach unten, bis die Pins ganz im Brett stecken. Tipp: lieber langsam und beidseitig drücken — sonst verbiegen sich Pins.",
      to: "Halte den ESP32 mit dem USB-Anschluss NACH LINKS. Das Modul ist breit — beide Pin-Reihen müssen jeweils GANZ AUSSEN ins Brett: die obere Pin-Reihe in Reihe a, die untere in Reihe i. Die Pins sitzen so links bei Spalte 1, ganz rechts bei Spalte 19 — insgesamt 38 Pins (19 pro Seite). Setze den ESP32 vorsichtig drauf, sodass alle 38 Pins genau in 38 Löcher zeigen. Dann drück mittig und gleichmäßig nach unten, bis die Pins ganz im Brett stecken. Tipp: lieber langsam und beidseitig drücken — sonst verbiegen sich Pins.",
    },
    {
      sortOrder: 6,
      field: "body_en",
      from: `Hold the ESP32 with the USB port pointing LEFT. The two pin rows must straddle the CENTER CHANNEL of the breadboard — one row on top (row e), one row on bottom (row f). Place it down carefully so all 30 pins line up with 30 holes. Then press straight down evenly until the pins seat fully. Tip: go slow and press on both sides — uneven pressure bends pins.`,
      to: `Hold the ESP32 with the USB port pointing LEFT. The module is wide — both pin rows must go OUTERMOST into the breadboard: the upper pin row into row a, the lower into row i. Pins sit on column 1 on the left and column 19 on the right — 38 pins total (19 per side). Place the ESP32 gently so all 38 pins line up with 38 holes. Then press straight down evenly until the pins seat fully. Tip: go slow and press on both sides — uneven pressure bends pins.`,
    },

    // === Step 8 (BUILD 1: Widerstand stecken) — Spalten 18+21 → 25+28 ===
    {
      sortOrder: 8,
      field: "body_de",
      from: `Im Bild siehst du zwei pulsierende Punkte mit gelben Labels „Spalte 18" und „Spalte 21" — rechts vom ESP32, auf Reihe a. Steck den Widerstand mit je einem Beinchen in diese beiden Löcher. Der Widerstand liegt dann waagerecht und überspannt drei Lücken. Ein Widerstand hat keine Richtung — beide Seiten sind gleich.`,
      to: `Im Bild siehst du zwei pulsierende Punkte mit gelben Labels „Spalte 25" und „Spalte 28" — rechts vom ESP32, auf Reihe a. Steck den Widerstand mit je einem Beinchen in diese beiden Löcher. Der Widerstand liegt dann waagerecht und überspannt drei Lücken. Ein Widerstand hat keine Richtung — beide Seiten sind gleich.`,
    },
    {
      sortOrder: 8,
      field: "body_en",
      from: `In the picture you see two pulsing dots labeled „Column 18" and „Column 21" — to the right of the ESP32, on row a. Plug one leg of the resistor into each hole. The resistor sits horizontally, bridging three gaps. A resistor has no direction — either way works.`,
      to: `In the picture you see two pulsing dots labeled „Column 25" and „Column 28" — to the right of the ESP32, on row a. Plug one leg of the resistor into each hole. The resistor sits horizontally, bridging three gaps. A resistor has no direction — either way works.`,
    },

    // === Step 9 (BUILD 2: LED stecken) — Spalten 21+22 → 28+29 ===
    {
      sortOrder: 9,
      field: "body_de",
      from: "Die LED hat zwei verschieden lange Beinchen: das LANGE ist Plus (+), das KURZE ist Minus (−). Das lange Beinchen steckst du in Spalte 21 (Reihe a) — genau dasselbe Loch wie das rechte Widerstandsbeinchen. Das kurze Beinchen kommt in Spalte 22 (Reihe a). Die LED steht jetzt aufrecht über zwei Löchern.",
      to: "Die LED hat zwei verschieden lange Beinchen: das LANGE ist Plus (+), das KURZE ist Minus (−). Das lange Beinchen steckst du in Spalte 28 (Reihe a) — genau dasselbe Loch wie das rechte Widerstandsbeinchen. Das kurze Beinchen kommt in Spalte 29 (Reihe a). Die LED steht jetzt aufrecht über zwei Löchern.",
    },
    {
      sortOrder: 9,
      field: "body_en",
      from: `The LED has two legs of different length: LONG is plus (+), SHORT is minus (−). Plug the long leg into column 21 (row a) — same hole as the right resistor leg. Plug the short leg into column 22 (row a). The LED now stands upright over two holes.`,
      to: `The LED has two legs of different length: LONG is plus (+), SHORT is minus (−). Plug the long leg into column 28 (row a) — same hole as the right resistor leg. Plug the short leg into column 29 (row a). The LED now stands upright over two holes.`,
    },

    // === Step 10 (BUILD 3: Zwei GND-Kabel) — Spalte 22→29, Spalte 2 untere → Reihe i Spalte 14 ===
    {
      sortOrder: 10,
      field: "body_de",
      from: `Du brauchst zwei blaue Jumper-Kabel. Erstes Kabel: vom kurzen LED-Beinchen (Spalte 22) zur BLAUEN Minus-Schiene ganz unten. Zweites Kabel: vom GND-Pin am ESP32 (Spalte 2, untere Pin-Reihe) auch zur Minus-Schiene. Jetzt ist der Stromkreis geschlossen: GPIO 2 → Widerstand → LED → Minus-Schiene → GND.`,
      to: `Du brauchst zwei Jumper-Kabel (gerne blau für Minus). Erstes Kabel: vom kurzen LED-Beinchen (Spalte 29) zur BLAUEN Minus-Schiene ganz unten. Zweites Kabel: vom GND-Pin am ESP32 (Reihe i, Spalte 14 — Pin ist mit „GND" beschriftet, mittig auf der unteren Pin-Reihe) auch zur Minus-Schiene. Jetzt ist der Stromkreis geschlossen: GPIO 2 → Widerstand → LED → Minus-Schiene → GND.`,
    },
    {
      sortOrder: 10,
      field: "body_en",
      from: `You need two blue jumper wires. First wire: from the short LED leg (column 22) down to the BLUE minus rail at the bottom. Second wire: from the GND pin on the ESP32 (column 2, lower pin row) also to the minus rail. The circuit is now closed: GPIO 2 → resistor → LED → minus rail → GND.`,
      to: `You need two jumper wires (blue is nice for minus). First wire: from the short LED leg (column 29) down to the BLUE minus rail at the bottom. Second wire: from the GND pin on the ESP32 (row i, column 14 — pin labeled „GND", in the middle of the lower pin row) also to the minus rail. The circuit is now closed: GPIO 2 → resistor → LED → minus rail → GND.`,
    },
  ];

  let appliedCount = 0;
  let skippedCount = 0;

  for (const u of updates) {
    const step = lesson.steps.find((s) => s.sortOrder === u.sortOrder);
    if (!step) {
      console.log(`  ⚠ Step sortOrder=${u.sortOrder} nicht gefunden — skip`);
      continue;
    }
    const currentValue = (step as unknown as Record<string, string>)[u.field];
    if (currentValue === u.to) {
      console.log(`  ⊘ Step ${u.sortOrder}.${u.field}: bereits aktuell (idempotent)`);
      skippedCount++;
      continue;
    }
    if (currentValue !== u.from) {
      console.log(
        `  ⚠ Step ${u.sortOrder}.${u.field}: Quell-Text stimmt nicht überein — manueller Check nötig.\n` +
          `    Erwartet (Anfang): ${u.from.slice(0, 80)}…\n` +
          `    Aktuell  (Anfang): ${currentValue?.slice(0, 80) ?? "(null)"}…`,
      );
      continue;
    }
    await prisma.lessonStep.update({
      where: { id: step.id },
      data: { [u.field]: u.to },
    });
    console.log(`  ✓ Step ${u.sortOrder}.${u.field}: aktualisiert`);
    appliedCount++;
  }

  console.log(`\nFertig — ${appliedCount} Updates angewendet, ${skippedCount} idempotent übersprungen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
