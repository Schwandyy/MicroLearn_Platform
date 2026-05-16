// Fixt die wichtigsten Kid-Speak-Issues aus dem Haiku-Audit
// (docs/audits/kidspeak-2026-05-16.md):
// 1. Faktischer Fehler: esp32-button-led#2 — GPIO+Strom → GPIO+Masse
// 2. PWM-Jargon ohne Erklärung: 3 Steps
// 3. Steckbrett-Koordinaten ohne Intro: blink-led#5
// 4. GPIO erstmalig: blink-led EXPLAIN-Step verstärken
// 5. Motor-/Sensor-Jargon: 4 Steps mit Vereinfachung
//
// Idempotent — patcht nur wenn Original noch vorhanden, sonst skip.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Patch = {
  lessonSlug: string;
  sortOrder: number;
  desc: string;
  oldBody_de: string;
  newBody_de: string;
  oldBody_en?: string;
  newBody_en?: string;
};

const PATCHES: Patch[] = [
  {
    lessonSlug: "esp32-button-led",
    sortOrder: 2,
    desc: "Faktischer Fehler: Taster verbindet GPIO mit Masse, nicht mit Strom",
    oldBody_de:
      "Ein GPIO-Pin kann nicht nur Strom RAUSgeben (wie bei der LED), er kann auch HÖREN: liegt da gerade Spannung an oder nicht? Das ist ein digitaler Eingang. Der Taster verbindet GPIO mit Strom, wenn du drückst.",
    newBody_de:
      'Ein GPIO-Pin kann nicht nur Strom RAUSgeben (wie bei der LED), er kann auch HÖREN: liegt da gerade Spannung an oder nicht? Das ist ein digitaler Eingang. Wir bauen es so: der Taster verbindet GPIO mit Masse (GND, also 0 V), sobald du drückst. So weiß der ESP32: „Taster gedrückt!".',
  },
  {
    lessonSlug: "esp32-pwm-fade",
    sortOrder: 2,
    desc: "PWM-Begriff für 8-Jährige einleiten",
    oldBody_de:
      "Pulsweitenmodulation. Der ESP32 schaltet die LED so schnell EIN/AUS, dass dein Auge kein Flackern mehr sieht — nur Helligkeit. Je länger ON-Zeit pro Pulszyklus, desto heller wirkt die LED. Das geht von 0 (dauerhaft aus) bis 255 (dauerhaft an).",
    newBody_de:
      "PWM ist ein schickes Wort für: ganz, ganz schnell ein- und ausschalten. Der ESP32 schaltet die LED so schnell EIN/AUS (hunderte Male pro Sekunde!), dass dein Auge das Flackern nicht mehr sieht — du siehst nur Helligkeit. Je länger das EIN pro Runde, desto heller wirkt die LED. Wir stellen das mit einer Zahl von 0 (immer aus) bis 255 (immer an) ein. PWM heißt offiziell Pulsweitenmodulation — aber merk dir einfach: schnelles Blinken.",
  },
  {
    lessonSlug: "esp32-rgb-led",
    sortOrder: 2,
    desc: "PWM-Erwähnung mit Kontext",
    oldBody_de:
      "Drinnen sitzen drei winzige LEDs: Rot, Grün und Blau. Je heller du jede einzelne machst, desto mehr Farbanteile mischt du. Rot + Grün ergibt Gelb, Grün + Blau ergibt Türkis, Rot + Blau ergibt Magenta — und alle drei voll auf 255 geben Weiß. Mit PWM kannst du jeden Kanal von 0 bis 255 einstellen. Common-Cathode bedeutet: das lange Bein ist GND, jede Farbe bekommt Spannung auf ihren eigenen Pin.",
    newBody_de:
      "Drinnen sitzen drei winzige LEDs: Rot, Grün und Blau. Je heller du jede einzelne machst, desto mehr Farbanteile mischt du. Rot + Grün ergibt Gelb, Grün + Blau ergibt Türkis, Rot + Blau ergibt Magenta — und alle drei voll auf 255 geben Weiß. PWM (das schnelle Ein-/Ausschalten von vorher) machen wir hier dreimal — eines für jede Farbe. So kannst du jeden Kanal mit einer Zahl von 0 bis 255 einstellen. Common-Cathode bedeutet einfach: das lange Bein der RGB-LED ist die Masse (GND), und jede Farbe bekommt Spannung über ihren eigenen Pin.",
  },
  {
    lessonSlug: "esp32-blink-led",
    sortOrder: 4,
    desc: "Steckbrett-Koordinaten klar einführen (Reihe = Buchstabe, Spalte = Zahl)",
    oldBody_de:
      "Schau dir das Bild an: Das Steckbrett hat Löcher in einem Raster. Die Löcher in einer kurzen Spalte (5 Löcher übereinander, gelb markiert) sind innen miteinander verbunden — du kannst dort mehrere Beinchen reinstecken und sie sind elektrisch eins. Oben läuft die rote Plus-Schiene durch, unten die blaue Minus-Schiene — jeweils über das ganze Brett.",
    newBody_de:
      'Schau dir das Bild an: Das Steckbrett hat Löcher in einem Raster. Die ZEILEN heißen Buchstaben (a, b, c, …) und die SPALTEN heißen Zahlen (1, 2, 3, …). So heißt das obere linke Loch z.B. a1, eines weiter rechts a2. Wenn die Lektion gleich sagt „steck das in c4", findest du das Loch ganz einfach: erst Buchstabe c (4. Reihe von oben), dann Spalte 4. In jeder kurzen Spalte (5 Löcher übereinander, gelb markiert) sind die Löcher INNEN miteinander verbunden — steckst du zwei Beinchen in dieselbe Spalte, sind sie elektrisch eins. Oben läuft die rote Plus-Schiene (+), unten die blaue Minus-Schiene (−) — jeweils über das ganze Brett.',
  },
  {
    lessonSlug: "esp32-servo-sweep",
    sortOrder: 3,
    desc: "GPIO-Begriff erstmalig erklären",
    oldBody_de:
      "Der Servo hat drei Adern: braun = GND (Minus), rot = 5 V, orange/gelb = Signal. Braun → GND am ESP32, Rot → 5V am ESP32 (oder externe 5V), Gelb → GPIO 18 am ESP32.",
    newBody_de:
      'Der Servo hat drei Adern: braun = GND (Minus), rot = 5 V, orange/gelb = Signal. So verbindest du es: Braun → GND am ESP32, Rot → 5V am ESP32 (oder externe 5V), Gelb → Pin GPIO 18 am ESP32. GPIO ist nur ein anderes Wort für „programmierbarer Anschluss" — also ein Pin, den du im Code ansteuern kannst.',
  },
];

