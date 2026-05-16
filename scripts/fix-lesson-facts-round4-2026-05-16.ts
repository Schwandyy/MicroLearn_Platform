// Round 4 — finale Fakten-Bug-Bereinigung nach 3 vorhergehenden Sweeps.
//
// Fokus: 6 echte Critical-Bugs aus dem Final-Audit, davon 1 selbstverschuldet:
//   1. esp32-mini-roboter: Round-1-Code-Patch hat DC-Motor-Code reingedrückt
//      obwohl die Lesson Servo + Ultraschall + LED ist. Rollback auf Original
//      aus prisma/lessons/content/.
//   2. esp32-pwm-fade: ledcSetup/ledcAttachPin → ledcAttach (ESP32-Core v3+).
//   3. esp32-buzzer-melodie: ledcSetup → ledcAttach + ledcWriteTone, plus
//      "Twinkle Twinkle" → "Alle meine Entchen" in en-explain.
//   4. esp32-stepper-motor Step 2: Half-Step-Aussage zurück — Library nutzt
//      Full-Step, 2048 kommt vom internen Getriebe.
//   5. esp32-ultraschall-abstand: 1 kΩ + 2 kΩ als neue Components anlegen
//      und in BOM aufnehmen.
//   6. esp32-button-led: GND-Verbindung explizit in Build + Jumper 4 → 5.
//
// Idempotent via Marker-Detection. Re-runnable.

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, type LogicLevel, type LearnerLevel } from "@prisma/client";

const prisma = new PrismaClient();

// --- Komponenten ---

type ComponentSeed = {
  slug: string;
  name: string;
  category: string;
  logicLevel: LogicLevel;
  voltageMin: number;
  voltageMax: number;
  levelHint: LearnerLevel | null;
  iconKey: string | null;
  description_de: string;
  description_en: string;
  descriptionShort_de: string;
  descriptionShort_en: string;
};

const newComponents: ComponentSeed[] = [
  {
    slug: "resistor-1k",
    name: "Widerstand 1 kΩ",
    category: "passive",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 50,
    levelHint: "L1_BEGINNER",
    iconKey: "zap",
    description_de: "Widerstand 1 kΩ. Standardwert für niederohmige Spannungsteiler (z. B. am Echo-Pin des HC-SR04).",
    description_en: "1 kΩ resistor. Standard value for low-impedance voltage dividers (e.g. HC-SR04 echo pin).",
    descriptionShort_de: "1 kΩ — niederohmiger Spannungsteiler.",
    descriptionShort_en: "1 kΩ — low-impedance voltage divider.",
  },
  {
    slug: "resistor-2k",
    name: "Widerstand 2 kΩ",
    category: "passive",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 50,
    levelHint: "L1_BEGINNER",
    iconKey: "zap",
    description_de: "Widerstand 2 kΩ. Wird mit 1 kΩ kombiniert zu einem niederohmigen Spannungsteiler 5 V → 3,3 V.",
    description_en: "2 kΩ resistor. Combined with 1 kΩ as a low-impedance 5 V → 3.3 V voltage divider.",
    descriptionShort_de: "2 kΩ — untere Hälfte des 5 V → 3,3 V Teilers.",
    descriptionShort_en: "2 kΩ — bottom half of the 5 V → 3.3 V divider.",
  },
];

async function ensureComponent(c: ComponentSeed): Promise<"created" | "exists"> {
  const existing = await prisma.component.findUnique({ where: { slug: c.slug } });
  if (existing) return "exists";
  await prisma.component.create({ data: c });
  return "created";
}

// --- BOM-Patches ---

type BomFix = {
  lessonSlug: string;
  componentSlug: string;
  targetQuantity: number;
  noteDe?: string;
  noteEn?: string;
  reason: string;
};

const bomFixes: BomFix[] = [
  // esp32-ultraschall-abstand: 1 kΩ + 2 kΩ für Spannungsteiler
  {
    lessonSlug: "esp32-ultraschall-abstand",
    componentSlug: "resistor-1k",
    targetQuantity: 1,
    noteDe: "Obere Hälfte des Spannungsteilers Echo → GPIO (5 V → 3,3 V).",
    noteEn: "Top half of the voltage divider Echo → GPIO (5 V → 3.3 V).",
    reason: "1 kΩ für Spannungsteiler am Echo-Pin fehlte in BOM.",
  },
  {
    lessonSlug: "esp32-ultraschall-abstand",
    componentSlug: "resistor-2k",
    targetQuantity: 1,
    noteDe: "Untere Hälfte des Spannungsteilers Echo → GPIO (5 V → 3,3 V).",
    noteEn: "Bottom half of the voltage divider Echo → GPIO (5 V → 3.3 V).",
    reason: "2 kΩ für Spannungsteiler am Echo-Pin fehlte in BOM.",
  },
  // esp32-button-led: 4 → 5 Jumper (zusätzlich GND-Schiene → ESP32-GND)
  {
    lessonSlug: "esp32-button-led",
    componentSlug: "jumper-wires-mm",
    targetQuantity: 5,
    reason: "Brauchen 5 Kabel inkl. GND-Schiene → ESP32-GND-Verbindung.",
  },
];

