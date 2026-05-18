/**
 * Sprint 9.4: Blink-Lesson Step-Texte + CODE_WALK mit Platzhaltern versehen,
 * damit User-gewählter Signal-Pin (default D2) im Step-Text adaptiert wird.
 *
 * Platzhalter:
 *   {{SIGNAL_LABEL}}  → "D2" (default) oder "D4", "D5" …
 *   {{SIGNAL_GPIO}}   → "2"  (default) oder "4", "5" …
 *
 * Lehnt sich an aktuell hardcodierte Stellen in der Blink-Lesson:
 *   • Step 7 body + keyPoint:   "GPIO 2" → "GPIO {{SIGNAL_GPIO}}"
 *                                "D2"    → "{{SIGNAL_LABEL}}"
 *   • Step 10 body:             "GPIO 2" → "GPIO {{SIGNAL_GPIO}}"
 *   • Step 13 (CODE_WALK):      code + explain_de/en mit Platzhaltern
 *
 * Idempotent.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: "esp32-blink-led" },
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });
  if (!lesson) throw new Error("Lesson esp32-blink-led nicht gefunden");

  let touched = 0;
  let skipped = 0;

  // === Step 7: GPIO erklären ===
  const step7 = lesson.steps.find((s) => s.sortOrder === 7);
  if (step7) {
    const bodyDeFrom = `GPIO ist die Abkürzung für „General Purpose Input/Output" — auf Deutsch: Universal-Anschluss (mal Eingang, mal Ausgang). Heißt: dieser Pin kann entweder Strom RAUSGEBEN (z. B. eine LED ansteuern) oder Strom REINKOMMEN lesen (z. B. ob ein Knopf gedrückt ist). Jeder GPIO-Pin hat eine Nummer, die direkt aufs Board gedruckt ist. Wir benutzen GPIO 2 — das ist auf deinem Board oft als „D2" oder „IO2" beschriftet. Daran schließen wir gleich die LED an.`;
    const bodyDeTo = `GPIO ist die Abkürzung für „General Purpose Input/Output" — auf Deutsch: Universal-Anschluss (mal Eingang, mal Ausgang). Heißt: dieser Pin kann entweder Strom RAUSGEBEN (z. B. eine LED ansteuern) oder Strom REINKOMMEN lesen (z. B. ob ein Knopf gedrückt ist). Jeder GPIO-Pin hat eine Nummer, die direkt aufs Board gedruckt ist. Wir benutzen GPIO {{SIGNAL_GPIO}} — das ist auf deinem Board als „{{SIGNAL_LABEL}}" beschriftet. Daran schließen wir gleich die LED an.`;
    const bodyEnFrom = step7.body_en ?? "";
    const bodyEnTo = bodyEnFrom
      .replace("GPIO 2", "GPIO {{SIGNAL_GPIO}}")
      .replace(`„D2" or „IO2"`, `„{{SIGNAL_LABEL}}"`)
      .replace(`"D2" or "IO2"`, `"{{SIGNAL_LABEL}}"`);

    const payload = (step7.payload as Record<string, unknown> | null) ?? {};
    const newPayload: Record<string, unknown> = { ...payload };
    if (typeof payload.keyPoint_de === "string") {
      newPayload.keyPoint_de = payload.keyPoint_de
        .replace(/GPIO 2/g, "GPIO {{SIGNAL_GPIO}}")
        .replace(/„D2"/g, `„{{SIGNAL_LABEL}}"`)
        .replace(/„IO2"/g, `„IO{{SIGNAL_GPIO}}"`);
    }
    if (typeof payload.keyPoint_en === "string") {
      newPayload.keyPoint_en = payload.keyPoint_en
        .replace(/GPIO 2/g, "GPIO {{SIGNAL_GPIO}}")
        .replace(/„D2"/g, `„{{SIGNAL_LABEL}}"`)
        .replace(/„IO2"/g, `„IO{{SIGNAL_GPIO}}"`);
    }

    if (
      step7.body_de === bodyDeTo &&
      step7.body_en === bodyEnTo &&
      JSON.stringify(step7.payload) === JSON.stringify(newPayload)
    ) {
      console.log("  ⊘ Step 7: bereits aktuell");
      skipped++;
    } else if (step7.body_de !== bodyDeFrom && step7.body_de !== bodyDeTo) {
      console.log(`  ⚠ Step 7 body_de: Quelle weicht ab — manueller Check`);
      console.log(`    Aktuell: ${step7.body_de.slice(0, 90)}…`);
    } else {
      await prisma.lessonStep.update({
        where: { id: step7.id },
        data: { body_de: bodyDeTo, body_en: bodyEnTo, payload: newPayload },
      });
      console.log("  ✓ Step 7: body + keyPoint mit Platzhaltern");
      touched++;
    }
  }

  // === Step 10: Stromkreis-Erklärung ===
  const step10 = lesson.steps.find((s) => s.sortOrder === 10);
  if (step10) {
    const bodyDeUpdated = step10.body_de.replace(/GPIO 2 → Widerstand/g, "GPIO {{SIGNAL_GPIO}} → Widerstand");
    const bodyEnUpdated = (step10.body_en ?? "").replace(/GPIO 2 → resistor/g, "GPIO {{SIGNAL_GPIO}} → resistor");
    if (bodyDeUpdated === step10.body_de && bodyEnUpdated === step10.body_en) {
      console.log("  ⊘ Step 10: keine Änderung nötig (bereits templated oder kein Match)");
      skipped++;
    } else {
      await prisma.lessonStep.update({
        where: { id: step10.id },
        data: { body_de: bodyDeUpdated, body_en: bodyEnUpdated },
      });
      console.log("  ✓ Step 10: GPIO 2 → GPIO {{SIGNAL_GPIO}}");
      touched++;
    }
  }

  // === Step 13: CODE_WALK ===
  const step13 = lesson.steps.find((s) => s.sortOrder === 13);
  if (step13) {
    const payload = (step13.payload as Record<string, unknown> | null) ?? {};
    const newPayload: Record<string, unknown> = { ...payload };

    if (typeof payload.code === "string") {
      newPayload.code = payload.code
        .replace(/const int LED_PIN = 2;/g, "const int LED_PIN = {{SIGNAL_GPIO}};")
        .replace(/Wir benutzen GPIO 2/g, "Wir benutzen GPIO {{SIGNAL_GPIO}}")
        .replace(/We use GPIO 2/g, "We use GPIO {{SIGNAL_GPIO}}");
    }
    if (Array.isArray(payload.lines)) {
      newPayload.lines = (payload.lines as Array<Record<string, unknown>>).map((line) => {
        const out = { ...line };
        if (typeof out.explain_de === "string") {
          out.explain_de = (out.explain_de as string)
            .replace(/LED_PIN = 2/g, "LED_PIN = {{SIGNAL_GPIO}}")
            .replace(/„GPIO 2 ist/g, "„GPIO {{SIGNAL_GPIO}} ist")
            .replace(/GPIO 2 ist/g, "GPIO {{SIGNAL_GPIO}} ist");
        }
        if (typeof out.explain_en === "string") {
          out.explain_en = (out.explain_en as string)
            .replace(/LED_PIN = 2/g, "LED_PIN = {{SIGNAL_GPIO}}")
            .replace(/"GPIO 2 is/g, `"GPIO {{SIGNAL_GPIO}} is`)
            .replace(/GPIO 2 is/g, "GPIO {{SIGNAL_GPIO}} is");
        }
        return out;
      });
    }

    if (JSON.stringify(step13.payload) === JSON.stringify(newPayload)) {
      console.log("  ⊘ Step 13: bereits aktuell");
      skipped++;
    } else {
      await prisma.lessonStep.update({
        where: { id: step13.id },
        data: { payload: newPayload },
      });
      console.log("  ✓ Step 13: CODE_WALK mit Platzhaltern");
      touched++;
    }
  }

  console.log(`\nFertig — ${touched} Updates, ${skipped} idempotent übersprungen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
