/**
 * Sprint 9.2 BOM-Fix: 38-Pin ESP32 braucht F2M-Jumper, nicht nur M2M.
 *
 * Hintergrund: AZ-Delivery 38-Pin ESP32 DevKit V1 ist 22.86 mm breit
 * (Pin-Header-Spannweite Reihe a → Reihe i). PCB-Körper deckt die inneren
 * Brett-Spalten (Reihen b-h) ab, sodass M2M-Jumper an ESP-Pins physisch
 * nicht einsteckbar sind — die Spalten-Löcher sind unter dem Modul.
 * Lösung: F2M-Jumper (weibliches Ende auf den ESP-Pin oben drauf,
 * männliches Ende ins freie Brett-Loch).
 *
 * Component „jumper-wires-mm" bekommt:
 *   • Name: „Jumper-Kabel-Set (M2M + F2M + F2F)"
 *   • Beschreibung erklärt F2M-Notwendigkeit für 38-Pin ESP
 *
 * Idempotent.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const component = await prisma.component.findUnique({
    where: { slug: "jumper-wires-mm" },
  });
  if (!component) {
    console.log("Component jumper-wires-mm nicht gefunden — skip");
    return;
  }

  const newName = "Jumper-Kabel-Set (M2M + F2M + F2F)";
  const newDescriptionDe = `Jumper-Kabel mit drei Varianten:
  • M2M (Stecker–Stecker) — fürs Steckbrett selbst (z. B. LED-Kathode zur Minus-Schiene).
  • F2M (Buchse–Stecker) — UNERLÄSSLICH für den 38-Pin ESP32: weibliches Ende auf den ESP-Pin oben drauf gesteckt, männliches Ende ins freie Brett-Loch. M2M geht hier nicht, weil das ESP-Modul die Spalten-Löcher unter dem PCB-Körper abdeckt.
  • F2F (Buchse–Buchse) — für Sensor-Module mit Buchsenleisten.

Tipp: kauf direkt das 120er-Set, dann hast du alle drei Typen — bei jeder Lesson hast du genug Kabel jeder Sorte und musst nicht nachbestellen.`;

  const newDescriptionEn = `Jumper wires in three variants:
  • M-M (male–male) — for the breadboard itself (e.g. LED cathode to minus rail).
  • F-M (female–male) — REQUIRED for the 38-pin ESP32: female end onto the ESP pin, male end into a free breadboard hole. M-M won't work here because the ESP module covers the column holes under its PCB.
  • F-F (female–female) — for sensor modules with female headers.

Tip: buy the 120-piece assortment directly — you'll have all three types on hand for every lesson and won't need to re-order.`;

  const newShortDe = "Set mit allen drei Typen (M2M, F2M, F2F) — für 38-Pin ESP32 ist F2M Pflicht.";
  const newShortEn = "Set with all three types (M-M, F-M, F-F) — F-M is mandatory for the 38-pin ESP32.";

  const needsUpdate =
    component.name !== newName ||
    component.description_de !== newDescriptionDe ||
    component.description_en !== newDescriptionEn ||
    component.descriptionShort_de !== newShortDe ||
    component.descriptionShort_en !== newShortEn;

  if (!needsUpdate) {
    console.log("  ⊘ Component jumper-wires-mm: bereits aktuell (idempotent)");
  } else {
    await prisma.component.update({
      where: { id: component.id },
      data: {
        name: newName,
        description_de: newDescriptionDe,
        description_en: newDescriptionEn,
        descriptionShort_de: newShortDe,
        descriptionShort_en: newShortEn,
      },
    });
    console.log("  ✓ Component jumper-wires-mm: Name + Beschreibung aktualisiert");
  }

  // BOMItem-Note ergänzen (optional pro Lesson-Hinweis)
  const blinkLesson = await prisma.lesson.findUnique({
    where: { slug: "esp32-blink-led" },
  });
  if (blinkLesson) {
    const bomItem = await prisma.bOMItem.findFirst({
      where: { lessonId: blinkLesson.id, componentId: component.id },
    });
    if (bomItem) {
      const noteDe = "Wichtig: für den 38-Pin ESP32 brauchst du F2M-Kabel (Buchse-Stecker). M2M reicht hier NICHT.";
      const noteEn = "Important: for the 38-pin ESP32 you need F-M cables (female-male). M-M is NOT enough.";
      if (bomItem.note_de !== noteDe || bomItem.note_en !== noteEn) {
        await prisma.bOMItem.update({
          where: { id: bomItem.id },
          data: { note_de: noteDe, note_en: noteEn },
        });
        console.log("  ✓ BOMItem (Blink): F2M-Hinweis ergänzt");
      } else {
        console.log("  ⊘ BOMItem (Blink): bereits aktuell");
      }
    }
  }

  console.log("\nFertig.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
