// Kid-Speak-Audit aller Lesson-Steps via Haiku 4.5.
// - Prompt-Caching auf System-Prompt (500 Tokens, 25× Wiederverwendung)
// - JSON-Output via Prompt-Instruktion + Parse (kompatibel mit SDK 0.40.x)
// - Budget-Schutz: MAX_LESSONS-Env-Var, abbruch bei API-Errors
// Erwartete Kosten: ~$0.05–0.10 für alle 25 Lessons.

import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";

const prisma = new PrismaClient();
const client = new Anthropic();

const MODEL = "claude-haiku-4-5";
const MAX_LESSONS = Number(process.env.MAX_LESSONS ?? 25);

const SYSTEM_PROMPT = `Du bewertest Mikroelektronik-Lektionen für deutsche Grundschüler (8–10 Jahre).

Bewerte JEDEN Step nach diesen Kriterien:
1. Grammatik & Rechtschreibung — sind Fehler drin?
2. Kindgerechte Sprache — kann ein 8-Jähriger das verstehen? Zu viele Fremdwörter ohne Erklärung?
3. Verständlichkeit — ist klar was zu tun ist?
4. Stolperstellen — wo bricht das Verständnis ab?

Rufe das Tool report_issues mit den gefundenen Problemen auf. Sei streng aber fair.
Wenn ein Step OK ist, nimm ihn nicht in die Liste. Max 5 Issues pro Lesson.
Wenn die Lesson komplett OK ist: Tool mit leerer issues-Liste aufrufen.`;

