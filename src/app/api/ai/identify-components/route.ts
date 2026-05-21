import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { requireAnthropic, ANTHROPIC_MODEL } from "@/server/lib/anthropic";
import { getUserEntitlement, getFeatureFlags } from "@/server/lib/access";
import { apiRateLimit, inMemorySlidingLimit } from "@/server/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  // base64-encoded image data
  imageData: z.string().min(1).max(10_000_000),
  // mime type of the image
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/gif", "image/webp"])
    .default("image/jpeg"),
  locale: z.enum(["de", "en"]).default("de"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Gate: Elite and Institution only
  const entitlement = await getUserEntitlement(session.user.id);
  const flags = getFeatureFlags(entitlement);
  if (!flags.PHOTO_RECOGNITION) {
    return NextResponse.json(
      { error: "Foto-Erkennung ist nur für Elite-Mitglieder." },
      { status: 402 },
    );
  }

  // Rate-limit: 20 requests/hour per user (vision is expensive)
  const rateLimitKey = `identify:${session.user.id}`;
  if (apiRateLimit) {
    const rl = await apiRateLimit.limit(rateLimitKey);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Stundenlimit erreicht.", remaining: 0 },
        { status: 429 },
      );
    }
  } else {
    const rl = inMemorySlidingLimit({ key: rateLimitKey, limit: 20, windowMs: 3_600_000 });
    if (!rl.success) {
      return NextResponse.json(
        { error: "Stundenlimit erreicht.", remaining: 0 },
        { status: 429 },
      );
    }
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { imageData, mimeType, locale } = parsed.data;
  const langGuard =
    locale === "de"
      ? "Antworte IMMER auf Deutsch."
      : "Always answer in English.";

  const client = requireAnthropic();

  const response = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: `Du bist ein Experte für Mikroelektronik-Komponenten. ${langGuard}
Analysiere das Bild und erkenne alle sichtbaren elektronischen Bauteile.
Antworte NUR mit validem JSON, kein Markdown:
{
  "components": [
    {
      "name": string,       // Bauteilname (z.B. "LED rot", "DHT22", "Arduino Uno")
      "category": string,   // Kategorie (sensor, actuator, microcontroller, resistor, capacitor, display, power, module, other)
      "confidence": number  // 0.0–1.0
    }
  ],
  "suggestedProjects": [
    { "title": string, "description": string }
  ]
}
Schlage maximal 3 Projekte vor, die mit den erkannten Bauteilen gebaut werden können.`,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageData,
            },
          },
          {
            type: "text",
            text: "Identifiziere alle sichtbaren elektronischen Bauteile und schlage passende Projekte vor.",
          },
        ],
      },
    ],
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "";

  let result: { components: unknown[]; suggestedProjects: unknown[] };
  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Konnte Bild nicht analysieren." },
      { status: 422 },
    );
  }

  // Optionally enrich with inventory matches from the component DB
  const componentNames = (result.components as Array<{ name?: string }>)
    .map((c) => c.name)
    .filter(Boolean) as string[];

  const dbMatches =
    componentNames.length > 0
      ? await prisma.component.findMany({
          where: {
            OR: componentNames.map((name) => ({
              name: { contains: name.split(" ")[0] ?? "", mode: "insensitive" as const },
            })),
            isActive: true,
          },
          select: {
            id: true,
            slug: true,
            name: true,
            category: true,
            descriptionShort_de: true,
            descriptionShort_en: true,
          },
          take: 10,
        })
      : [];

  return NextResponse.json({
    ...result,
    inventoryMatches: dbMatches,
  });
}
