/**
 * Body-Texte präzisieren:
 *  - Step 3 "Das ist dein ESP32": USB ist im Esp32PinVisual OBEN (nicht links).
 *    Text korrigieren, Pin-Position-Sprache klären.
 *  - Step 7 "Was ist ein GPIO?": GPIO ausgeschrieben + übersetzt erklären.
 *  - Step 5 "Wie funktioniert das Steckbrett?": Body um Reihen-Schiene-Hinweise
 *    erweitern, jetzt da der Renderer alle Spalten beschriftet.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

interface StepFix {
  title_de: string;
  body_de?: string;
  body_en?: string;
  keyPoint_de?: string;
  keyPoint_en?: string;
}

const FIXES: StepFix[] = [
  {
    title_de: "Das ist dein ESP32",
    body_de:
      "Nimm den ESP32 in die Hand. Das ist ein winziger Computer — kleiner als eine Streichholzschachtel. Oben siehst du den Micro-USB-Anschluss (da kommt später dein Computer-Kabel rein). In der Mitte ist ein silbernes Kästchen — das ist das Gehirn (ESP-WROOM-32). Links und rechts siehst du zwei Reihen goldener Metall-Stifte: das sind die Pins. Jeder Pin hat einen Namen, der direkt daneben aufs Board gedruckt ist (z. B. 3V3, GND, D2). Über die Pins „spricht\" der ESP32 mit Lampen, Knöpfen und Sensoren.",
    body_en:
      "Pick up your ESP32. It's a tiny computer — smaller than a matchbox. At the top you see the Micro-USB port (that's where your computer cable goes later). In the middle there's a silver metal cap — that's the brain (ESP-WROOM-32). On the left and right you see two rows of golden metal pins: those are the I/O pins. Each pin has a name printed right next to it on the board (e.g. 3V3, GND, D2). The ESP32 talks to lamps, buttons, and sensors through these pins.",
    keyPoint_de:
      "Merke: Micro-USB oben = Stromanschluss. Goldene Stifte = Pins. Beschriftungen wie „D2\" oder „3V3\" sagen dir, wofür der Pin gut ist.",
    keyPoint_en:
      "Remember: Micro-USB on top = power input. Golden pins = the connectors. Labels like „D2\" or „3V3\" tell you what each pin is for.",
  },
  {
    title_de: "Wie funktioniert das Steckbrett?",
    body_de:
      "Die Zeilen heißen Buchstaben (a–j), die Spalten heißen Zahlen (1, 2, 3, …). So heißt das obere linke Loch z. B. a1. Wenn die Lektion sagt „steck das in c4\", findest du das Loch so: erst Buchstabe c (= 3. Zeile von oben), dann Spalte 4. WICHTIG: In jeder kurzen Spalte (5 Löcher übereinander, im Bild gelb markiert) sind die Löcher INNEN miteinander verbunden — steckst du zwei Beinchen in dieselbe Spalte, sind sie elektrisch eins. Oben läuft die rote Plus-Schiene (+), unten die blaue Minus-Schiene (−) jeweils über das ganze Brett.",
    body_en:
      "Rows are letters (a–j), columns are numbers (1, 2, 3, …). So the top-left hole is a1, for example. When the lesson says „plug this in c4\", here's how to find it: letter c (= 3rd row from the top), then column 4. IMPORTANT: in each short column (5 holes stacked, highlighted yellow), the holes are internally connected — two leads in the same short column become electrically one. The red plus-rail (+) runs across the top, the blue minus-rail (−) across the bottom.",
    keyPoint_de:
      "Merk dir: gleiche kurze Spalte = verbunden. Rote Schiene = Plus, blaue Schiene = Minus.",
    keyPoint_en:
      "Remember: same short column = connected. Red rail = plus, blue rail = minus.",
  },
  {
    title_de: "Was ist ein GPIO?",
    body_de:
      "GPIO ist die Abkürzung für „General Purpose Input/Output\" — auf Deutsch: Universal-Anschluss (mal Eingang, mal Ausgang). Heißt: dieser Pin kann entweder Strom RAUSGEBEN (z. B. eine LED ansteuern) oder Strom REINKOMMEN lesen (z. B. ob ein Knopf gedrückt ist). Jeder GPIO-Pin hat eine Nummer, die direkt aufs Board gedruckt ist. Wir benutzen GPIO 2 — das ist auf deinem Board oft als „D2\" oder „IO2\" beschriftet. Daran schließen wir gleich die LED an.",
    body_en:
      "GPIO is short for „General Purpose Input/Output\". It means: this pin can either OUTPUT current (e.g. drive an LED) or READ incoming current (e.g. whether a button is pressed). Every GPIO pin has a number printed on the board. We'll use GPIO 2 — on your board this might be labeled „D2\" or „IO2\". That's where we'll wire the LED.",
    keyPoint_de:
      "Wichtig: in unserem Code und in den Bildern sagen wir immer „GPIO 2\". Auf deinem Board steht „D2\" oder „IO2\" — alles derselbe Pin.",
    keyPoint_en:
      "Important: in our code and visuals we always say „GPIO 2\". On your board it might say „D2\" or „IO2\" — same pin.",
  },
];

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) throw new Error(`Lesson ${LESSON_SLUG} not found.`);

  for (const fix of FIXES) {
    const step = await prisma.lessonStep.findFirst({
      where: { lessonId: lesson.id, title_de: fix.title_de },
      select: { id: true, payload: true, sortOrder: true },
    });
    if (!step) {
      console.warn(`Step "${fix.title_de}" nicht gefunden.`);
      continue;
    }
    const oldPayload = (step.payload as Record<string, unknown> | null) ?? {};
    const newPayload: Record<string, unknown> = { ...oldPayload };
    if (fix.keyPoint_de !== undefined) newPayload.keyPoint_de = fix.keyPoint_de;
    if (fix.keyPoint_en !== undefined) newPayload.keyPoint_en = fix.keyPoint_en;

    const updateData: Record<string, unknown> = {
      payload: newPayload as Prisma.InputJsonValue,
    };
    if (fix.body_de !== undefined) updateData.body_de = fix.body_de;
    if (fix.body_en !== undefined) updateData.body_en = fix.body_en;

    await prisma.lessonStep.update({ where: { id: step.id }, data: updateData });
    console.log(`✅ Step ${step.sortOrder} „${fix.title_de}" aktualisiert.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
