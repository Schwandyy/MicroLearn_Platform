import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

function pick(de: string | null | undefined, en: string | null | undefined, locale: "de" | "en"): string {
  if (locale === "de") return de ?? en ?? "";
  return en ?? de ?? "";
}

type StepPayload = {
  code?: string;
  lineNotes?: Array<{ line?: number; de?: string; en?: string }>;
  breadboard?: { components?: Array<{ de?: string; en?: string }> };
  expected_de?: string;
  expected_en?: string;
  items?: Array<{ de?: string; en?: string; url?: string }>;
  [key: string]: unknown;
};

function renderStep(
  step: {
    kind: string;
    sortOrder: number;
    title_de: string | null;
    title_en: string | null;
    body_de: string | null;
    body_en: string | null;
    imageUrl: string | null;
    payload: unknown;
  },
  locale: "de" | "en",
): string {
  const title = pick(step.title_de, step.title_en, locale) || `Step ${step.sortOrder + 1}`;
  const body = pick(step.body_de, step.body_en, locale);
  const out: string[] = [];
  out.push(`### ${step.sortOrder + 1}. [${step.kind}] ${title}`);
  if (body) out.push("", body);
  if (step.imageUrl) out.push("", `*Bild:* ${step.imageUrl}`);

  const payload = (step.payload ?? {}) as StepPayload;
  if (payload.code) {
    out.push("", "```cpp", payload.code.trim(), "```");
  }
  if (Array.isArray(payload.lineNotes) && payload.lineNotes.length > 0) {
    out.push("", "**Code-Erklärung:**");
    for (const note of payload.lineNotes) {
      const line = note.line ?? "-";
      const text = pick(note.de, note.en, locale);
      if (text) out.push(`- Zeile ${line}: ${text}`);
    }
  }
  if (Array.isArray(payload.items) && payload.items.length > 0) {
    out.push("", "**Schritte:**");
    for (const item of payload.items) {
      const text = pick(item.de, item.en, locale);
      if (text) out.push(`- ${text}${item.url ? ` → ${item.url}` : ""}`);
    }
  }
  const expected = pick(payload.expected_de, payload.expected_en, locale);
  if (expected) out.push("", `**Erwartet:** ${expected}`);
  return out.join("\n");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "de";

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      bom: {
        include: {
          component: { include: { affiliateLinks: { include: { program: true } } } },
          board: { include: { affiliateLinks: { include: { program: true } } } },
        },
      },
      course: true,
      quizzes: true,
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const title = pick(lesson.title_de, lesson.title_en, locale);
  const summary = pick(lesson.summary_de, lesson.summary_en, locale);

  const lines: string[] = [];
  lines.push(`# Build-Anleitung: ${title}`);
  lines.push("");
  lines.push(`> **QA-Verifikation** — bitte physisch nachbauen und unten am Cockpit abhaken.`);
  lines.push(`> Lesson-ID: \`${lesson.id}\` · Slug: \`${lesson.slug}\` · XP: ${lesson.xpReward} · ~${lesson.estimatedMinutes ?? "?"} Min`);
  lines.push("");
  lines.push(`**Ziel:** ${summary}`);
  lines.push("");

  if (lesson.safetyNotes_de || lesson.safetyNotes_en) {
    lines.push("## ⚠️ Sicherheit");
    lines.push(pick(lesson.safetyNotes_de, lesson.safetyNotes_en, locale));
    lines.push("");
  }

  lines.push("## 📦 BOM (Bill of Materials)");
  if (lesson.bom.length === 0) {
    lines.push("_keine BOM-Einträge_");
  } else {
    for (const item of lesson.bom) {
      const name =
        item.component?.name ??
        item.board?.name ??
        pick(item.note_de, item.note_en, locale) ??
        "Teil";
      const link =
        item.component?.affiliateLinks?.[0]?.productUrl ??
        item.board?.affiliateLinks?.[0]?.productUrl ??
        null;
      lines.push(`- **${item.quantity}× ${name}**${link ? ` — [Kaufen](${link})` : ""}`);
    }
  }
  lines.push("");

  if (lesson.codeSnippet) {
    lines.push("## 💻 Haupt-Code");
    lines.push("```cpp");
    lines.push(lesson.codeSnippet.trim());
    lines.push("```");
    lines.push("");
  }

  if (lesson.firmwareUrl) {
    lines.push("## ⚡ Firmware-Flash");
    lines.push(`- Chip: \`${lesson.firmwareChip ?? "?"}\``);
    lines.push(`- Flash-Adresse: \`${lesson.firmwareFlashAddress ?? "0x10000"}\``);
    lines.push(`- Binary: ${lesson.firmwareUrl}`);
    lines.push("");
  }

  lines.push("## 🪜 Schritte");
  lines.push("");
  for (const step of lesson.steps) {
    lines.push(renderStep(step, locale));
    lines.push("");
  }

  lines.push("---");
  lines.push("## ✅ QA-Checkliste (im Cockpit abhaken)");
  lines.push("- [ ] BOM stimmt — alle Teile vorhanden + Affiliate-Links live");
  lines.push("- [ ] Schaltplan / Breadboard-Bild stimmt mit physischem Aufbau überein");
  lines.push("- [ ] Code kompiliert ohne Warnings im aktuellen Arduino-IDE");
  lines.push("- [ ] Flash erfolgreich auf empfohlenem Board");
  lines.push("- [ ] Erwartetes Ergebnis tritt ein (LED blinkt / Sensor liest etc.)");
  lines.push("- [ ] Quiz-Antworten sachlich korrekt + nicht missverständlich");
  lines.push("");
  lines.push("_Notiz an QA: nur wenn ALLE 6 Punkte ✅ sind, Lesson als verifiziert markieren — sonst pending lassen._");

  const markdown = lines.join("\n");
  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="build-guide-${lesson.slug}.md"`,
    },
  });
}
