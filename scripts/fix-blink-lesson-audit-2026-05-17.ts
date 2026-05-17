// Audit-Fixes für die Blink-Lesson nach User-Review 2026-05-17:
// - Pin-Bezeichnung konsistent „GPIO 2" (nicht „Pin Nummer 2" oder „D2")
// - Jumper-Typ M2M in Build-Steps präzisiert
// - Blaues Kabel explizit erwähnt
// - USB-CP210x-Treiber-Link zeigt direkt auf den Download-Tab
// - PARTS-Step nennt mehrere Bezugsquellen statt nur AZ-Delivery
// Idempotent — kann mehrfach laufen.

import { PrismaClient } from "@prisma/client";

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

  // 1) PARTS-Step: weniger markenspezifisch
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 1, kind: "PARTS" },
    data: {
      body_de:
        "Wenn du etwas davon nicht hast, bekommst du alle Teile bei den üblichen Elektronik-Händlern " +
        "(z.B. Reichelt, AZ-Delivery, Conrad oder Mouser). Wir verlinken pro Teil direkt zur passenden Seite.",
      body_en:
        "If you're missing anything, all parts are available from standard electronics retailers " +
        "(e.g. Reichelt, AZ-Delivery, Conrad or Mouser). We link to a fitting product page for each part.",
    },
  });
  console.log("[1] PARTS-Step entschärft (mehrere Bezugsquellen)");

  // 2) EXPLAIN-Step „Was ist ein GPIO?" — konsistent GPIO 2
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 3, kind: "EXPLAIN" },
    data: {
      body_de:
        "Schau dir den ESP32 an: links und rechts sind viele kleine Metall-Stifte. Das nennt man Pins. " +
        "Jeder Pin hat eine Nummer, die direkt daneben aufs Board gedruckt ist. " +
        "GPIO bedeutet einfach: „dieser Pin kann Strom rein- oder rausgeben\". " +
        "Wir benutzen GPIO 2 — daran schließen wir gleich die LED an.",
      body_en:
        "Look at the ESP32: on the left and right are lots of small metal pins. Each pin has a number " +
        "printed next to it on the board. GPIO means: „this pin can send or receive power\". " +
        "We're going to use GPIO 2 — that's where we'll connect the LED.",
      payload: {
        highlightPin: "GPIO2",
        keyPoint_de:
          "Wichtig: in unserem Code und in den Bildern sagen wir immer GPIO 2. " +
          "Auf manchen Boards steht auf dem Aufdruck nur „D2\" oder „IO2\" — das ist derselbe Pin.",
        keyPoint_en:
          "Important: we always say GPIO 2 in code and diagrams. " +
          "Some boards print only „D2\" or „IO2\" on the silk-screen — it's the same pin.",
      },
    },
  });
  console.log("[2] EXPLAIN-Step: konsistent GPIO 2");

  // 3) BUILD Step 1 — Widerstand stecken: präzisieren, dass M2M-Jumper genutzt wird
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 5, kind: "BUILD" },
    data: {
      body_de:
        "Schau im Bild auf den gelb pulsierenden Punkt: das ist Reihe c, Spalte 4. " +
        "Steck dort ein Beinchen des Widerstands rein. Das andere Beinchen steckst du in Reihe c, Spalte 7. " +
        "So überbrückt der Widerstand zwei verschiedene Spalten — der Strom MUSS durch den Widerstand fließen, " +
        "um von Spalte 4 nach Spalte 7 zu kommen. " +
        "Das **grüne M2M-Jumper-Kabel** (Stecker-Stecker) verbindet GPIO 2 am ESP32 mit dem linken Widerstands-Beinchen (Spalte 4).",
      body_en:
        "Look for the yellow pulsing dot in the picture: row c, column 4. " +
        "Put one leg of the resistor there. The other leg goes into row c, column 7. " +
        "The resistor now bridges two columns — current must flow through the resistor to get from column 4 to column 7. " +
        "The **green M2M jumper wire** (male-to-male) connects GPIO 2 on the ESP32 to the left leg of the resistor (column 4).",
    },
  });
  console.log("[3] BUILD Step 1: M2M-Jumper präzisiert");

  // 4) BUILD Step 3 — Zwei GND-Kabel: M2M + Farben explizit
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 7, kind: "BUILD" },
    data: {
      body_de:
        "Jetzt fehlen zwei Verbindungen — beide gehen zur blauen Minus-Schiene unten. " +
        "Beide Kabel sind **M2M-Jumper** (Stecker-Stecker), je 5–10 cm lang.\n\n" +
        "**Kabel A (blau) — von der LED zur Minus-Schiene:** Ein Ende kommt in Reihe a, Spalte 9 " +
        "(also die gleiche Spalte wie das kurze LED-Beinchen). Das andere Ende in die blaue Minus-Schiene ganz unten. " +
        "Damit ist die LED-Kathode mit Minus verbunden.\n\n" +
        "**Kabel B (auch blau, kann aber jede andere Farbe sein) — vom ESP32 zur Minus-Schiene:** " +
        "Ein Ende an den GND-Pin am ESP32. Das andere Ende in irgendein Loch derselben blauen Minus-Schiene.\n\n" +
        "Jetzt fließt der Strom: GPIO 2 → Widerstand → langes LED-Beinchen → kurzes LED-Beinchen → Kabel A → " +
        "Minus-Schiene → Kabel B → GND. Stromkreis geschlossen.",
      body_en:
        "Two connections are missing — both go to the blue minus rail at the bottom. " +
        "Both wires are **M2M jumpers** (male-to-male), about 5–10 cm long.\n\n" +
        "**Wire A (blue) — from the LED to the minus rail:** One end into row a, column 9 " +
        "(same column as the short LED leg). The other end into the blue minus rail at the bottom. " +
        "This connects the LED cathode to minus.\n\n" +
        "**Wire B (also blue, any color is fine) — from the ESP32 to the minus rail:** " +
        "One end to the GND pin on the ESP32. The other end to any hole in the same blue minus rail.\n\n" +
        "Current now flows: GPIO 2 → resistor → long LED leg → short LED leg → wire A → minus rail → wire B → GND. " +
        "Circuit complete.",
    },
  });
  console.log("[4] BUILD Step 3: M2M + Farben explizit");

  // 5) SETUP-Step: USB-Treiber-Link direkt auf Downloads-Tab
  const setup = await prisma.lessonStep.findFirst({
    where: { lessonId: lesson.id, sortOrder: 9, kind: "SETUP" },
    select: { id: true, payload: true },
  });
  if (setup) {
    const payload = (setup.payload as Record<string, unknown> | null) ?? {};
    const checklist = Array.isArray(payload.checklist) ? [...payload.checklist] : [];
    const driverIndex = checklist.findIndex(
      (item: unknown) =>
        item != null &&
        typeof item === "object" &&
        "iconKey" in item &&
        (item as { iconKey?: string }).iconKey === "usb",
    );
    if (driverIndex >= 0) {
      const item = checklist[driverIndex] as Record<string, unknown>;
      const link = (item.link as Record<string, unknown> | undefined) ?? {};
      checklist[driverIndex] = {
        ...item,
        link: {
          ...link,
          url: "https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers?tab=downloads",
          label_de: "Direkt zum CP210x-Download bei Silicon Labs",
          label_en: "Direct download — CP210x VCP drivers (Silicon Labs)",
        },
        hint_de:
          "Damit dein Computer den ESP32 über USB erkennt. Wähle dort dein Betriebssystem " +
          "(Windows/macOS/Linux) und lade die ZIP-Datei. Auspacken → Installer ausführen. " +
          "Auf neueren Macs/PCs manchmal schon vorinstalliert.",
        hint_en:
          "So your computer can recognize the ESP32 via USB. Pick your OS (Windows/macOS/Linux), " +
          "download the ZIP, unzip, and run the installer. Some newer Macs/PCs already have it.",
      };
    }
    await prisma.lessonStep.update({
      where: { id: setup.id },
      data: { payload: { ...payload, checklist } },
    });
    console.log("[5] SETUP: CP210x-Direktlink gesetzt");
  }

  console.log("\n✅ Blink-Lesson-Audit-Fixes angewendet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
