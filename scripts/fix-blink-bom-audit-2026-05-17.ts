// BOM-Fixes für Blink-Lesson:
// - Jumper-Kabel: Komponenten-Name + Kurzbeschreibung präzisieren (M2M = Stecker-Stecker)
// - BOMItem-Note pro Lesson: Anzahl + Farbe explizit (1× grün, 2× blau)
// - USB-Datenkabel zur BOM hinzufügen (war in SETUP-Step erwähnt, aber nicht in der Stückliste)
// Idempotent.

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

  // 1) Component „jumper-wires-mm" — eindeutiger Name + Beschreibung
  await prisma.component.update({
    where: { slug: "jumper-wires-mm" },
    data: {
      name: "Jumper-Kabel M2M (Stecker-Stecker)",
      descriptionShort_de:
        "Männlich-Männlich Steckbrücken, 10–20 cm. Für ESP32 → Steckbrett brauchst du genau diesen Typ.",
      descriptionShort_en:
        "Male-to-male breadboard jumper wires, 10–20 cm. The ESP32 → breadboard build uses exactly this type.",
      description_de:
        "Steckbrücken mit Stiften auf beiden Seiten. Damit verbindest du ESP32-Pins mit dem Steckbrett. " +
        "Es gibt auch M2F (Stecker-Buchse) und F2F (Buchse-Buchse) — die brauchst du HIER nicht. " +
        "In der Praxis kauft man meist ein Sortiment mit allen drei Typen.",
      description_en:
        "Breadboard jumper wires with pins on both sides. Used to connect ESP32 pins to the breadboard. " +
        "There are also M2F (male-to-female) and F2F (female-to-female) variants — you do NOT need them for this lesson. " +
        "It's common to buy a kit with all three types.",
    },
  });
  console.log("[1] Component jumper-wires-mm: Beschreibung präzisiert");

  // 2) BOMItem-Note für die Jumper-Kabel: Farbcode explizit
  const bomJumper = await prisma.bOMItem.findFirst({
    where: {
      lessonId: lesson.id,
      component: { slug: "jumper-wires-mm" },
    },
    select: { id: true },
  });
  if (bomJumper) {
    await prisma.bOMItem.update({
      where: { id: bomJumper.id },
      data: {
        quantity: 3,
        note_de: "1× grün (Signal von GPIO 2) + 2× blau (GND-Verbindungen)",
        note_en: "1× green (signal from GPIO 2) + 2× blue (GND wiring)",
      },
    });
    console.log("[2] BOMItem jumper-wires: 3× (1 grün + 2 blau)");
  }

  // 3) USB-Datenkabel sicherstellen + zur Blink-BOM hinzufügen
  const usb = await prisma.component.upsert({
    where: { slug: "usb-data-cable-micro-usb" },
    update: {},
    create: {
      slug: "usb-data-cable-micro-usb",
      name: "USB-Datenkabel (Micro-USB)",
      category: "cable",
      iconKey: "Cable",
      logicLevel: "BOTH",
      voltageMin: 5,
      voltageMax: 5,
      description_de:
        "Standard-Micro-USB-Kabel zum Programmieren des ESP32 vom Computer aus. " +
        "Wichtig: muss DATEN übertragen, nicht nur Strom. Viele günstige Handy-Lade-Kabel " +
        "haben keine Datenleitung und funktionieren NICHT.",
      description_en:
        "Standard Micro-USB cable for programming the ESP32 from a computer. " +
        "Important: it must carry DATA, not just power. Many cheap phone charging " +
        "cables omit the data lines and will NOT work.",
      descriptionShort_de: "Zum Programmieren — muss Daten übertragen, kein reines Lade-Kabel.",
      descriptionShort_en: "For programming — must carry data, not just power.",
      levelHint: "L1_BEGINNER",
    },
  });

  const existingUsb = await prisma.bOMItem.findFirst({
    where: { lessonId: lesson.id, componentId: usb.id },
    select: { id: true },
  });
  if (!existingUsb) {
    await prisma.bOMItem.create({
      data: {
        lessonId: lesson.id,
        componentId: usb.id,
        quantity: 1,
        note_de: "Datenkabel, nicht nur Ladekabel — sonst erkennt der PC den ESP32 nicht.",
        note_en: "Data cable, not charge-only — otherwise your PC won't see the ESP32.",
      },
    });
    console.log("[3] BOMItem USB-Datenkabel hinzugefügt");
  } else {
    console.log("[3] BOMItem USB-Datenkabel war schon da");
  }

  console.log("\n✅ BOM-Audit angewendet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