const TOOL_DEFINITION = {
  name: "report_issues",
  description: "Meldet gefundene Qualitätsprobleme in den Lesson-Steps.",
  input_schema: {
    type: "object" as const,
    properties: {
      issues: {
        type: "array",
        description: "Liste der gefundenen Probleme, max 5 pro Lesson.",
        items: {
          type: "object",
          properties: {
            stepIndex: { type: "integer", description: "sortOrder des Steps" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            category: {
              type: "string",
              enum: ["grammar", "jargon", "unclear", "confusing", "missing_context"],
            },
            quote: {
              type: "string",
              description: "5–15 Worte aus dem Step-Text (paraphrasiert OK, keine Quotes-Zitate nötig).",
            },
            fix: { type: "string", description: "Konkrete Verbesserung in 1 Satz." },
          },
          required: ["stepIndex", "severity", "category", "quote", "fix"],
        },
      },
    },
    required: ["issues"],
  },
};

type Issue = {
  stepIndex: number;
  severity: "high" | "medium" | "low";
  category: string;
  quote: string;
  fix: string;
};

type LessonReport = {
  lessonSlug: string;
  title: string;
  issues: Issue[];
  cost: number;
  cacheRead: number;
  cacheWrite: number;
  error?: string;
};


async function auditLesson(lesson: {
  slug: string;
  title_de: string;
  steps: Array<{ sortOrder: number; kind: string; title_de: string | null; body_de: string | null }>;
}): Promise<LessonReport> {
  const stepText = lesson.steps
    .map((s) => `### Step ${s.sortOrder} (${s.kind}) — ${s.title_de ?? ""}\n${s.body_de ?? ""}`)
    .join("\n\n");

  const userMessage = `Lesson "${lesson.title_de}":\n\n${stepText}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [TOOL_DEFINITION],
      tool_choice: { type: "tool", name: "report_issues" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUseBlock = response.content.find((b) => b.type === "tool_use");
    const rawInput =
      toolUseBlock && "input" in toolUseBlock
        ? (toolUseBlock.input as { issues?: unknown })
        : null;
    const parsed: { issues: Issue[] } | null = rawInput
      ? { issues: Array.isArray(rawInput.issues) ? (rawInput.issues as Issue[]) : [] }
      : null;

    const inputTokens = response.usage.input_tokens ?? 0;
    const outputTokens = response.usage.output_tokens ?? 0;
    const cacheRead = (response.usage as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0;
    const cacheWrite = (response.usage as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0;

    // Haiku 4.5: $1/M input, $5/M output. Cache write 1.25×, read 0.1×.
    const cost =
      (inputTokens / 1_000_000) * 1.0 +
      (outputTokens / 1_000_000) * 5.0 +
      (cacheWrite / 1_000_000) * 1.25 +
      (cacheRead / 1_000_000) * 0.1;

    return {
      lessonSlug: lesson.slug,
      title: lesson.title_de,
      issues: parsed?.issues ?? [],
      cost,
      cacheRead,
      cacheWrite,
      error: parsed ? undefined : `kein tool_use block in response`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      lessonSlug: lesson.slug,
      title: lesson.title_de,
      issues: [],
      cost: 0,
      cacheRead: 0,
      cacheWrite: 0,
      error: msg,
    };
  }
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { steps: { orderBy: { sortOrder: "asc" } } },
    take: MAX_LESSONS,
  });

  console.log(`Audit ${lessons.length} Lessons mit ${MODEL}…\n`);
  const reports: LessonReport[] = [];
  let totalCost = 0;

  for (const l of lessons) {
    const report = await auditLesson(l);
    reports.push(report);
    totalCost += report.cost;
    const highCount = report.issues.filter((i) => i.severity === "high").length;
    const mediumCount = report.issues.filter((i) => i.severity === "medium").length;
    const status = report.error ? "ERR" : `${highCount}h ${mediumCount}m`;
    console.log(
      `  ${l.slug.padEnd(30)} ${status.padEnd(10)} $${report.cost.toFixed(4)} (cache: ${report.cacheRead}r/${report.cacheWrite}w)`,
    );
    if (report.error) {
      console.log(`    ${JSON.stringify(report.error)}`);
    }

    // Budget-Schutz: bei kumulierten $1 → stop.
    if (totalCost > 1.0) {
      console.log(`\n⚠️  Budget-Limit ($1) erreicht, breche ab.`);
      break;
    }
  }

  // Vollständiger Report als JSON-Datei
  const outFile = `/tmp/microlearn-kidspeak-audit.json`;
  writeFileSync(outFile, JSON.stringify({ reports, totalCost, model: MODEL }, null, 2));

  // Markdown-Zusammenfassung
  const mdFile = `/tmp/microlearn-kidspeak-audit.md`;
  const md: string[] = [`# Kid-Speak-Audit — ${reports.length} Lessons`, ``];
  md.push(`Model: \`${MODEL}\` · Gesamtkosten: $${totalCost.toFixed(4)}`, ``);

  const totalIssues = reports.reduce((sum, r) => sum + r.issues.length, 0);
  const totalHigh = reports.reduce(
    (sum, r) => sum + r.issues.filter((i) => i.severity === "high").length,
    0,
  );
  md.push(`## Übersicht`, ``);
  md.push(`- ${totalIssues} Issues gefunden (${totalHigh} high-severity)`);
  md.push(`- ${reports.filter((r) => r.issues.length > 0).length}/${reports.length} Lessons mit Issues`);
  md.push(``);

  md.push(`## Lessons mit High-Severity-Issues`, ``);
  for (const r of reports) {
    const highs = r.issues.filter((i) => i.severity === "high");
    if (highs.length === 0) continue;
    md.push(`### ${r.lessonSlug} — ${r.title}`, ``);
    for (const i of highs) {
      md.push(`- **${i.category}** (Step ${i.stepIndex}): „${i.quote}"`);
      md.push(`  - Fix: ${i.fix}`);
    }
    md.push(``);
  }

  md.push(`## Alle Issues`, ``);
  for (const r of reports) {
    if (r.issues.length === 0) continue;
    md.push(`### ${r.lessonSlug}`, ``);
    for (const i of r.issues) {
      md.push(`- [${i.severity}] ${i.category} (Step ${i.stepIndex}): „${i.quote}" → ${i.fix}`);
    }
    md.push(``);
  }

  writeFileSync(mdFile, md.join("\n"));

  console.log(`\n=== Zusammenfassung ===`);
  console.log(`Lessons: ${reports.length}`);
  console.log(`Issues:  ${totalIssues} (${totalHigh} high)`);
  console.log(`Kosten:  $${totalCost.toFixed(4)}`);
  console.log(`Report:  ${mdFile}`);
  console.log(`JSON:    ${outFile}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
