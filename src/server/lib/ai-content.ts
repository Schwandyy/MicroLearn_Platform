import "server-only";
import { requireAnthropic, ANTHROPIC_MODEL_CONTENT } from "./anthropic";
import type Anthropic from "@anthropic-ai/sdk";

const CONTENT_SYSTEM_PROMPT = `Du bist ein erfahrener Mikroelektronik-Pädagoge und technischer Redakteur für MicroLearn (DACH-Raum).
Du bekommst rohe Tutorial-Inhalte aus dem Netz (Markdown, manchmal HTML-Reste) und destillierst daraus eine eigenständige, originale Lerneinheit in DE *und* EN.

Liefere AUSSCHLIESSLICH valides JSON in genau diesem Schema, ohne Markdown-Codefences:
{
  "title_de": string,
  "title_en": string,
  "summary_de": string,            // 1-2 Sätze
  "summary_en": string,            // 1-2 Sätze
  "body_de": string,               // Markdown, 200-800 Worte, eigenständig erklärt, keine direkten Zitate
  "body_en": string,               // Markdown, idem
  "codeSnippet": string|null,      // C/C++ oder MicroPython, mit zweisprachigen Kommentaren (DE in einer Zeile, EN in der nächsten)
  "schematicNotes_de": string|null,
  "schematicNotes_en": string|null,
  "safetyNotes_de": string|null,   // KONKRETE Hinweise (Spannung, Strom, Hitze), keine Floskeln
  "safetyNotes_en": string|null,
  "level": "L1_BEGINNER"|"L2_NOVICE"|"L3_INTERMEDIATE"|"L4_EXPERT",
  "estimatedMinutes": number,      // realistisch (15-120)
  "kind": "CONCEPT"|"PROJECT",
  "boardSlugs": string[],          // aus: esp32-devkit-v1, arduino-uno-r3, arduino-nano, esp8266-nodemcu, raspberry-pi-pico
  "wokwiProjectId": string|null,   // nur falls in Quelle eindeutig vorhanden
  "bom": [{ "name": string, "quantity": number, "note_de": string, "note_en": string }],
  "tags": string[]
}

Strikte Regeln:
- Keine Plagiate. Schreibe in eigenen Worten — die Quelle ist Inspiration, nicht Vorlage.
- Sicherheit zuerst: bei Netzspannung, LiPo, Lötkolben, Hochstrom IMMER konkrete Warnungen.
- Logikpegel: ESP32 = 3,3 V, Arduino Uno = 5 V. Bei 5V-Sensoren am ESP32 explizit Pegelwandler / Spannungsteiler erwähnen.
- DE und EN sind eigenständig formuliert, nicht maschinell übersetzt.
- estimatedMinutes ehrlich.
- Wenn die Quelle zu dünn / off-topic ist, antworte: {"reject":"<Grund>"}.`;

export interface GeneratedLesson {
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  body_de: string;
  body_en: string;
  codeSnippet: string | null;
  schematicNotes_de: string | null;
  schematicNotes_en: string | null;
  safetyNotes_de: string | null;
  safetyNotes_en: string | null;
  level: "L1_BEGINNER" | "L2_NOVICE" | "L3_INTERMEDIATE" | "L4_EXPERT";
  estimatedMinutes: number;
  kind: "CONCEPT" | "PROJECT";
  boardSlugs: string[];
  wokwiProjectId: string | null;
  bom: { name: string; quantity: number; note_de: string; note_en: string }[];
  tags: string[];
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
