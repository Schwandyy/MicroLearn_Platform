/**
 * CEO-Audit-Fixes für die Blink-Lesson:
 *  Bug 1: Step 1 PARTS hat **Markdown**-Klingen im Body, werden literal angezeigt.
 *  Bug 2: Step 5 "Wie funktioniert das Steckbrett?" ist breadboardVariant=boardOnly
 *         — sollte boardWithHighlight sein (sonst keine Spalten-Highlight + Erklär-Pille).
 *  Bug 3: Step 14 SIMULATE Body sagt "Simulation starten" — Button-Label im
 *         MiniSimulator ist aber "Programm starten" (i18n key runProgram).
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

async function setStepFields(args: {
  title_de: string;
  body_de?: string;
  body_en?: string;
  payloadPatch?: Record<string, unknown>;
  payloadDelete?: string[];
}) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) throw new Error("Lesson nicht gefunden");
  const step = await prisma.lessonStep.findFirst({
    where: { lessonId: lesson.id, title_de: args.title_de },
    select: { id: true, sortOrder: true, payload: true },
  });
  if (!step) {
    console.warn(`Step „${args.title_de}" nicht gefunden`);
    return;
  }
  const oldPayload = (step.payload as Record<string, unknown> | null) ?? {};
  const newPayload: Record<string, unknown> = { ...oldPayload, ...(args.payloadPatch ?? {}) };
  for (const k of args.payloadDelete ?? []) delete newPayload[k];
  const data: Record<string, unknown> = {
    payload: newPayload as Prisma.InputJsonValue,
  };
  if (args.body_de !== undefined) data.body_de = args.body_de;
  if (args.body_en !== undefined) data.body_en = args.body_en;
  await prisma.lessonStep.update({ where: { id: step.id }, data });
  console.log(`✅ Step ${step.sortOrder} „${args.title_de}" aktualisiert.`);
}

async function main() {
  // Bug 1: PARTS body ohne Markdown
  await setStepFields({
    title_de: "Das brauchst du",
    body_de:
      "Wichtig vorab: Du brauchst einen Computer (Windows, Mac oder Linux) und ein USB-Datenkabel. Smartphone oder Tablet funktionieren leider nicht — du wirst den Code später vom Computer auf den ESP32 spielen. Alle Teile bekommst du bei den üblichen Elektronik-Händlern (Reichelt, AZ-Delivery, Conrad, Mouser). Wir verlinken pro Teil zur passenden Seite.",
    body_en:
      "Heads-up: You'll need a computer (Windows, Mac or Linux) and a USB data cable. Phones and tablets won't work — you'll upload the code from the computer to the ESP32. All parts are available from standard electronics retailers (Reichelt, AZ-Delivery, Conrad, Mouser). We link to a fitting page per part.",
  });

  // Bug 2: Step 5 auf boardWithHighlight
  await setStepFields({
    title_de: "Wie funktioniert das Steckbrett?",
    payloadPatch: { breadboardVariant: "boardWithHighlight" },
  });

  // Bug 3: Step 14 SIMULATE Body Button-Label
  await setStepFields({
    title_de: "So sollte es aussehen",
    body_de:
      "Drück auf „Programm starten\" — die LED im Bild fängt an zu blinken, genau wie sie es auf deinem echten ESP32 tun würde. Probier auch die anderen GND-Optionen aus: was passiert, wenn das blaue Kabel nirgends steckt oder am Plus statt am Minus?",
    body_en:
      "Hit „Run program\" — the LED in the picture starts blinking, exactly the way your real ESP32 would. Try the other GND options too: what happens when the blue wire is unplugged or sits on plus instead of minus?",
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
