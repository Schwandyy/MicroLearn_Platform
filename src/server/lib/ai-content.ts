import "server-only";
import { requireAnthropic, ANTHROPIC_MODEL_CONTENT } from "./anthropic";
import type Anthropic from "@anthropic-ai/sdk";

const CONTENT_SYSTEM_PROMPT = `Du bist ein erfahrener Mikroelektronik-Pädagoge und technischer Redakteur für MicroLearn (DACH-Raum).
Du bekommst rohe Tutorial-Inhalte aus dem Netz (Markdown, manchmal HTML-Reste) und destillierst daraus eine eigenständige, originale Lerneinheit in DE *und* EN als **Step-Player** für Anfänger.

ZIEL: Ein Schulkind der 1. Klasse soll die Lerneinheit alleine durcharbeiten können. Ein Schritt pro Bildschirm.

Liefere AUSSCHLIESSLICH valides JSON in genau diesem Schema, ohne Markdown-Codefences:
{
  "title_de": string,                  // kurz, neugierig-machend ("Eine LED zum Blinken bringen")
  "title_en": string,
  "summary_de": string,                // 1-2 Sätze: "Was bauen wir und warum?"
  "summary_en": string,
  "safetyNotes_de": string|null,       // KONKRETE Hinweise (Spannung, Strom, Hitze, Polung), keine Floskeln
  "safetyNotes_en": string|null,
  "codeSnippet": string|null,          // C/C++ oder MicroPython, mit kindgerechten Kommentaren
  "level": "L1_BEGINNER"|"L2_NOVICE"|"L3_INTERMEDIATE"|"L4_EXPERT",
  "estimatedMinutes": number,
  "kind": "CONCEPT"|"PROJECT",
  "boardSlugs": string[],              // aus: esp32-devkit-v1, arduino-uno-r3, arduino-nano, esp8266-nodemcu, raspberry-pi-pico
  "bom": [{ "name": string, "quantity": number, "note_de": string, "note_en": string }],
  "tags": string[],
  "steps": [
    {
      "kind": "INTRO"|"PARTS"|"SAFETY"|"BUILD"|"CODE_WALK"|"SIMULATE"|"QUIZ"|"CELEBRATE"|"EXPLAIN",
      "title_de": string,              // kurze Überschrift, max 8 Wörter
      "title_en": string,
      "body_de": string,               // 1-3 kurze Sätze, Kindersprache
      "body_en": string,
      "payload": object|null           // step-spezifische Daten (s.u.)
    }
  ]
}

STEP-PAYLOAD-FORMATE (kind → payload):
- INTRO: { "coverPrompt": string }     // Bild-Prompt für Cover (KI generiert oder Asset)
- PARTS: null                          // wird vom UI aus BOM zusammengesetzt
- SAFETY: null                         // wird aus safetyNotes zusammengesetzt
- BUILD: { "instruction_de": string, "instruction_en": string, "diagramHint": string }   // z.B. "LED langes Bein → GPIO2 über 220Ω"
- CODE_WALK: { "code": string, "lines": [{ "from": int, "to": int, "explain_de": string, "explain_en": string }] }
- SIMULATE: { "expectedBehavior_de": string, "expectedBehavior_en": string, "animation": "blink"|"solid"|"fade"|"pulse" }
- QUIZ: { "prompt_de": string, "prompt_en": string, "options": [{"key":"a","label_de":"","label_en":""}], "correctKey": string }
- CELEBRATE: { "xpAward": int }
- EXPLAIN: { "imagePrompt": string|null, "keyPoint_de": string, "keyPoint_en": string }

STRIKTE REGELN:
- Step-Sequenz ist immer: INTRO → PARTS → SAFETY → BUILD (mehrere) → CODE_WALK → SIMULATE → QUIZ → CELEBRATE
- Bei BUILD und CODE_WALK gilt: **ein Konzept pro Step**, nicht alles in einem Riesen-Step bündeln.
- Sprache so einfach wie möglich. Keine Fachbegriffe ohne vorherige Erklärung im EXPLAIN-Step.
- Keine Verweise auf externe Sites/Apps/Simulatoren — MicroLearn ist eigenständig.
- Sicherheit zuerst: ein expliziter SAFETY-Step vor jedem BUILD.
- Logikpegel: ESP32 = 3,3 V, Arduino Uno = 5 V. Bei 5V-Sensoren am ESP32 Pegelwandler erwähnen.
- DE und EN eigenständig formuliert, nicht maschinell übersetzt.
- Wenn die Quelle zu dünn ist: {"reject":"<Grund>"}.`;

