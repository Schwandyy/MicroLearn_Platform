/**
 * Lesson-Generator — nimmt eine Spec (prisma/lessons/specs/<slug>.json),
 * ruft Claude Sonnet 4.6 mit einer existierenden Lesson als Few-Shot auf,
 * schreibt das Ergebnis nach prisma/lessons/content/<slug>.json.
 *
 * CLI:
 *   tsx --env-file=.env.local scripts/generate-lesson.ts --slug esp32-rgb-led
 *   tsx --env-file=.env.local scripts/generate-lesson.ts --all
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import type { LessonContent, LessonSpec } from "../prisma/lessons/types";

const ROOT = path.resolve(__dirname, "..");
const SPECS_DIR = path.join(ROOT, "prisma", "lessons", "specs");
const CONTENT_DIR = path.join(ROOT, "prisma", "lessons", "content");

const MODEL = process.env.ANTHROPIC_MODEL_CONTENT ?? "claude-sonnet-4-6";

// Eine vollständige Referenz-Lesson (DHT22), als Few-Shot-Output.
// Das stellt sicher, dass Claude unsere Step-Player-Konventionen + Payload-
// Strukturen exakt einhält (CODE_WALK mit lines[], QUIZ mit options/correctKey,
// EXPLAIN mit keyPoint, CELEBRATE mit xpAward, BUILD mit instruction_*).
const FEW_SHOT_SPEC: LessonSpec = {
  slug: "esp32-dht22-temperature",
  pathSlug: "welt-der-sensoren",
  courseSlug: "sensoren-grundlagen",
  boardSlug: "esp32-devkit-v1",
  sortOrder: 1,
  estimatedMinutes: 15,
  xpReward: 100,
  title_de: "Temperatur & Luftfeuchte messen",
  title_en: "Measure temperature & humidity",
  summary_de:
    "Mit dem DHT22-Sensor liest der ESP32 Temperatur und Feuchte aus der Luft — Grundlage für jedes Raumklima-, Wetter- oder Gewächshaus-Projekt.",
  summary_en:
    "With the DHT22 sensor the ESP32 reads air temperature and humidity — foundation for any climate, weather or greenhouse project.",
  safetyNotes_de: null,
  safetyNotes_en: null,
  bom: [
    { kind: "board", slug: "esp32-devkit-v1", qty: 1 },
    { kind: "component", slug: "breadboard-half", qty: 1 },
    { kind: "component", slug: "dht22-sensor", qty: 1 },
    { kind: "component", slug: "jumper-wires-mm", qty: 3 },
  ],
  learningGoal:
    "Lerner liest Temperatur und Luftfeuchtigkeit mit dem DHT22-Modul aus, lernt das 1-Wire-Protokoll-Konzept (Library versteckt die Komplexität), und behandelt NaN-Fehler korrekt mit isnan().",
  newConcepts:
    "Sensor-Library installieren (DHT sensor library by Adafruit), 1-Wire-Protokoll-Idee, NaN-Erkennung mit isnan(), seriellen Monitor zur Werte-Ausgabe.",
  stepOutline: ["INTRO", "PARTS", "EXPLAIN", "BUILD", "CODE_WALK", "QUIZ", "CELEBRATE"],
  codeHints:
    "ESP32 mit Arduino-Framework. DHT22-Modul (3-Pin-Variante), Datenleitung an GPIO 4, Versorgung 3.3V. Loop liest alle 2 Sekunden, prüft mit isnan().",
};

const FEW_SHOT_OUTPUT: LessonContent = {
  slug: "esp32-dht22-temperature",
  title_de: "Temperatur & Luftfeuchte messen",
  title_en: "Measure temperature & humidity",
  summary_de:
    "Mit dem DHT22-Sensor liest der ESP32 Temperatur und Feuchte aus der Luft — Grundlage für jedes Raumklima-, Wetter- oder Gewächshaus-Projekt.",
  summary_en:
    "With the DHT22 sensor the ESP32 reads air temperature and humidity — foundation for any climate, weather or greenhouse project.",
  estimatedMinutes: 15,
  xpReward: 100,
  safetyNotes_de: null,
  safetyNotes_en: null,
  steps: [
    {
      kind: "INTRO",
      title_de: "Was bauen wir?",
      title_en: "What are we building?",
      body_de:
        "Ein digitales Thermometer + Feuchtemesser. Werte erscheinen alle 2 Sekunden im seriellen Monitor der Arduino IDE.",
      body_en:
        "A digital thermometer + humidity meter. Values appear every 2 seconds in the Arduino IDE serial monitor.",
      payload: null,
    },
    {
      kind: "PARTS",
      title_de: "Das brauchst du",
      title_en: "What you need",
      body_de:
        "Wir empfehlen die Modul-Variante (3-Pin-Platine) — die hat den Pull-Up-Widerstand bereits eingebaut.",
      body_en:
        "We recommend the module version (3-pin board) — the pull-up resistor is already on it.",
      payload: null,
    },
    {
      kind: "EXPLAIN",
      title_de: "Wie kommunizieren Sensoren mit dem ESP32?",
      title_en: "How do sensors talk to the ESP32?",
      body_de:
        "Der DHT22 nutzt ein einfaches 1-Wire-Protokoll: über EINEN Datendraht wird im Mikrosekundentakt eine Folge aus High/Low geschickt — daraus baut die Bibliothek die Werte zusammen. Du musst das nicht selbst codieren.",
      body_en:
        "The DHT22 uses a simple 1-wire protocol: a series of highs/lows on ONE data wire — the library decodes the values for you. You don't need to write the low-level code.",
      payload: {
        keyPoint_de:
          "Komplexes Protokoll versteckt sich hinter einer simplen Library-API: dht.readTemperature() — fertig.",
        keyPoint_en:
          "Complex protocol hidden behind a simple library API: dht.readTemperature() — done.",
      },
    },
    {
      kind: "BUILD",
      title_de: "Verkabelung",
      title_en: "Wiring",
      body_de:
        "DHT22-Modul (3 Pins): + an 3,3 V am ESP32, − an GND, OUT an GPIO 4. Mehr brauchst du nicht.",
      body_en:
        "DHT22 module (3 pins): + to 3.3 V on the ESP32, − to GND, OUT to GPIO 4. Nothing else.",
      payload: {
        instruction_de:
          "Bei der Sensor-Variante OHNE Platine: zusätzlich 10 kΩ-Widerstand zwischen Daten-Pin und VCC einbauen.",
        instruction_en:
          "For the bare sensor variant: add a 10 kΩ resistor between data and VCC.",
      },
    },
    {
      kind: "CODE_WALK",
      title_de: "Der Code — Zeile für Zeile",
      title_en: "The code — line by line",
      body_de: "Bibliothek „DHT sensor library by Adafruit\" einmal installieren.",
      body_en: "Install the \"DHT sensor library by Adafruit\" once.",
      payload: {
        code:
          "// ESP32 — DHT22 lesen\n#include <DHT.h>\n\n#define DHTPIN 4\n#define DHTTYPE DHT22\n\nDHT dht(DHTPIN, DHTTYPE);\n\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\n\nvoid loop() {\n  float t = dht.readTemperature();\n  float h = dht.readHumidity();\n  if (isnan(t) || isnan(h)) {\n    Serial.println(\"Sensor antwortet nicht\");\n    return;\n  }\n  Serial.print(\"Temp: \");\n  Serial.print(t);\n  Serial.print(\" °C  |  Feuchte: \");\n  Serial.print(h);\n  Serial.println(\" %\");\n  delay(2000);\n}",
        lines: [
          {
            from: 2,
            to: 7,
            explain_de: "Library laden, Pin und Sensor-Typ angeben, Sensor-Objekt erzeugen.",
            explain_en: "Load library, declare pin and sensor type, create the sensor object.",
          },
          {
            from: 9,
            to: 12,
            explain_de:
              "setup(): seriellen Monitor mit 115200 Baud starten und Sensor initialisieren.",
            explain_en: "setup(): start the serial monitor at 115200 baud and init the sensor.",
          },
          {
            from: 14,
            to: 26,
            explain_de:
              "Alle 2 Sekunden Temperatur und Feuchte lesen, prüfen ob Werte gültig sind, und auf den Monitor schreiben.",
            explain_en:
              "Every 2 seconds read temperature + humidity, check validity, print to the monitor.",
          },
        ],
      },
    },
    {
      kind: "QUIZ",
      title_de: "Kurze Frage",
      title_en: "Quick question",
      body_de: "Was machst du, wenn dht.readTemperature() NaN zurückgibt?",
      body_en: "What do you do if dht.readTemperature() returns NaN?",
      payload: {
        prompt_de: "Was machst du, wenn dht.readTemperature() NaN zurückgibt?",
        prompt_en: "What do you do if dht.readTemperature() returns NaN?",
        options: [
          {
            key: "a",
            label_de: "Fehler ignorieren, weiter rechnen — wird schon passen.",
            label_en: "Ignore the error and use the value anyway.",
          },
          {
            key: "b",
            label_de:
              "Mit isnan() prüfen und in dem Fall NICHTS ausgeben — der Sensor hat in dem Moment nicht geantwortet.",
            label_en:
              "Check with isnan() and print nothing in that case — the sensor didn't respond.",
          },
          { key: "c", label_de: "Den ESP32 neu starten.", label_en: "Reboot the ESP32." },
        ],
        correctKey: "b",
      },
    },
    {
      kind: "CELEBRATE",
      title_de: "Geschafft!",
      title_en: "Done!",
      body_de:
        "Dein ESP32 versteht jetzt seine Umgebung. Nächster Schritt: diese Werte ans Internet schicken.",
      body_en:
        "Your ESP32 now senses its environment. Next step: send these values to the internet.",
      payload: { xpAward: 100 },
    },
  ],
};

const SYSTEM_PROMPT = `Du erzeugst eine einzelne MicroLearn-Lesson als JSON.

Plattform-Kontext:
- MicroLearn ist eine deutsch-/englischsprachige PWA für Mikroelektronik-Anfänger (Hauptzielgruppe: Schüler ab 12 Jahren, Hobbyisten, Lehrer).
- Lessons werden in einem "Step-Player" gerendert: ein Step nach dem anderen, mobile-first.
- Sprache: warm, direkt, du-Form. Auf Anfänger-Niveau wie ein guter Lehrer, nicht wie eine technische Doku. NIE herablassend. KURZE Sätze.

Output-Format:
- Reines JSON, das exakt dem TypeScript-Typ \`LessonContent\` entspricht (slug, Titel/Summary DE+EN, estimatedMinutes, xpReward, safetyNotes_de/en, steps).
- KEINE Code-Fences, KEIN Markdown drumherum — direkt JSON, parsebar.
- Jeder Step ist bilingual: title_de/title_en, body_de/body_en. Nie übersetzungs-1:1 wirken — beide Texte müssen natürlich klingen.

Step-Konventionen:
- INTRO: 1–2 Sätze, "Was bauen wir?". Visualisiert das Endergebnis. Kein payload.
- PARTS: kurzer Satz zur empfohlenen Variante (Modul vs. Sensor, kompatible Alternativen). Kein payload.
- SAFETY: nur wenn Spannung > 5V, Hitze, Laser, drehende Motoren — sonst weglassen. payload: { instruction_de, instruction_en }.
- EXPLAIN: 1 Konzept verständlich erklären. body knapp, payload.keyPoint_de/keyPoint_en als 1-Satz-Kernaussage.
- BUILD: konkrete Verkabelungsschritte ("rotes Kabel von 3,3V zu …, OUT zu GPIO …"). payload.instruction_de/_en für Edge-Cases / Alternativen.
- CODE_WALK: vollständiger Arduino-/ESP32-Code in payload.code (als String, Newlines escaped). payload.lines ist Array mit { from, to, explain_de, explain_en }. Code muss kompilieren und korrekt sein. Keine Pseudo-Library. Bevorzuge bekannte Libraries (Adafruit, Espressif Standard).
- SIMULATE: 1–2 Sätze was der Lerner im Serial Monitor / am Board sieht. Kein payload nötig.
- QUIZ: payload.prompt_de/_en, payload.options [{key:"a"|"b"|"c", label_de, label_en}], payload.correctKey. Falsche Antworten plausibel, nicht offensichtlich albern.
- CELEBRATE: motivierender Abschluss, Brücke zur nächsten Lesson. payload.xpAward = xpReward der Lesson.
- SETUP: nur wenn Software-Setup nötig (Bibliothek installieren). payload.checklist Array mit { de, en } Einträgen.

Inhaltliche Regeln:
- Code muss tatsächlich funktionieren: korrekte Bibliotheks-Imports, valide GPIO-Pins für ESP32, korrekte Funktions-Signaturen.
- BOM aus der Spec wird vom System aufgelöst — schreibe also KEINE Komponenten-Slugs in die Step-Texte, beschreibe Bauteile natürlichsprachlich.
- Bilingual: DE-Text 1:1 von Bedeutung, EN-Text muss auch idiomatisch klingen (keine Übersetzungs-Robotik).
- estimatedMinutes/xpReward übernimmst du aus der Spec.
- Anzahl Steps: folge \`stepOutline\` aus der Spec EXAKT (Reihenfolge + Kinds).
- Verwende deutsche „Anführungszeichen" für DE-Strings, "english quotes" für EN.
`;

interface CliArgs {
  slug?: string;
  all?: boolean;
  force?: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const out: CliArgs = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--slug") out.slug = args[++i];
    else if (a === "--all") out.all = true;
    else if (a === "--force") out.force = true;
  }
  return out;
}

async function listSpecs(): Promise<LessonSpec[]> {
  const files = await fs.readdir(SPECS_DIR);
  const specs: LessonSpec[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(SPECS_DIR, f), "utf-8");
    specs.push(JSON.parse(raw) as LessonSpec);
  }
  return specs;
}

async function contentExists(slug: string): Promise<boolean> {
  try {
    await fs.access(path.join(CONTENT_DIR, `${slug}.json`));
    return true;
  } catch {
    return false;
  }
}

async function generateOne(client: Anthropic, spec: LessonSpec, force: boolean): Promise<void> {
  const outPath = path.join(CONTENT_DIR, `${spec.slug}.json`);
  if (!force && (await contentExists(spec.slug))) {
    console.log(`  ⏭  ${spec.slug} (existiert bereits, --force zum Überschreiben)`);
    return;
  }

  console.log(`  🤖 generiere ${spec.slug} …`);

  const userMsg1 = `Erzeuge die Lesson für diese Spec:\n${JSON.stringify(FEW_SHOT_SPEC, null, 2)}`;
  const assistantMsg1 = JSON.stringify(FEW_SHOT_OUTPUT, null, 2);
  const userMsg2 = `Erzeuge nun die Lesson für diese Spec:\n${JSON.stringify(spec, null, 2)}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      { role: "user", content: userMsg1 },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: assistantMsg1,
            cache_control: { type: "ephemeral" },
          },
        ],
      },
      { role: "user", content: userMsg2 },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error(`Keine Text-Antwort für ${spec.slug}`);
  }
  const text = block.text.trim();
  const jsonText = stripCodeFences(text);

  let content: LessonContent;
  try {
    content = JSON.parse(jsonText) as LessonContent;
  } catch {
    // Häufiger LLM-Fehler: unescapte Anführungszeichen in Strings.
    // jsonrepair fixt das robust statt mit Prompt-Engineering nachzulaufen.
    try {
      const repaired = jsonrepair(jsonText);
      content = JSON.parse(repaired) as LessonContent;
      console.log(`  🛠  ${spec.slug}: JSON via jsonrepair gerettet`);
    } catch (err) {
      throw new Error(
        `Konnte JSON für ${spec.slug} auch nach jsonrepair nicht parsen: ${(err as Error).message}\n\n--- Rohtext ---\n${text.slice(0, 800)}`,
      );
    }
  }

  // Basis-Sanity-Checks
  if (content.slug !== spec.slug) {
    console.warn(`  ⚠ slug mismatch für ${spec.slug} → ${content.slug}, korrigiere`);
    content.slug = spec.slug;
  }
  if (content.steps.length !== spec.stepOutline.length) {
    console.warn(
      `  ⚠ ${spec.slug}: ${content.steps.length} Steps generiert, erwartet ${spec.stepOutline.length}`,
    );
  }

  await fs.writeFile(outPath, JSON.stringify(content, null, 2) + "\n");
  console.log(`  ✓ ${spec.slug} (${content.steps.length} Steps, ${(response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0)} Tokens)`);
}

function stripCodeFences(text: string): string {
  // Falls Claude doch JSON-Fence drumherum macht
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/m;
  const m = text.match(fence);
  return (m && m[1] ? m[1] : text).trim();
}

async function main() {
  const args = parseArgs();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("❌ ANTHROPIC_API_KEY fehlt. In .env.local setzen.");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const allSpecs = await listSpecs();
  let toGenerate: LessonSpec[] = [];
  if (args.slug) {
    const s = allSpecs.find((x) => x.slug === args.slug);
    if (!s) {
      console.error(`❌ Keine Spec für slug=${args.slug} gefunden in ${SPECS_DIR}`);
      process.exit(1);
    }
    toGenerate = [s];
  } else if (args.all) {
    toGenerate = allSpecs;
  } else {
    console.error("Bitte --slug <slug> oder --all angeben.");
    process.exit(1);
  }

  console.log(`🤖 Lesson-Generator (${MODEL})  Specs: ${toGenerate.length}`);
  for (const spec of toGenerate) {
    try {
      await generateOne(client, spec, args.force ?? false);
    } catch (err) {
      console.error(`❌ Fehler bei ${spec.slug}: ${(err as Error).message}`);
    }
  }
  console.log("✅ fertig");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
