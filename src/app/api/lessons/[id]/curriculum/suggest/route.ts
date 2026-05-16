import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import {
  requireAnthropic,
  ANTHROPIC_MODEL_CONTENT,
} from "@/server/lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = new Set(["TEACHER", "INSTRUCTOR", "ADMIN"]);

const querySchema = z.object({
  state: z.string().trim().min(2).max(6).optional(),
  grade: z.coerce.number().int().min(1).max(13).optional(),
  locale: z.enum(["de", "en"]).default("de"),
});

type SuggestedStandard = {
  id: string;
  code: string;
  state: string;
  grade: number;
  subject: string;
  title: string;
  reason: string;
  confidence: number;
};

async function canEdit(userId: string, role: string, lessonId: string) {
  if (role === "ADMIN") return true;
  if (!ALLOWED_ROLES.has(role)) return false;
  const review = await prisma.contentReview.findUnique({
    where: { lessonId },
    select: { authorId: true },
  });
  return review?.authorId === userId;
}

/**
 * GET /api/lessons/:id/curriculum/suggest?state=BW&grade=9
 *
 * Picks ≤5 curriculum standards likely covered by this lesson, scoped to the
 * teacher's state + grade if provided. Returns ranked suggestions with a
 * short rationale per pick so the creator can verify before saving.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await canEdit(session.user.id, session.user.role, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const parsedQuery = querySchema.safeParse({
    state: url.searchParams.get("state") ?? undefined,
    grade: url.searchParams.get("grade") ?? undefined,
    locale: url.searchParams.get("locale") ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsedQuery.error.flatten() },
      { status: 400 },
    );
  }
  const { state, grade, locale } = parsedQuery.data;

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      title_de: true,
      title_en: true,
      summary_de: true,
      summary_en: true,
      body_de: true,
      body_en: true,
    },
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  // Candidate pool: standards matching state+grade (if both given), else
  // every standard whose grade is ≤ grade (if only grade given), else
  // every standard. Capped at 80 to keep the prompt cheap.
  const candidates = await prisma.curriculumStandard.findMany({
    where: {
      ...(state ? { state } : {}),
      ...(grade != null ? { grade: { lte: grade } } : {}),
    },
    orderBy: [
      { state: "asc" },
      { grade: "asc" },
      { subject: "asc" },
      { sortOrder: "asc" },
    ],
    take: 80,
  });
  if (candidates.length === 0) {
    return NextResponse.json({ suggestions: [] satisfies SuggestedStandard[] });
  }

  const title = locale === "en" ? lesson.title_en : lesson.title_de;
  const summary = locale === "en" ? lesson.summary_en : lesson.summary_de;
  const body = locale === "en" ? lesson.body_en : lesson.body_de;

  const candidatesForPrompt = candidates.map((s) => ({
    id: s.id,
    code: s.code,
    state: s.state,
    grade: s.grade,
    subject: s.subject,
    title: locale === "en" ? s.title_en : s.title_de,
    description:
      (locale === "en" ? s.description_en : s.description_de) ?? "",
  }));

  const client = requireAnthropic();
  const systemPrompt =
    locale === "en"
      ? `You map MicroLearn lessons to curriculum standards. Pick the standards a lesson genuinely covers. Be strict — false matches damage trust. Never pick more than 5 standards. Score confidence from 0.0 to 1.0 (0.6 minimum to include). Respond ONLY with valid JSON matching the schema given by the user.`
      : `Du verknüpfst MicroLearn-Lektionen mit Lehrplan-Standards. Wähle nur Standards, die die Lektion wirklich abdeckt. Sei streng — Fehlzuordnungen zerstören Vertrauen. Maximal 5 Standards. Konfidenz von 0.0 bis 1.0 (mind. 0.6 für Aufnahme). Antworte AUSSCHLIESSLICH mit gültigem JSON gemäß dem User-Schema.`;

  const userPrompt = JSON.stringify({
    schema: {
      suggestions: [
        {
          id: "<standard id from list>",
          reason: "<short German/English explanation, max 160 chars>",
          confidence: 0.85,
        },
      ],
    },
    lesson: {
      title,
      summary,
      body: body.slice(0, 4000),
    },
    candidates: candidatesForPrompt,
  });

  let parsed: { suggestions?: Array<{ id: string; reason?: string; confidence?: number }> } = {};
  try {
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL_CONTENT,
      max_tokens: 800,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = res.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    parsed = JSON.parse(stripCodeFence(text));
  } catch (err) {
    return NextResponse.json(
      { error: "AI request failed", detail: (err as Error).message },
      { status: 502 },
    );
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const suggestions: SuggestedStandard[] = (parsed.suggestions ?? [])
    .filter((s) => s && byId.has(s.id))
    .slice(0, 5)
    .map((s) => {
      const standard = byId.get(s.id)!;
      return {
        id: standard.id,
        code: standard.code,
        state: standard.state,
        grade: standard.grade,
        subject: standard.subject,
        title: locale === "en" ? standard.title_en : standard.title_de,
        reason: typeof s.reason === "string" ? s.reason.slice(0, 220) : "",
        confidence:
          typeof s.confidence === "number"
            ? Math.max(0, Math.min(1, s.confidence))
            : 0.6,
      };
    })
    .filter((s) => s.confidence >= 0.6)
    .sort((a, b) => b.confidence - a.confidence);

  return NextResponse.json({ suggestions });
}

function stripCodeFence(text: string): string {
  // Sometimes Claude wraps output in ```json … ``` — strip safely.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced?.[1] ?? text;
}
