// Fakten-Audit aller Lessons via Claude Sonnet (Reviewer-Rolle).
//
// Ziel: finden, was Kid-Speak-Audit NICHT findet:
//   - Falsche GPIO-/Pin-Belegung
//   - Falsche Pull-Up/Pull-Down / Polarität / Widerstandswert
//   - Code-Bugs (falsche pinMode, falsche Logik, copy-paste-Fehler)
//   - Quiz: markierte Antwort tatsächlich richtig?
//   - Begriff vor Erklärung verwendet (Reihenfolge-Bruch)
//   - Schaltbeschreibung passt nicht zum Code
//   - BOM enthält nicht alles was im Code/Build verwendet wird
//   - Sicherheitsangaben fachlich falsch
//
// Read-only — kein DB-Write. Output: docs/audits/lesson-facts-YYYY-MM-DD.md
// Budget: Sonnet 4.6 mit prompt-caching auf System-Prompt.
// MAX_LESSONS env caps the run for sanity checks.

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const prisma = new PrismaClient();

const MODEL = process.env.AUDIT_MODEL ?? "claude-sonnet-4-6";
const MAX_LESSONS = process.env.MAX_LESSONS
  ? Number.parseInt(process.env.MAX_LESSONS, 10)
  : null;

type Severity = "critical" | "major" | "minor";

type Finding = {
  stepSortOrder: number | null;
  stepKind: string | null;
  severity: Severity;
  category:
    | "pin-wiring"
    | "code-bug"
    | "quiz-wrong"
    | "term-order"
    | "schematic-mismatch"
    | "bom-mismatch"
    | "safety"
    | "factual-other";
  detail: string;
  fix_suggestion: string;
};

type Result = {
  lessonSlug: string;
  lessonTitle: string;
  findings: Finding[];
  raw?: string;
};

const SYSTEM_PROMPT = `You are a senior electronics teacher reviewing a MicroLearn lesson for 9–14 year-old students. The lesson is in German. Be a strict, factual auditor — NOT a copy editor.

Find ONLY substantive errors. Do not nitpick wording, capitalization or style. The kid-speak pass already happened.

Focus categories (pick the one that fits best):
- pin-wiring:        wrong GPIO number, wrong resistor value, wrong polarity, wrong pull-up/down direction, missing GND/3V3 connection
- code-bug:          compile error, wrong pinMode/digital-vs-analog mismatch, off-by-one, dead/unreachable code, library calls with wrong args
- quiz-wrong:        the answer marked correct is in fact wrong, or two answers are equally correct, or a distractor is accidentally right
- term-order:        a term (e.g. "PWM", "GND", "Pull-Up") is used before it is introduced anywhere in the lesson
- schematic-mismatch: the textual description of the circuit contradicts the code (e.g. text says GPIO 4, code uses GPIO 5)
- bom-mismatch:      the build uses a part that isn't in the BOM, or the BOM lists something the lesson doesn't use
- safety:            a safety claim is factually wrong (voltage limits, polarity warnings)
- factual-other:     other factual errors that would mislead a learner

Severity:
- critical: would make the lesson NOT WORK on real hardware, or actively mislead about how electronics works.
- major:    would confuse a learner enough that they can't finish without help.
- minor:    technically wrong but small (e.g. value is plausible but suboptimal, comment is misleading).

Be EXTREMELY conservative — only report what you can defend in front of an electronics teacher. If unsure, do not report.

Use the report_findings tool to return your audit. If you find nothing, call it with an empty findings array. Never invent findings.`;

