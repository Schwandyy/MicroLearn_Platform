/**
 * Erweitert die Blink-Lesson um Anfänger-EXPLAIN-Steps:
 *   3 (NEU): Das ist dein ESP32          → highlightPin: GPIO2 (Esp32PinVisual)
 *   4 (NEU): Das ist dein Steckbrett     → breadboardVariant: boardOnly
 *   5 (alt 4): Wie funktioniert das Steckbrett?
 *   6 (NEU): So setzt du den ESP32 ein   → breadboardVariant: insertHint
 *   7 (alt 3): Was ist ein GPIO?
 *   8+ (alte 5+): unverändert, nur sortOrder verschoben
 *
 * Reihenfolge danach: ESP-Hardware → Brett-Plastik → Brett-Logik →
 *   ESP einstecken → GPIO 2 finden → Bauteile stecken.
 */

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

  // Schon ausgeführt? Wir erkennen das an einem Step mit Titel
  // „Das ist dein ESP32" auf sortOrder 3.
  const existingMarker = await prisma.lessonStep.findFirst({
    where: { lessonId: lesson.id, sortOrder: 3, title_de: "Das ist dein ESP32" },
    select: { id: true },
  });
  if (existingMarker) {
    console.log("Steps wurden bereits eingefügt — Skript ist idempotent, nichts zu tun.");
    return;
  }

  // ---- Phase 1: bestehende Steps mit sortOrder >= 3 auf temp-Slot (+1000)
  // verschieben, damit unique-(lessonId, sortOrder) nicht knallt.
  const toShift = await prisma.lessonStep.findMany({
    where: { lessonId: lesson.id, sortOrder: { gte: 3 } },
    select: { id: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  for (const s of toShift) {
    await prisma.lessonStep.update({
      where: { id: s.id },
      data: { sortOrder: s.sortOrder + 1000 },
    });
  }

  // ---- Phase 2: neue sortOrders festlegen
  // alt → neu
  const remap: Record<number, number> = {
    3: 7, // Was ist ein GPIO? → später, nach allen Brett-Erklärungen
    4: 5, // Wie funktioniert das Steckbrett? → bleibt Teil der Brett-Sequenz
    5: 8, 6: 9, 7: 10, // BUILD-Steps → +3
    8: 11, // EXPLAIN Warum Widerstand → +3
  };
  for (const s of toShift) {
    const newOrder = remap[s.sortOrder] ?? s.sortOrder - 1000 + 3; // sonst pauschal +3
    await prisma.lessonStep.update({
      where: { id: s.id },
      data: { sortOrder: newOrder },
    });
  }

  // ---- Phase 3: 3 neue EXPLAIN-Steps einfügen
  const newSteps: Array<Prisma.LessonStepUncheckedCreateInput> = [
    {
      lessonId: lesson.id,
      sortOrder: 3,
      kind: "EXPLAIN",
      title_de: "Das ist dein ESP32",
      title_en: "This is your ESP32",
      body_de:
        "Nimm den ESP32 in die Hand. Das ist ein winziger Computer — kleiner als eine Streichholzschachtel. Links siehst du den USB-Anschluss (da kommt später dein Computer-Kabel rein). In der Mitte ist ein silbernes Kästchen — das ist das Gehirn (ESP-WROOM-32). Rechts und links unten siehst du eine Reihe goldener Metall-Stifte: das sind die Pins. Über die Pins „spricht\" der ESP32 mit Lampen, Knöpfen und Sensoren.",
      body_en:
        "Pick up your ESP32. It's a tiny computer — smaller than a matchbox. On the left you see the USB port (that's where your computer cable goes later). In the middle there's a silver metal cap — that's the brain (ESP-WROOM-32). At the top and bottom you see two rows of golden metal pins: those are the I/O pins. The ESP32 talks to lamps, buttons, and sensors through these pins.",
      payload: {
        highlightPin: "GPIO2",
        keyPoint_de:
          "Merke: USB links = Stromanschluss. Goldene Stifte = Pins (Anschlüsse für Strom & Signale).",
        keyPoint_en:
          "Remember: USB on the left = power input. Golden metal pins = the connectors for power and signals.",
      } as Prisma.InputJsonValue,
    },
    {
      lessonId: lesson.id,
      sortOrder: 4,
      kind: "EXPLAIN",
      title_de: "Das ist dein Steckbrett",
      title_en: "This is your breadboard",
      body_de:
        "Das Steckbrett ist eine Plastikplatte voller Löcher. Du kannst hier Bauteile EINSTECKEN — kein Löten, kein Werkzeug nötig. Es ist wie ein Prototypen-Spielfeld: einstecken, ausprobieren, umstecken. Oben und unten siehst du eine ROTE und eine BLAUE Linie — das sind Strom-Schienen für Plus (+) und Minus (−). Dazwischen sind viele kleine Löcher in Reihen.",
      body_en:
        "The breadboard is a plastic board full of holes. You can PLUG IN parts here — no soldering, no tools needed. It's like a prototype playground: plug, try, re-plug. At the top and bottom you see a RED and a BLUE line — those are the power rails for plus (+) and minus (−). In between are lots of little holes in rows.",
      payload: {
        breadboardVariant: "boardOnly",
        keyPoint_de:
          "Merke: Du brauchst kein Löten. Einfach stecken — falsch gesteckt? Rausziehen, neu stecken.",
        keyPoint_en:
          "Remember: no soldering needed. Just plug — wrong spot? Pull out, plug again.",
      } as Prisma.InputJsonValue,
    },
    {
      lessonId: lesson.id,
      sortOrder: 6,
      kind: "EXPLAIN",
      title_de: "So setzt du den ESP32 ins Steckbrett",
      title_en: "How to plug the ESP32 into the breadboard",
      body_de:
        "Halte den ESP32 mit dem USB-Anschluss NACH LINKS. Die zwei Pin-Reihen müssen über die MITTLERE RILLE des Steckbretts gehen — eine Reihe oben (Reihe e), eine Reihe unten (Reihe f). Setze ihn vorsichtig drauf, sodass alle 30 Pins genau in 30 Löcher zeigen. Dann drück mittig und gleichmäßig nach unten, bis die Pins ganz im Brett stecken. Tipp: lieber langsam und beidseitig drücken — sonst verbiegen sich Pins.",
      body_en:
        "Hold the ESP32 with the USB port pointing LEFT. The two pin rows must straddle the CENTER CHANNEL of the breadboard — one row on top (row e), one row on bottom (row f). Place it down carefully so all 30 pins line up with 30 holes. Then press straight down evenly until the pins seat fully. Tip: go slow and press on both sides — uneven pressure bends pins.",
      payload: {
        breadboardVariant: "insertHint",
        keyPoint_de:
          "Wichtig: USB-Anschluss schaut nach LINKS, Pin-Reihen ÜBER die Mittelrille. Nie einseitig drücken.",
        keyPoint_en:
          "Important: USB faces LEFT, pin rows straddle the center channel. Never press only on one side.",
      } as Prisma.InputJsonValue,
    },
  ];

  for (const step of newSteps) {
    await prisma.lessonStep.create({ data: step });
    console.log(`[NEW sortOrder=${step.sortOrder}] ${step.title_de}`);
  }

  // ---- Phase 4: Status-Report
  const finalSteps = await prisma.lessonStep.findMany({
    where: { lessonId: lesson.id },
    select: { sortOrder: true, kind: true, title_de: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("\n✅ Lesson-Reihenfolge danach:\n");
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
