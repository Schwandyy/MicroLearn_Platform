/**
 * Body-Texte der BUILD-Steps neu — Anfänger-Sprache, ohne Markdown-Klingen,
 * mit den KORREKTEN Spalten-Nummern für den blink-schematic-Renderer
 * (Widerstand: Spalte 18→21, LED: Spalte 21→22, GND: Minus-Schiene + Spalte 2).
 *
 * Vorher waren die Texte:
 *  - voller `**bold**`-Markdown (wird nicht gerendert → Sternchen sichtbar)
 *  - mit der ALTEN Spalten-Logik (5/8/9) aus dem breadboard-svg-Renderer
 *  - voller Wiederholungen aus früheren Steps (ESP einstecken etc.)
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

interface StepUpdate {
  title_de: string;
  body_de: string;
  body_en: string;
  instruction_de: string;
  instruction_en: string;
}

const UPDATES: StepUpdate[] = [
  {
    title_de: "Schritt 1: Widerstand stecken",
    body_de:
      "Im Bild siehst du zwei pulsierende Punkte mit gelben Labels „Spalte 18\" und „Spalte 21\" — rechts vom ESP32, auf Reihe a. Steck den Widerstand mit je einem Beinchen in diese beiden Löcher. Der Widerstand liegt dann waagerecht und überspannt drei Lücken. Ein Widerstand hat keine Richtung — beide Seiten sind gleich.",
    body_en:
      "In the picture you see two pulsing dots labeled „Column 18\" and „Column 21\" — to the right of the ESP32, on row a. Plug one leg of the resistor into each hole. The resistor sits horizontally, bridging three gaps. A resistor has no direction — either way works.",
    instruction_de:
      "Such in deiner Tüte den Widerstand mit den Farbringen Rot–Rot–Braun (220 Ω). Beinchen vorsichtig leicht biegen, wenn sie zu lang sind — nicht knicken.",
    instruction_en:
      "Find the resistor with color rings Red–Red–Brown (220 Ω) in your kit. Gently bend the legs if they're too long — don't kink them.",
  },
  {
    title_de: "Schritt 2: LED stecken",
    body_de:
      "Die LED hat zwei verschieden lange Beinchen: das LANGE ist Plus (+), das KURZE ist Minus (−). Das lange Beinchen steckst du in Spalte 21 (Reihe a) — genau dasselbe Loch wie das rechte Widerstandsbeinchen. Das kurze Beinchen kommt in Spalte 22 (Reihe a). Die LED steht jetzt aufrecht über zwei Löchern.",
    body_en:
      "The LED has two legs of different length: LONG is plus (+), SHORT is minus (−). Plug the long leg into column 21 (row a) — same hole as the right resistor leg. Plug the short leg into column 22 (row a). The LED now stands upright over two holes.",
    instruction_de:
      "Falsch herum gesteckt? Macht nichts — die LED bleibt einfach dunkel und geht nicht kaputt. Einfach rausziehen und umdrehen.",
    instruction_en:
      "Plugged in backwards? No worries — the LED just stays dark and doesn't break. Pull it out and flip it.",
  },
  {
    title_de: "Schritt 3: Zwei GND-Kabel",
    body_de:
      "Du brauchst zwei blaue Jumper-Kabel. Erstes Kabel: vom kurzen LED-Beinchen (Spalte 22) zur BLAUEN Minus-Schiene ganz unten. Zweites Kabel: vom GND-Pin am ESP32 (Spalte 2, untere Pin-Reihe) auch zur Minus-Schiene. Jetzt ist der Stromkreis geschlossen: GPIO 2 → Widerstand → LED → Minus-Schiene → GND.",
    body_en:
      "You need two blue jumper wires. First wire: from the short LED leg (column 22) down to the BLUE minus rail at the bottom. Second wire: from the GND pin on the ESP32 (column 2, lower pin row) also to the minus rail. The circuit is now closed: GPIO 2 → resistor → LED → minus rail → GND.",
    instruction_de:
      "Blau ist nur eine Farbe-Hilfe — jeder Jumper funktioniert. Wichtig ist nur, dass beide Kabel-Enden fest in den Löchern stecken.",
    instruction_en:
      "Blue is just a color hint — any jumper works. What matters: both wire ends must be seated firmly in the holes.",
  },
];

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) throw new Error(`Lesson ${LESSON_SLUG} not found.`);

  for (const upd of UPDATES) {
    const step = await prisma.lessonStep.findFirst({
      where: { lessonId: lesson.id, title_de: upd.title_de },
      select: { id: true, payload: true, sortOrder: true },
    });
    if (!step) {
      console.warn(`Step "${upd.title_de}" nicht gefunden — übersprungen.`);
      continue;
    }
    const oldPayload = (step.payload as Record<string, unknown> | null) ?? {};
    const newPayload: Record<string, unknown> = {
      ...oldPayload,
      instruction_de: upd.instruction_de,
      instruction_en: upd.instruction_en,
    };
    await prisma.lessonStep.update({
      where: { id: step.id },
      data: {
        body_de: upd.body_de,
        body_en: upd.body_en,
        payload: newPayload as Prisma.InputJsonValue,
      },
    });
    console.log(`✅ Step ${step.sortOrder} „${upd.title_de}" aktualisiert.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
