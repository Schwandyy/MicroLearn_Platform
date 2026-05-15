import { NextResponse } from "next/server";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { requireAnthropic, ANTHROPIC_MODEL } from "@/server/lib/anthropic";
import { mentorRateLimit, inMemoryDailyLimit } from "@/server/lib/ratelimit";
import { getUserEntitlement } from "@/server/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const stepContextSchema = z.object({
  title: z.string().max(200),
  body: z.string().max(4000),
  kind: z.string().max(40),
});

const schema = z.object({
  lessonId: z.string().cuid().optional(),
  locale: z.enum(["de", "en"]).default("de"),
  stepContext: stepContextSchema.optional(),
  messages: z.array(messageSchema).min(1).max(40),
});

function buildSystem(opts: {
  locale: "de" | "en";
  lessonTitle?: string;
  lessonBody?: string;
  lessonBoards: string[];
  userLevel: 1 | 2 | 3 | 4;
  stepContext?: { title: string; body: string; kind: string };
}): string {
  const langGuard =
    opts.locale === "de"
      ? "Antworte IMMER auf Deutsch."
      : "Always answer in English.";
  const levelHint = {
    1: "Beginner — sehr behutsam, ohne Jargon, viele kleine Schritte.",
    2: "Einsteiger — kompakte Erklärungen, einfache Analogien.",
    3: "Fortgeschritten — direkt, technisch präzise, Hintergründe.",
    4: "Experte — knapp, präzise, auf RTOS/Architektur-Niveau.",
  }[opts.userLevel];

  return `Du bist der MicroLearn-KI-Mentor — ein geduldiger Coach für Mikroelektronik.
${langGuard}

NUTZER-PROFIL
- Level: ${opts.userLevel} (${levelHint})
- Bevorzugte Boards: ${opts.lessonBoards.length ? opts.lessonBoards.join(", ") : "noch keine Auswahl"}

REGELN
- Pädagogisch erklären, nicht nur Antworten ausspucken. Bei Code-Bugs zuerst die Idee erklären, dann den Fix zeigen.
- Sicherheits-Risiken IMMER benennen (Spannung, Strom, Polung, Hitze, LiPo).
- Logikpegel beachten: ESP32 = 3,3 V, Arduino Uno = 5 V. Bei Mismatch Pegelwandler/Spannungsteiler erwähnen.
- Wenn der Nutzer nach etwas fragt, das gefährlich oder rechtswidrig ist: höflich ablehnen.
- Kein Werbe-Sprech, keine Cliffhanger. Halte dich kurz, wenn die Frage kurz ist.
- Code-Blöcke gerne mit Kommentaren — Kommentar-Sprache passt zur Antwort-Sprache.

${
  opts.lessonTitle
    ? `AKTUELLE LEKTION
Titel: ${opts.lessonTitle}
Auszug:
${opts.lessonBody?.slice(0, 1500) ?? "(kein Auszug verfügbar)"}`
    : "Keine spezifische Lektion im Kontext."
}

${
  opts.stepContext
    ? `AKTUELLER SCHRITT (genau hier ist der Lernende gerade!)
Typ: ${opts.stepContext.kind}
Titel: ${opts.stepContext.title}
Inhalt:
${opts.stepContext.body.slice(0, 1200)}

Bevorzuge Antworten, die direkt zu DIESEM Schritt passen.`
    : ""
}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Pro / Institution only
  const entitlement = await getUserEntitlement(session.user.id);
  if (entitlement === "free") {
    return NextResponse.json(
      { error: "Mentor ist nur für Pro-Mitglieder." },
      { status: 402 },
    );
  }

  // Rate limit: 50 msgs/day
  let remaining = -1;
  if (mentorRateLimit) {
    const rl = await mentorRateLimit.limit(session.user.id);
    remaining = rl.remaining;
    if (!rl.success) {
      return NextResponse.json(
        { error: "Tageslimit erreicht.", remaining: 0 },
        { status: 429 },
      );
    }
  } else {
    const rl = inMemoryDailyLimit(`mentor:${session.user.id}`, 50);
    remaining = rl.remaining;
    if (!rl.success) {
      return NextResponse.json(
        { error: "Tageslimit erreicht.", remaining: 0 },
        { status: 429 },
      );
    }
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Lesson + user context
  const [lesson, profile] = await Promise.all([
    parsed.data.lessonId
      ? prisma.lesson.findUnique({
          where: { id: parsed.data.lessonId },
          include: { recommendedBoards: true },
        })
      : null,
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
  ]);

  const levelNumber: 1 | 2 | 3 | 4 = (() => {
    switch (profile?.currentLevel) {
      case "L4_EXPERT":
        return 4;
      case "L3_INTERMEDIATE":
        return 3;
      case "L2_NOVICE":
        return 2;
      default:
        return 1;
    }
  })();

  const system = buildSystem({
    locale: parsed.data.locale,
    lessonTitle: lesson
      ? parsed.data.locale === "de"
        ? lesson.title_de
        : lesson.title_en
      : undefined,
    lessonBody: lesson
      ? parsed.data.locale === "de"
        ? lesson.body_de
        : lesson.body_en
      : undefined,
    lessonBoards: lesson?.recommendedBoards.map((b) => b.name) ?? [],
    userLevel: levelNumber,
    stepContext: parsed.data.stepContext,
  });

  const client = requireAnthropic();

  const stream = await client.messages.stream({
    model: ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: parsed.data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  // Stream as text/event-stream SSE
  const encoder = new TextEncoder();
  const sse = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
        );
      try {
        send({ type: "meta", remaining });
        for await (const event of stream as AsyncIterable<Anthropic.MessageStreamEvent>) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ type: "delta", text: event.delta.text });
          } else if (event.type === "message_stop") {
            send({ type: "done" });
          }
        }
      } catch (err) {
        send({ type: "error", message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(sse, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