async function applyBomFix(b: BomFix): Promise<"applied" | "skipped" | "missing"> {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: b.lessonSlug },
    select: { id: true },
  });
  if (!lesson) return "missing";
  const component = await prisma.component.findUnique({
    where: { slug: b.componentSlug },
    select: { id: true },
  });
  if (!component) return "missing";

  const existing = await prisma.bOMItem.findFirst({
    where: { lessonId: lesson.id, componentId: component.id },
    select: { id: true, quantity: true },
  });
  if (existing) {
    if (existing.quantity === b.targetQuantity) return "skipped";
    await prisma.bOMItem.update({
      where: { id: existing.id },
      data: { quantity: b.targetQuantity },
    });
    return "applied";
  }
  await prisma.bOMItem.create({
    data: {
      lessonId: lesson.id,
      componentId: component.id,
      quantity: b.targetQuantity,
      note_de: b.noteDe ?? null,
      note_en: b.noteEn ?? null,
    },
  });
  return "applied";
}

// --- BOM-Removals (mini-roboter Rollback): MOSFET, Diode, Batteriehalter
// gehören nicht in eine Servo+Ultraschall+LED-Lesson.

type BomRemoval = {
  lessonSlug: string;
  componentSlug: string;
  reason: string;
};

const bomRemovals: BomRemoval[] = [
  {
    lessonSlug: "esp32-mini-roboter",
    componentSlug: "mosfet-irlz44n",
    reason: "MOSFET war Round-1-Fehlannahme — Lesson ist Servo+Ultraschall+LED, kein DC-Motor.",
  },
  {
    lessonSlug: "esp32-mini-roboter",
    componentSlug: "diode-1n4007",
    reason: "Diode war Round-1-Fehlannahme — keine induktive Last bei Servo+LED.",
  },
  {
    lessonSlug: "esp32-mini-roboter",
    componentSlug: "battery-holder-4xaa",
    reason: "Batteriehalter war Round-1-Fehlannahme — Servo+LED laufen direkt am ESP32-5V.",
  },
];

async function applyBomRemoval(b: BomRemoval): Promise<"applied" | "skipped" | "missing"> {
  const item = await prisma.bOMItem.findFirst({
    where: {
      lesson: { slug: b.lessonSlug },
      component: { slug: b.componentSlug },
    },
    select: { id: true },
  });
  if (!item) return "skipped";
  await prisma.bOMItem.delete({ where: { id: item.id } });
  return "applied";
}

// --- Step-Body-Patches ---

type Patch = {
  lessonSlug: string;
  sortOrder: number;
  expectsMarker?: string;
  title_de?: string;
  title_en?: string;
  body_de?: string;
  body_en?: string;
  reason: string;
};

