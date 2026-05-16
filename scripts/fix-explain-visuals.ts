// Ergänzt EXPLAIN-Steps die offensichtlich Schaltungs-Konzepte beschreiben
// um ein passendes Visual-Flag:
// - highlightPin wenn Pin-Begriff erwähnt
// - showBreadboardExplainer wenn Steckbrett-Konzepte
// EXPLAIN-Steps die andere Konzepte erklären (WLAN, MQTT, OTA) bleiben
// unverändert — die brauchen redaktionelle Visuals.
// Idempotent.

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const PIN_KEYWORDS = ["GPIO", "Pin ", "Pins", "GND", "3V3", "3.3V"];
const BREADBOARD_KEYWORDS = [
  "Steckbrett",
  "Schiene",
  "Reihe",
  "Spalte",
  "Plus-Schiene",
  "Minus-Schiene",
  "Stromschiene",
];

function detectVisual(body: string): {
  highlightPin?: "GPIO2" | "GND" | "3V3";
  showBreadboardExplainer?: boolean;
} {
  const out: ReturnType<typeof detectVisual> = {};
  if (BREADBOARD_KEYWORDS.some((kw) => body.includes(kw))) {
    out.showBreadboardExplainer = true;
  }
  if (PIN_KEYWORDS.some((kw) => body.includes(kw))) {
    if (body.includes("GND")) out.highlightPin = "GND";
    else if (body.includes("3V3") || body.includes("3.3V")) out.highlightPin = "3V3";
    else if (body.match(/GPIO\s*2\b/)) out.highlightPin = "GPIO2";
  }
  return out;
}

async function main() {
  const steps = await prisma.lessonStep.findMany({
    where: { kind: "EXPLAIN" },
    include: { lesson: { select: { slug: true } } },
  });

  let touched = 0;
  let skipped = 0;
  let nothing = 0;

  for (const step of steps) {
    const payload = (step.payload as Record<string, unknown> | null) ?? {};
    // Wenn bereits Visual: skip
    if (
      step.imageUrl ||
      payload.highlightPin ||
      payload.showBreadboardExplainer ||
      payload.breadboard
    ) {
      skipped += 1;
      continue;
    }
    const body = step.body_de ?? "";
    const detected = detectVisual(body);
    if (!detected.highlightPin && !detected.showBreadboardExplainer) {
      nothing += 1;
      console.log(`  – ${step.lesson.slug}#${step.sortOrder}: kein Trigger gefunden — manuell ergänzen.`);
      continue;
    }
    const newPayload = { ...payload, ...detected } as Prisma.InputJsonValue;
    await prisma.lessonStep.update({
      where: { id: step.id },
      data: { payload: newPayload },
    });
    const hint = Object.entries(detected)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    console.log(`  ✓ ${step.lesson.slug}#${step.sortOrder}: ${hint}`);
    touched += 1;
  }
  console.log(`\nGesetzt: ${touched} · Bereits visuell: ${skipped} · Kein Trigger: ${nothing}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
