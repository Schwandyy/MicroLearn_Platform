// Heuristisches Lesson-Qualitäts-Audit für Anfänger-Tauglichkeit (Grundschule).
// Kein LLM nötig — misst objektive Lesbarkeits-Signale.
//
// Metriken:
// - Body-Länge pro Step (> 350 Zeichen = Markdown-Wand-Risiko)
// - BUILD-Steps ohne Bild
// - Komplexe Wörter (> 16 Zeichen) — Compound-Nouns die ein Kind nicht parst
// - Sehr lange Sätze (> 25 Wörter) — schwer zu folgen
// - Wörter mit Fachjargon ohne Erklärung im selben Step
//
// Read-only — kein DB-Write.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const JARGON_TERMS = [
  "Konfiguration",
  "Initialisierung",
  "Compiler",
  "Boardverwalter",
  "Bootloader",
  "Toolchain",
];

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+\s/).filter((s) => s.trim().length > 0).length;
}

function longestSentence(text: string): { words: number; sentence: string } {
  const sentences = text.split(/[.!?]+\s/);
  let best = { words: 0, sentence: "" };
  for (const s of sentences) {
    const w = countWords(s);
    if (w > best.words) best = { words: w, sentence: s.trim() };
  }
  return best;
}

function longWords(text: string): string[] {
  const words = text.match(/[A-Za-zÄÖÜäöüß]+/g) ?? [];
  const long = new Set<string>();
  for (const w of words) {
    if (w.length >= 17) long.add(w);
  }
  return Array.from(long);
}

function jargonHits(text: string): string[] {
  const hits: string[] = [];
  for (const term of JARGON_TERMS) {
    if (text.includes(term)) hits.push(term);
  }
  return hits;
}

type Issue = {
  lessonSlug: string;
  stepIndex: number;
  stepKind: string;
  severity: "high" | "medium" | "low";
  category: string;
  detail: string;
};

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { steps: { orderBy: { sortOrder: "asc" } } },
  });

  const issues: Issue[] = [];

  for (const l of lessons) {
    for (const step of l.steps) {
      const body = step.body_de ?? "";
      if (!body) continue;

      // 1. Body-Länge
      if (body.length > 500) {
        issues.push({
          lessonSlug: l.slug,
          stepIndex: step.sortOrder,
          stepKind: step.kind,
          severity: "high",
          category: "Markdown-Wand",
          detail: `Body ${body.length} Zeichen — Step zu lang für Grundschüler.`,
        });
      } else if (body.length > 350) {
        issues.push({
          lessonSlug: l.slug,
          stepIndex: step.sortOrder,
          stepKind: step.kind,
          severity: "medium",
          category: "Body-Länge",
          detail: `Body ${body.length} Zeichen — knapp an der Grenze.`,
        });
      }

      // 2. EXPLAIN ohne Visual-Anker. BUILD-Steps haben per Default ein
      //    <Breadboard>; EXPLAIN nur wenn payload.highlightPin oder
      //    payload.showBreadboardExplainer gesetzt ist.
      if (step.kind === "EXPLAIN") {
        const p = (step.payload as Record<string, unknown> | null) ?? {};
        const hasVisual =
          step.imageUrl ||
          p.highlightPin ||
          p.showBreadboardExplainer ||
          p.breadboard;
        if (!hasVisual) {
          issues.push({
            lessonSlug: l.slug,
            stepIndex: step.sortOrder,
            stepKind: step.kind,
            severity: "high",
            category: "EXPLAIN ohne Visual",
            detail: "EXPLAIN braucht highlightPin oder showBreadboardExplainer im payload.",
          });
        }
      }

      // 3. Lange Sätze
      const long = longestSentence(body);
      if (long.words > 30) {
        issues.push({
          lessonSlug: l.slug,
          stepIndex: step.sortOrder,
          stepKind: step.kind,
          severity: "medium",
          category: "Bandwurmsatz",
          detail: `Satz mit ${long.words} Wörtern: „${long.sentence.slice(0, 70)}…"`,
        });
      }

      // 4. Lange Wörter (Compound-Nouns)
      const lw = longWords(body);
      if (lw.length >= 2) {
        issues.push({
          lessonSlug: l.slug,
          stepIndex: step.sortOrder,
          stepKind: step.kind,
          severity: "low",
          category: "Lange Wörter",
          detail: `${lw.slice(0, 3).join(", ")} — evtl. zerlegen.`,
        });
      }

      // 5. Jargon ohne Erklärung
      const jh = jargonHits(body);
      if (jh.length > 0) {
        issues.push({
          lessonSlug: l.slug,
          stepIndex: step.sortOrder,
          stepKind: step.kind,
          severity: "low",
          category: "Jargon",
          detail: `${jh.join(", ")} — für Kind erklären.`,
        });
      }
    }
  }

  // Gruppierung
  const bySeverity = { high: 0, medium: 0, low: 0 };
  const byLesson = new Map<string, number>();
  for (const i of issues) {
    bySeverity[i.severity] += 1;
    byLesson.set(i.lessonSlug, (byLesson.get(i.lessonSlug) ?? 0) + 1);
  }

  console.log("\n=== LESSON-QUALITÄTS-AUDIT (Heuristik) ===\n");
  // Top-Lessons nach Issue-Count
  const ranked = Array.from(byLesson.entries()).sort((a, b) => b[1] - a[1]);
  console.log("Issues pro Lesson:");
  for (const [slug, count] of ranked) {
    console.log(`  ${count.toString().padStart(3)} · ${slug}`);
  }

  console.log("\n--- High-Severity-Issues ---");
  for (const i of issues.filter((x) => x.severity === "high")) {
    console.log(
      `[${i.lessonSlug}#${i.stepIndex} ${i.stepKind}] ${i.category}: ${i.detail}`,
    );
  }

  console.log("\n--- Zusammenfassung ---");
  console.log(`high:   ${bySeverity.high}`);
  console.log(`medium: ${bySeverity.medium}`);
  console.log(`low:    ${bySeverity.low}`);
  console.log(`total:  ${issues.length}`);
  console.log(`Lessons mit Issues: ${byLesson.size}/${lessons.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