const patches: Patch[] = [
  // esp32-mini-roboter Step 3 Rollback auf Original-Build-Text.
  {
    lessonSlug: "esp32-mini-roboter",
    sortOrder: 3,
    expectsMarker: "Servo: rotes Kabel an 5 V, braunes Kabel an GND, oranges Signal",
    body_de:
      "**Servo:** rotes Kabel an 5 V, braunes Kabel an GND, oranges Signal-Kabel an GPIO 13.\n\n**Ultraschallsensor:** VCC an 5 V, GND an GND, Trig an GPIO 5, Echo an GPIO 18. Wichtig: Der Echo-Pin gibt 5 V aus, der ESP32-GPIO verträgt nur 3,3 V — entweder einen Spannungsteiler 1 kΩ/2 kΩ dazwischen schalten (sicherer) oder bei kurzem Test direkt verbinden (Risiko für den Pin auf Dauer).\n\n**LED:** Anode (langes Bein) über den 220-Ω-Widerstand an GPIO 12, Kathode (kurzes Bein) an GND.\n\nDer 5V-Pin des ESP32 liefert nur dann 5 V, wenn der ESP32 per USB angesteckt ist — für Servo und Ultraschall ist das hier okay.",
    body_en:
      "**Servo:** red wire to 5 V, brown wire to GND, orange signal wire to GPIO 13.\n\n**Ultrasonic sensor:** VCC to 5 V, GND to GND, Trig to GPIO 5, Echo to GPIO 18. Important: the Echo pin outputs 5 V, the ESP32 GPIO only tolerates 3.3 V — use a 1 kΩ/2 kΩ voltage divider in between (safer), or for a short test connect directly (risky for the pin over time).\n\n**LED:** anode (long leg) through the 220 Ω resistor to GPIO 12, cathode (short leg) to GND.\n\nThe ESP32's 5V pin only delivers 5 V while the ESP32 is plugged into USB — that's fine here for servo and ultrasonic.",
    reason: "Rollback auf Original-Wiring (Servo+Ultraschall+LED) statt fälschlich eingebauter DC-Motor-Schaltung.",
  },
  // esp32-stepper-motor Step 2: Full-Step statt Half-Step (mein Round-3-Fix war falsch).
  {
    lessonSlug: "esp32-stepper-motor",
    sortOrder: 2,
    expectsMarker: "Full-Step-Sequenz",
    body_de:
      "Ein normaler Motor dreht einfach durch. Ein Schrittmotor hat drinnen mehrere Elektromagnete. Die werden nacheinander angesteuert — so „klickt“ sich die Welle Schritt für Schritt weiter.\n\nDie Standard-Arduino-Stepper-Library nutzt für den 28BYJ-48 eine **Full-Step-Sequenz** (4 Phasen). Pro Stator-Umdrehung sind das 32 Schritte. Der Motor hat aber zusätzlich ein internes Getriebe (Übersetzung ca. 64:1) — damit ergeben sich 32 × 64 = **2048 Schritte pro Achs-Umdrehung**. Das heißt: 512 Schritte = 90°. Kein Messen nötig — du zählst einfach.",
    body_en:
      "A regular motor just spins. A stepper motor has several electromagnets inside, energized one after the other — that's how the shaft \"clicks\" forward step by step.\n\nThe standard Arduino Stepper library drives the 28BYJ-48 with a **full-step sequence** (4 phases). That's 32 steps per rotor revolution. The motor has an internal gear reduction (~64:1), so 32 × 64 = **2048 steps per shaft revolution**. That means: 512 steps = 90°. No measuring — just count.",
    reason: "Half-Step war falsch (mein Round-3-Fix). Library nutzt Full-Step; 2048 kommt vom internen Getriebe.",
  },
  // esp32-button-led: GND-Verbindung in Step 4 explizit, plus „Vor dem Code"-Hinweis.
  {
    lessonSlug: "esp32-button-led",
    sortOrder: 4,
    expectsMarker: "GND-Pin am ESP32 mit der blauen Minus-Schiene",
    body_de:
      "Verkabele die Schaltung:\n1. Taster auf das Steckbrett — die zwei Beinchen einer Diagonale müssen unterschiedliche Spalten haben.\n2. Ein Bein des Tasters → GPIO 4.\n3. Anderes Bein des Tasters → blaue Minus-Schiene.\n4. LED-Anode (langes Bein) → 220-Ω-Widerstand → GPIO 2.\n5. LED-Kathode (kurzes Bein) → blaue Minus-Schiene.\n6. **Wichtig:** Ein Jumper-Kabel verbindet die blaue Minus-Schiene mit einem GND-Pin am ESP32. Ohne diese Verbindung ist die Schaltung „in der Luft“ und der Taster reagiert nicht — der Strom braucht einen Rückweg zum ESP32.",
    body_en:
      "Wire the circuit:\n1. Push the button into the breadboard — the two diagonal legs must sit in different columns.\n2. One button leg → GPIO 4.\n3. Other button leg → blue minus rail.\n4. LED anode (long leg) → 220 Ω resistor → GPIO 2.\n5. LED cathode (short leg) → blue minus rail.\n6. **Important:** one jumper wire connects the blue minus rail to a GND pin on the ESP32. Without this connection the circuit is \"floating\" and the button won't respond — current needs a way back to the ESP32.",
    reason: "GND-Pin am ESP32 mit der blauen Minus-Schiene-Verbindung war nirgendwo erklärt — Schaltung wäre offen.",
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

  const data: Record<string, unknown> = {};
  if (p.title_de) data.title_de = p.title_de;
  if (p.title_en) data.title_en = p.title_en;
  if (p.body_de) data.body_de = p.body_de;
  if (p.body_en) data.body_en = p.body_en;
  if (Object.keys(data).length === 0) return "skipped";
  await prisma.lessonStep.update({ where: { id: step.id }, data });
  return "applied";
}

// --- Code-Patches: Original-Code aus content-Datei laden oder neu zusammensetzen ---

function loadContentCode(slug: string): { code: string; lines?: unknown } | null {
  const path = resolve(process.cwd(), "prisma/lessons/content", `${slug}.json`);
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as {
      steps?: Array<{ kind?: string; payload?: { code?: string; lines?: unknown } }>;
    };
    const step = raw.steps?.find((s) => s.kind === "CODE_WALK");
    const code = step?.payload?.code;
    if (typeof code !== "string") return null;
    return { code, lines: step?.payload?.lines };
  } catch {
    return null;
  }
}

