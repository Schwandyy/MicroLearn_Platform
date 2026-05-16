// Idempotente Fixes für faktische Lesson-Bugs, gefunden im Fakten-Audit
// am 2026-05-16 via `scripts/audit-lesson-facts.ts`.
//
// Wenn ein Step bereits den korrigierten Text enthält, wird er übersprungen.
// Re-runnable, kein Schaden bei mehrfachem Lauf.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Patch = {
  lessonSlug: string;
  sortOrder: number;
  // Either replace the entire body / title, or skip if already contains marker.
  expectsMarker?: string;
  title_de?: string;
  title_en?: string;
  body_de?: string;
  body_en?: string;
  reason: string;
};

const patches: Patch[] = [
  // esp32-blink-led Step 5 (MAJOR pin-wiring):
  // alter Text behauptete "Beide Löcher sind in derselben kurzen Spalte".
  // c4 und c7 sind verschiedene Spalten — der Widerstand überbrückt sie.
  {
    lessonSlug: "esp32-blink-led",
    sortOrder: 5,
    expectsMarker: "überbrückt der Widerstand zwei verschiedene Spalten",
    body_de:
      "Schau im Bild auf den gelb pulsierenden Punkt: das ist Reihe c, Spalte 4. Steck dort ein Beinchen des Widerstands rein. Das andere Beinchen steckst du in Reihe c, Spalte 7. So überbrückt der Widerstand zwei verschiedene Spalten — der Strom MUSS durch den Widerstand fließen, um von Spalte 4 nach Spalte 7 zu kommen. Das grüne Kabel verbindet GPIO 2 mit dem linken Beinchen (Spalte 4).",
    body_en:
      "Look at the yellow pulsing dot in the picture: that's row c, column 4. Plug one leg of the resistor in there. The other leg goes into row c, column 7. The resistor now bridges two DIFFERENT columns — current MUST flow through the resistor to get from column 4 to column 7. The green wire connects GPIO 2 to the left leg (column 4).",
    reason: "Behauptung 'derselben kurzen Spalte' war falsch — c4 und c7 sind verschiedene Spalten.",
  },
  // esp32-blink-led Step 7 (CRITICAL schematic-mismatch):
  // alter Text hatte nur EIN Kabel (GND→Minus-Schiene). LED-Kathode war nirgendwo
  // mit Minus verbunden — Lesson hätte real nicht funktioniert.
  {
    lessonSlug: "esp32-blink-led",
    sortOrder: 7,
    expectsMarker: "Kabel A — von der LED zur Minus-Schiene",
    title_de: "Schritt 3: Zwei GND-Kabel",
    title_en: "Step 3: Two GND wires",
    body_de:
      "Jetzt fehlen zwei Verbindungen — beide gehen zur blauen Minus-Schiene unten.\n\n**Kabel A — von der LED zur Minus-Schiene:** Nimm ein Jumper-Kabel. Ein Ende kommt in Reihe a, Spalte 9 (also die gleiche Spalte wie das kurze LED-Beinchen). Das andere Ende in die blaue Minus-Schiene ganz unten. Damit ist die LED-Kathode mit Minus verbunden.\n\n**Kabel B — vom ESP32 zur Minus-Schiene:** Nimm ein zweites Jumper-Kabel. Ein Ende an den GND-Pin am ESP32. Das andere Ende in irgendein Loch derselben blauen Minus-Schiene.\n\nJetzt fließt der Strom: GPIO 2 → Widerstand → langes LED-Beinchen → kurzes LED-Beinchen → Kabel A → Minus-Schiene → Kabel B → GND. Stromkreis geschlossen.",
    body_en:
      "Two connections are still missing — both go to the blue minus rail at the bottom.\n\n**Wire A — from the LED to the minus rail:** Grab a jumper wire. One end in row a, column 9 (the same column as the LED's short leg). The other end in the blue minus rail at the bottom. The LED cathode is now connected to minus.\n\n**Wire B — from the ESP32 to the minus rail:** Grab a second jumper wire. One end on the GND pin of the ESP32. The other end in any hole of the same blue minus rail.\n\nNow current flows: GPIO 2 → resistor → long LED leg → short LED leg → wire A → minus rail → wire B → GND. Circuit closed.",
    reason: "Step 7 hatte keine Verbindung von LED-Kathode (a9) zur Minus-Schiene — Schaltkreis war offen.",
  },
];

type BomFix = {
  lessonSlug: string;
  componentName: string;
  targetQuantity: number;
  reason: string;
};

const bomFixes: BomFix[] = [
  {
    lessonSlug: "esp32-blink-led",
    componentName: "Jumper-Kabel (M/M)",
    targetQuantity: 3,
    reason: "Schaltung braucht 3 Kabel (GPIO→R, LED-Kathode→Minus, GND→Minus), BOM listete 2.",
  },
];

async function applyStepPatch(p: Patch): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: {
      sortOrder: p.sortOrder,
      lesson: { slug: p.lessonSlug },
    },
    select: { id: true, body_de: true },
  });
  if (!step) return "missing";
  if (p.expectsMarker && step.body_de.includes(p.expectsMarker)) return "skipped";

  const data: Record<string, string> = {};
  if (p.title_de) data.title_de = p.title_de;
  if (p.title_en) data.title_en = p.title_en;
  if (p.body_de) data.body_de = p.body_de;
  if (p.body_en) data.body_en = p.body_en;
  await prisma.lessonStep.update({ where: { id: step.id }, data });
  return "applied";
}

async function applyBomFix(b: BomFix): Promise<"applied" | "skipped" | "missing"> {
  const item = await prisma.bOMItem.findFirst({
    where: {
      lesson: { slug: b.lessonSlug },
      component: { name: b.componentName },
    },
    select: { id: true, quantity: true },
  });
  if (!item) return "missing";
  if (item.quantity === b.targetQuantity) return "skipped";
  await prisma.bOMItem.update({
    where: { id: item.id },
    data: { quantity: b.targetQuantity },
  });
  return "applied";
}

async function main() {
  let applied = 0;
  let skipped = 0;
  let missing = 0;

  for (const p of patches) {
    const status = await applyStepPatch(p);
    console.log(`step ${p.lessonSlug}#${p.sortOrder}: ${status} — ${p.reason}`);
    if (status === "applied") applied++;
    else if (status === "skipped") skipped++;
    else missing++;
  }
  for (const b of bomFixes) {
    const status = await applyBomFix(b);
    console.log(`bom ${b.lessonSlug}/${b.componentName} → ${b.targetQuantity}: ${status} — ${b.reason}`);
    if (status === "applied") applied++;
    else if (status === "skipped") skipped++;
    else missing++;
  }

  console.log(`\nSummary: ${applied} applied, ${skipped} skipped (already correct), ${missing} missing`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