export type StepKindLiteral =
  | "INTRO"
  | "PARTS"
  | "SAFETY"
  | "BUILD"
  | "CODE_WALK"
  | "SIMULATE"
  | "QUIZ"
  | "CELEBRATE"
  | "EXPLAIN";

export interface GeneratedStep {
  kind: StepKindLiteral;
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
  payload: Record<string, unknown> | null;
}

export interface GeneratedLesson {
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  codeSnippet: string | null;
  safetyNotes_de: string | null;
  safetyNotes_en: string | null;
  level: "L1_BEGINNER" | "L2_NOVICE" | "L3_INTERMEDIATE" | "L4_EXPERT";
  estimatedMinutes: number;
  kind: "CONCEPT" | "PROJECT";
  boardSlugs: string[];
  bom: { name: string; quantity: number; note_de: string; note_en: string }[];
  tags: string[];
  steps: GeneratedStep[];
}

export interface GenerationResult {
  lesson?: GeneratedLesson;
  reject?: string;
  raw: string;
}

function stripJsonFences(s: string): string {
  return s
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export async function generateLessonFromScrape(input: {
  sourceTitle?: string | null;
  sourceUrl: string;
  markdown: string;
}): Promise<GenerationResult> {
  const client = requireAnthropic();
  const trimmed = input.markdown.slice(0, 18_000);

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL_CONTENT,
    max_tokens: 6000,
    system: [
      {
        type: "text",
        text: CONTENT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Quelle: ${input.sourceUrl}
Titel der Quelle: ${input.sourceTitle ?? "(unbekannt)"}

--- ROH-INHALT START ---
${trimmed}
--- ROH-INHALT ENDE ---

Erstelle die strukturierte Lerneinheit als JSON.`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const cleaned = stripJsonFences(text);
  try {
    const parsed = JSON.parse(cleaned) as Partial<GeneratedLesson> & {
      reject?: string;
    };
    if (parsed.reject) return { reject: parsed.reject, raw: text };
    return { lesson: parsed as GeneratedLesson, raw: text };
  } catch {
    return { reject: "Parse error", raw: text };
  }
}

const PRECHECK_SYSTEM_PROMPT = `Du bist ein technischer Reviewer für MicroLearn. Du bekommst eine vorgeschlagene Lerneinheit und prüfst sie nach diesen Kriterien:
1. SAFETY — sind alle relevanten Sicherheitsrisiken benannt (Netzspannung, Polung, Strom, Hitze)?
2. LOGIC — ist der elektrische Aufbau plausibel und der Code passend dazu?
3. COMPATIBILITY — passen Logikpegel, Spannungen und Protokolle zu den genannten Boards?
4. LANGUAGE — sind DE und EN flüssig, eigenständig und ohne Übersetzungs-Artefakte?

Antworte AUSSCHLIESSLICH mit JSON:
{
  "flags": [{
    "kind": "SAFETY"|"LOGIC"|"COMPATIBILITY"|"LANGUAGE",
    "severity": "INFO"|"WARN"|"BLOCKER",
    "note_de": string,
    "note_en": string
  }],
  "overall": "PASS"|"WARN"|"FAIL",
  "summary_de": string,
  "summary_en": string
}

BLOCKER nur, wenn etwas wirklich gefährlich oder grob falsch ist (z.B. fehlender Vorwiderstand für LED, 5V an 3.3V-Pin ohne Pegelwandler, fehlende Warnung bei Netzspannung).`;

export interface PreCheckReport {
  flags: {
    kind: "SAFETY" | "LOGIC" | "COMPATIBILITY" | "LANGUAGE";
    severity: "INFO" | "WARN" | "BLOCKER";
    note_de: string;
    note_en: string;
  }[];
  overall: "PASS" | "WARN" | "FAIL";
  summary_de: string;
  summary_en: string;
}

export async function aiPreCheck(lesson: GeneratedLesson): Promise<PreCheckReport> {
  const client = requireAnthropic();
  const response = await client.messages.create({
    model: ANTHROPIC_MODEL_CONTENT,
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: PRECHECK_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Lerneinheit (JSON):\n${JSON.stringify(lesson, null, 2)}`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const cleaned = stripJsonFences(text);
  return JSON.parse(cleaned) as PreCheckReport;
}
