import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import { StepPlayer, type StepView } from "@/components/learning/step-player";
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

  const session = await auth();
  console.log("[lesson]", slug, "session?", {
    hasSession: Boolean(session),
    userId: session?.user?.id,
  });
  if (!session?.user?.id) redirect(`/${locale}/auth/sign-in`);

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

  const progress = await prisma.userProgress.findUnique({
    where: { userId_lessonId: { userId: session.user.id, lessonId: lesson.id } },
  });

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
    }));

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
    />
  );
}
