import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";

const PILOT_DAYS = 30;
const DEFAULT_SEATS = 30;

const schema = z.object({
  schoolName: z.string().min(2).max(200),
  state: z
    .enum([
      "BW",
      "BY",
      "BE",
      "BB",
      "HB",
      "HH",
      "HE",
      "MV",
      "NI",
      "NRW",
      "RP",
      "SL",
      "SN",
      "ST",
      "SH",
      "TH",
      "AT",
      "CH",
      "LI",
      "OTHER",
    ])
    .optional()
    .nullable(),
  country: z.string().min(2).max(3).default("DE"),
  contactEmail: z.string().email(),
  estimatedStudentCount: z.coerce.number().int().min(1).max(50000).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  // Schüler-Code-Accounts dürfen keine Schule registrieren (kein PII)
  if (session.user.role === "STUDENT_CODE") {
    return NextResponse.json({ error: "Forbidden for student-code accounts" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { schoolName, state, country, contactEmail, estimatedStudentCount, notes: _notes } = parsed.data;

  // Idempotenz: gleiche Schule (Name + contactEmail) → bestehenden Pilot zurückgeben
  const existing = await prisma.institution.findFirst({
    where: {
      name: schoolName,
      contactEmail,
    },
    include: { subscription: true, admins: { where: { userId: session.user.id }, take: 1 } },
  });

  if (existing) {
    // User als Admin verknüpfen falls noch nicht
    if (existing.admins.length === 0) {
      await prisma.institutionAdmin.create({
        data: { institutionId: existing.id, userId: session.user.id },
      });
    }
    // Wenn keine Subscription existiert, einen Pilot anlegen — sonst nur zurückgeben
    if (!existing.subscription) {
      const trialEndsAt = new Date(Date.now() + PILOT_DAYS * 86_400_000);
      const created = await prisma.institutionSubscription.create({
        data: {
          institutionId: existing.id,
          tier: "INSTITUTION",
          status: "TRIALING",
          seats: Math.max(DEFAULT_SEATS, estimatedStudentCount ?? 0),
          isPilot: true,
          trialEndsAt,
          estimatedStudentCount: estimatedStudentCount ?? null,
        },
      });
      return NextResponse.json({
        ok: true,
        institutionId: existing.id,
        subscriptionId: created.id,
        trialEndsAt: created.trialEndsAt,
        reused: true,
      });
    }
    return NextResponse.json({
      ok: true,
      institutionId: existing.id,
      subscriptionId: existing.subscription.id,
      trialEndsAt: existing.subscription.trialEndsAt,
      alreadyEnrolled: true,
    });
  }

  const trialEndsAt = new Date(Date.now() + PILOT_DAYS * 86_400_000);
  const institution = await prisma.institution.create({
    data: {
      name: schoolName,
      state: state ?? null,
      country,
      contactEmail,
      admins: {
        create: { userId: session.user.id },
      },
      subscription: {
        create: {
          tier: "INSTITUTION",
          status: "TRIALING",
          seats: Math.max(DEFAULT_SEATS, estimatedStudentCount ?? 0),
          isPilot: true,
          trialEndsAt,
          estimatedStudentCount: estimatedStudentCount ?? null,
        },
      },
    },
    include: { subscription: true },
  });

  return NextResponse.json({
    ok: true,
    institutionId: institution.id,
    subscriptionId: institution.subscription?.id,
    trialEndsAt: institution.subscription?.trialEndsAt,
    created: true,
  });
}