const FINDINGS_TOOL = {
  name: "report_findings",
  description: "Report all substantive errors found in the lesson.",
  input_schema: {
    type: "object" as const,
    properties: {
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stepSortOrder: {
              type: ["integer", "null"],
              description: "sortOrder of the offending step, null if lesson-wide",
            },
            stepKind: {
              type: ["string", "null"],
              description: "kind of the step (INTRO, BUILD, …) or null",
            },
            severity: {
              type: "string",
              enum: ["critical", "major", "minor"],
            },
            category: {
              type: "string",
              enum: [
                "pin-wiring",
                "code-bug",
                "quiz-wrong",
                "term-order",
                "schematic-mismatch",
                "bom-mismatch",
                "safety",
                "factual-other",
              ],
            },
            detail: {
              type: "string",
              description: "One sentence in German describing the error.",
            },
            fix_suggestion: {
              type: "string",
              description: "One sentence in German with concrete fix.",
            },
          },
          required: ["severity", "category", "detail", "fix_suggestion"],
        },
      },
    },
    required: ["findings"],
  },
};

function extractJson(text: string): string {
  // Strategy 1: properly fenced ```json … ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1];
  // Strategy 2: opening fence without closing (truncated output) — take everything after it
  const openFence = text.match(/```(?:json)?\s*([\s\S]*)$/i);
  if (openFence) return openFence[1];
  // Strategy 3: greedy {…} from first { to last }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text;
}

function fmtStep(s: {
  sortOrder: number;
  kind: string;
  title_de: string;
  body_de: string;
  payload: unknown;
}): string {
  const payloadText = s.payload
    ? "\n  payload: " + JSON.stringify(s.payload).slice(0, 1200)
    : "";
  return `Step ${s.sortOrder} [${s.kind}] "${s.title_de}":\n  ${s.body_de.slice(0, 1200)}${payloadText}`;
}

async function auditOne(
  client: Anthropic,
  lesson: {
    slug: string;
    title_de: string;
    summary_de: string;
    body_de: string;
    codeSnippet: string | null;
    safetyNotes_de: string | null;
    steps: Array<{
      sortOrder: number;
      kind: string;
      title_de: string;
      body_de: string;
      payload: unknown;
    }>;
    bom: Array<{
      quantity: number;
      note_de: string | null;
      component: { name: string } | null;
      board: { name: string } | null;
    }>;
    quizzes: Array<{
      kind: string;
      title_de: string;
      questions: unknown;
    }>;
  },
): Promise<Result> {
  const stepsText = lesson.steps.map(fmtStep).join("\n\n");
  const bomText = lesson.bom.length
    ? lesson.bom
        .map((b) => {
          const label = b.component?.name ?? b.board?.name ?? "(unbenannt)";
          const note = b.note_de ? ` — ${b.note_de}` : "";
          return `  - ${b.quantity}× ${label}${note}`;
        })
        .join("\n")
    : "  (leer)";
  const codeText = lesson.codeSnippet
    ? lesson.codeSnippet.slice(0, 2000)
    : "(kein Code-Snippet)";
  const quizText = lesson.quizzes.length
    ? lesson.quizzes
        .map((q, i) => {
          const qs = Array.isArray(q.questions) ? (q.questions as Array<{
            prompt_de?: string;
            options?: Array<{ key?: string; label_de?: string }>;
            correctKey?: string;
          }>) : [];
          const body = qs
            .map((qq, k) => {
              const opts = (qq.options ?? [])
                .map(
                  (o) =>
                    `    ${o.key === qq.correctKey ? "[KORREKT] " : ""}${o.key}) ${o.label_de ?? ""}`,
                )
                .join("\n");
              return `  Frage ${k + 1}: ${qq.prompt_de ?? ""}\n${opts}`;
            })
            .join("\n");
          return `Quiz ${i + 1} [${q.kind}] "${q.title_de}":\n${body}`;
        })
        .join("\n\n")
    : "(keine Quizzes)";

  const userMessage = `LESSON: ${lesson.slug}
Titel: ${lesson.title_de}
Summary: ${lesson.summary_de}

BODY:
${lesson.body_de.slice(0, 1500)}

STEPS (${lesson.steps.length}):
${stepsText}

CODE-SNIPPET:
\`\`\`cpp
${codeText}
\`\`\`

BOM:
${bomText}

QUIZZES:
${quizText}

SAFETY-NOTES:
${lesson.safetyNotes_de ?? "(keine)"}

Audit die Lesson. Antworte ausschließlich mit dem JSON-Schema.`;

  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    temperature: 0,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [FINDINGS_TOOL],
    tool_choice: { type: "tool", name: "report_findings" },
    messages: [{ role: "user", content: userMessage }],
  });

  let findings: Finding[] = [];
  const toolBlock = res.content.find((b) => b.type === "tool_use");
  if (toolBlock && toolBlock.type === "tool_use") {
    const input = toolBlock.input as { findings?: Finding[] };
    if (Array.isArray(input?.findings)) findings = input.findings;
  } else {
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return {
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title_de,
      findings: [],
      raw: text.slice(0, 1500),
    };
  }

  return {
    lessonSlug: lesson.slug,
    lessonTitle: lesson.title_de,
    findings,
  };
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY missing. Set it in .env.local.");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      bom: {
        include: {
          component: { select: { name: true } },
          board: { select: { name: true } },
        },
      },
      quizzes: true,
    },
    take: MAX_LESSONS ?? undefined,
  });

  console.error(`Auditing ${lessons.length} lessons with ${MODEL}…`);

  const results: Result[] = [];
  for (const l of lessons) {
    process.stderr.write(`  - ${l.slug} … `);
    try {
      const r = await auditOne(client, l);
      results.push(r);
      const counts = r.findings.reduce<Record<string, number>>((acc, f) => {
        acc[f.severity] = (acc[f.severity] ?? 0) + 1;
        return acc;
      }, {});
      const summary = Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ") || "0 issues";
      process.stderr.write(`${summary}\n`);
    } catch (e) {
      console.error(`ERROR auditing ${l.slug}: ${(e as Error).message}`);
    }
  }

  // Aggregate
  const all = results.flatMap((r) =>
    r.findings.map((f) => ({ ...f, slug: r.lessonSlug, title: r.lessonTitle })),
  );
  const bySev = (s: Severity) => all.filter((f) => f.severity === s);

  const today = new Date().toISOString().slice(0, 10);
  const outDir = resolve(process.cwd(), "docs/audits");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `lesson-facts-${today}.md`);

  const lines: string[] = [];
  lines.push(`# Lesson-Fakten-Audit ${today}`);
  lines.push("");
  lines.push(`Model: \`${MODEL}\` · Lessons: ${lessons.length}`);
  lines.push("");
  lines.push(`**Total findings:** ${all.length} (${bySev("critical").length} critical / ${bySev("major").length} major / ${bySev("minor").length} minor)`);
  lines.push("");

  for (const sev of ["critical", "major", "minor"] as Severity[]) {
    const subset = bySev(sev);
    if (subset.length === 0) continue;
    lines.push(`## ${sev.toUpperCase()} (${subset.length})`);
    lines.push("");
    for (const f of subset) {
      const where = f.stepSortOrder !== null
        ? `Step ${f.stepSortOrder}${f.stepKind ? ` [${f.stepKind}]` : ""}`
        : "lesson-wide";
      lines.push(`### \`${f.slug}\` — ${f.title}`);
      lines.push(`- **Where:** ${where}`);
      lines.push(`- **Category:** ${f.category}`);
      lines.push(`- **Problem:** ${f.detail}`);
      lines.push(`- **Fix:** ${f.fix_suggestion}`);
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## Per-Lesson Übersicht");
  lines.push("");
  for (const r of results) {
    const counts = r.findings.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});
    const summary =
      Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(" · ") || "clean";
    lines.push(`- \`${r.lessonSlug}\` — ${r.lessonTitle}: ${summary}`);
    if (r.raw) lines.push(`  - ⚠️ parser failed, raw: ${r.raw.slice(0, 200)}…`);
  }

  writeFileSync(outPath, lines.join("\n"));
  console.error(`\nAudit written to ${outPath}`);
  console.error(
    `Findings: ${bySev("critical").length} critical · ${bySev("major").length} major · ${bySev("minor").length} minor`,
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
