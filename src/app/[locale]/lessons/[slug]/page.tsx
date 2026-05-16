import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { requireSession } from "@/server/auth/require-session";
import { getUserEntitlement } from "@/server/lib/access";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import {
  StepPlayer,
  type StepView,
  type LessonFirmware,
} from "@/components/learning/step-player";
import type { BomItemView, BomAffiliateOption } from "@/components/learning/bom-cards";
import type { StepKind } from "@prisma/client";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const l = locale as Locale;

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/lessons/${slug}`,
  });

  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      bom: {
        include: {
          component: {
            include: {
              affiliateLinks: { include: { program: true } },
            },
          },
          board: {
            include: {
              affiliateLinks: { include: { program: true } },
            },
          },
        },
      },
    },
  });
  if (!lesson || !lesson.isPublished) notFound();

  const [progress, entitlement] = await Promise.all([
    prisma.userProgress.findUnique({
      where: {
        userId_lessonId: { userId: session.user.id, lessonId: lesson.id },
      },
    }),
    getUserEntitlement(session.user.id),
  ]);
  const mentorAvailable = entitlement !== "free";

  const stepViews: StepView[] = lesson.steps.map((s) => ({
    id: s.id,
    kind: s.kind as StepKind,
    title: (locale === "de" ? s.title_de : s.title_en) ?? "",
    body: (locale === "de" ? s.body_de : s.body_en) ?? "",
    payload: (s.payload as Record<string, unknown> | null) ?? null,
  }));

  const bom: BomItemView[] = lesson.bom.map((item) => {
    const name = item.component?.name ?? item.board?.name ?? "Bauteil";
    const descriptionShort = item.component
      ? locale === "de"
        ? item.component.descriptionShort_de
        : item.component.descriptionShort_en
      : item.board
        ? locale === "de"
          ? item.board.descriptionShort_de
          : item.board.descriptionShort_en
        : null;
    const imageUrl = item.component?.imageUrl ?? item.board?.imageUrl ?? null;
    const iconKey = item.component?.iconKey ?? item.board?.iconKey ?? null;

    const allLinks = [
      ...(item.component?.affiliateLinks ?? []),
      ...(item.board?.affiliateLinks ?? []),
    ].filter((l) => l.program.isActive);

    // Neutrale Sortierung — alphabetisch nach Anzeigename. Keine
    // Anbieter-Bevorzugung (AZ-Delivery zählt hier nicht mehr als „erst").
    allLinks.sort((a, b) =>
      a.program.displayName.localeCompare(b.program.displayName, "de"),
    );

    const affiliates: BomAffiliateOption[] = allLinks.map((link) => ({
      programMerchant: link.program.merchant,
      programDisplayName: link.program.displayName,
      url: link.productUrl,
      priceCents: link.priceCents,
      currency: link.currency ?? "EUR",
      packageNote:
        (locale === "de" ? link.packageNote_de : link.packageNote_en) ?? null,
    }));

    // Günstigster Anbieter zuerst (für „ab x €" Anzeige + Default-Button)
    affiliates.sort((a, b) => {
      const pa = a.priceCents ?? Number.POSITIVE_INFINITY;
      const pb = b.priceCents ?? Number.POSITIVE_INFINITY;
      return pa - pb;
    });

    return {
      id: item.id,
      name,
      quantity: item.quantity,
      imageUrl,
      iconKey,
      descriptionShort: descriptionShort ?? null,
      affiliates,
    };
  });

  const allowedChips = new Set([
    "esp32",
    "esp32s3",
    "esp32c3",
    "esp32s2",
    "esp8266",
  ]);
  const firmware: LessonFirmware | null = lesson.firmwareUrl
    ? {
        url: lesson.firmwareUrl,
        chip: allowedChips.has(lesson.firmwareChip ?? "")
          ? (lesson.firmwareChip as LessonFirmware["chip"])
          : null,
        flashAddress: lesson.firmwareFlashAddress ?? null,
      }
    : null;

  return (
    <StepPlayer
      lessonId={lesson.id}
      lessonTitle={pickLocalized(lesson, "title", l)}
      lessonSummary={pickLocalized(lesson, "summary", l)}
      steps={stepViews}
      bom={bom}
      safetyNotes={
        locale === "de" ? lesson.safetyNotes_de : lesson.safetyNotes_en
      }
      xpReward={lesson.xpReward}
      locale={l}
      alreadyCompleted={Boolean(progress?.completedAt)}
      mentorAvailable={mentorAvailable}
      firmware={firmware}
      verifiedOnHardware={Boolean(lesson.verifiedOnHardwareAt)}
    />
  );
}