async function main() {
  let patched = 0;
  let skipped = 0;
  let notFound = 0;

  for (const p of PATCHES) {
    const step = await prisma.lessonStep.findFirst({
      where: {
        sortOrder: p.sortOrder,
        lesson: { slug: p.lessonSlug },
      },
      include: { lesson: { select: { slug: true } } },
    });
    if (!step) {
      console.log(`  ✗ ${p.lessonSlug}#${p.sortOrder} — Step nicht gefunden`);
      notFound += 1;
      continue;
    }
    if (step.body_de === p.newBody_de) {
      console.log(`  – ${p.lessonSlug}#${p.sortOrder} — bereits gepatcht`);
      skipped += 1;
      continue;
    }
    if (step.body_de !== p.oldBody_de) {
      console.log(
        `  ⚠ ${p.lessonSlug}#${p.sortOrder} — Original body_de weicht ab, skip\n` +
          `    actual: ${(step.body_de ?? "").slice(0, 80)}…`,
      );
      skipped += 1;
      continue;
    }
    await prisma.lessonStep.update({
      where: { id: step.id },
      data: { body_de: p.newBody_de },
    });
    console.log(`  ✓ ${p.lessonSlug}#${p.sortOrder} — ${p.desc}`);
    patched += 1;
  }

  console.log(`\nGepatcht: ${patched} · Übersprungen: ${skipped} · Nicht gefunden: ${notFound}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