type CodeReset = {
  lessonSlug: string;
  sortOrder: number;
  expectsMarker: string; // wenn dieser im aktuellen Code drin, dann skip
  source: "content-file";
  reason: string;
};

const codeResets: CodeReset[] = [
  // esp32-mini-roboter: kompletter Rollback auf Original-Servo+Ultraschall+LED-Code.
  {
    lessonSlug: "esp32-mini-roboter",
    sortOrder: 4,
    expectsMarker: "ESP32 Mini-Roboter: Servo + Ultraschall + LED",
    source: "content-file",
    reason: "Round-1-Code war erfunden (DC-Motor) — Rollback auf Original aus content-file.",
  },
];

async function applyCodeReset(c: CodeReset): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: { sortOrder: c.sortOrder, lesson: { slug: c.lessonSlug } },
    select: { id: true, payload: true },
  });
  if (!step) return "missing";
  const payload = (step.payload ?? {}) as Record<string, unknown>;
  const existing = typeof payload.code === "string" ? payload.code : "";
  if (existing.includes(c.expectsMarker)) return "skipped";

  const original = loadContentCode(c.lessonSlug);
  if (!original) return "missing";

  const next: Record<string, unknown> = { ...payload, code: original.code };
  if (original.lines !== undefined) next.lines = original.lines;
  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { payload: next as never },
  });
  return "applied";
}

// --- Inline-Code-Patches: gezielte API-Migration in Code-Snippets ---

type CodePatch = {
  lessonSlug: string;
  sortOrder: number;
  expectsMarker: string;
  newCode: string;
  reason: string;
};

const codePatches: CodePatch[] = [
  // esp32-pwm-fade: ledcSetup/ledcAttachPin → ledcAttach (Core v3+).
  {
    lessonSlug: "esp32-pwm-fade",
    sortOrder: 3,
    expectsMarker: "ledcAttach(LED_PIN, PWM_FREQ, PWM_RES)",
    newCode: `// ESP32 — Helligkeit per PWM steuern
const int LED_PIN  = 2;
const int PWM_FREQ = 5000;
const int PWM_RES  = 8;  // 0..255

void setup() {
  // ESP32-Arduino-Core v3+: ein Aufruf pro Pin
  ledcAttach(LED_PIN, PWM_FREQ, PWM_RES);
}

void loop() {
  // Hochdimmen
  for (int v = 0; v <= 255; v++) {
    ledcWrite(LED_PIN, v);
    delay(8);
  }
  // Runterdimmen
  for (int v = 255; v >= 0; v--) {
    ledcWrite(LED_PIN, v);
    delay(8);
  }
}`,
    reason: "ledcSetup/ledcAttachPin in ESP32-Arduino-Core v3+ entfernt — Migration auf ledcAttach.",
  },
  // esp32-buzzer-melodie: ledcSetup/ledcAttachPin → ledcAttach (Core v3+).
  // ledcWriteTone hat in v3 die Signatur (pin, freq).
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 4,
    expectsMarker: "ledcAttach(BUZZER_PIN, 1000, 8)",
    newCode: `// ESP32 — Buzzer spielt „Alle meine Entchen"
const int BUZZER_PIN = 25;

// Frequenzen in Hz für die Noten C4, D4, E4, F4, G4, A4
const int frequenzen[] = {262, 294, 330, 349, 392, 392, 440, 440};
const int notenAnzahl  = sizeof(frequenzen) / sizeof(frequenzen[0]);

void setup() {
  // ESP32-Arduino-Core v3+: ledcAttach(pin, freq, resolution).
  // Frequenz wird gleich per ledcWriteTone überschrieben — der Initialwert
  // ist nur Platzhalter.
  ledcAttach(BUZZER_PIN, 1000, 8);
}

void spieleNote(int frequenz, int dauerMs) {
  ledcWriteTone(BUZZER_PIN, frequenz);
  delay(dauerMs);
  ledcWriteTone(BUZZER_PIN, 0);   // Stille zwischen den Tönen
  delay(50);
}

void loop() {
  for (int i = 0; i < notenAnzahl; i++) {
    spieleNote(frequenzen[i], 400);
  }
  delay(2000);  // Pause vor Wiederholung
}`,
    reason: "ledcSetup/ledcAttachPin in ESP32-Arduino-Core v3+ entfernt — Migration auf ledcAttach.",
  },
];

async function applyCodePatch(c: CodePatch): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: { sortOrder: c.sortOrder, lesson: { slug: c.lessonSlug } },
    select: { id: true, payload: true },
  });
  if (!step) return "missing";
  const payload = (step.payload ?? {}) as Record<string, unknown>;
  const existing = typeof payload.code === "string" ? payload.code : "";
  if (existing.includes(c.expectsMarker)) return "skipped";

  const next: Record<string, unknown> = { ...payload, code: c.newCode };
  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { payload: next as never },
  });
  return "applied";
}

// --- Payload-Replace: Twinkle Twinkle → Alle meine Entchen in en-explain
type PayloadReplace = {
  lessonSlug: string;
  sortOrder: number;
  searches: Array<{ from: string; to: string }>;
  reason: string;
};

const payloadReplaces: PayloadReplace[] = [
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 4,
    searches: [
      { from: "Twinkle Twinkle", to: "Alle meine Entchen" },
      { from: "twinkle twinkle", to: "Alle meine Entchen" },
    ],
    reason: "Lied heißt durchgängig „Alle meine Entchen“, nicht „Twinkle Twinkle“.",
  },
];

async function applyPayloadReplace(p: PayloadReplace): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: { sortOrder: p.sortOrder, lesson: { slug: p.lessonSlug } },
    select: { id: true, payload: true },
  });
  if (!step) return "missing";
  let raw = JSON.stringify(step.payload ?? {});
  let changed = false;
  for (const { from, to } of p.searches) {
    if (raw.includes(from)) {
      raw = raw.split(from).join(to);
      changed = true;
    }
  }
  if (!changed) return "skipped";
  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { payload: JSON.parse(raw) as never },
  });
  return "applied";
}

async function main() {
  let applied = 0;
  let skipped = 0;
  let missing = 0;
  const bump = (s: "applied" | "skipped" | "missing") => {
    if (s === "applied") applied++;
    else if (s === "skipped") skipped++;
    else missing++;
  };

  console.log("\n=== components ===");
  for (const c of newComponents) {
    const status = await ensureComponent(c);
    console.log(`component ${c.slug}: ${status}`);
    bump(status === "created" ? "applied" : "skipped");
  }

  console.log("\n=== bom removals ===");
  for (const r of bomRemovals) {
    const status = await applyBomRemoval(r);
    console.log(`bom-removal ${r.lessonSlug}/${r.componentSlug}: ${status} — ${r.reason}`);
    bump(status);
  }

  console.log("\n=== bom fixes ===");
  for (const b of bomFixes) {
    const status = await applyBomFix(b);
    console.log(`bom ${b.lessonSlug}/${b.componentSlug} → ${b.targetQuantity}: ${status} — ${b.reason}`);
    bump(status);
  }

  console.log("\n=== step patches ===");
  for (const p of patches) {
    const status = await applyStepPatch(p);
    console.log(`step ${p.lessonSlug}#${p.sortOrder}: ${status} — ${p.reason}`);
    bump(status);
  }

  console.log("\n=== code resets (from content files) ===");
  for (const r of codeResets) {
    const status = await applyCodeReset(r);
    console.log(`code-reset ${r.lessonSlug}#${r.sortOrder}: ${status} — ${r.reason}`);
    bump(status);
  }

  console.log("\n=== inline code patches ===");
  for (const c of codePatches) {
    const status = await applyCodePatch(c);
    console.log(`code ${c.lessonSlug}#${c.sortOrder}: ${status} — ${c.reason}`);
    bump(status);
  }

  console.log("\n=== payload replacements ===");
  for (const p of payloadReplaces) {
    const status = await applyPayloadReplace(p);
    console.log(`payload ${p.lessonSlug}#${p.sortOrder}: ${status} — ${p.reason}`);
    bump(status);
  }

  console.log(`\nSummary: ${applied} applied, ${skipped} skipped, ${missing} missing`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
