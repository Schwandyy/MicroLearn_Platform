import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { auth } from "@/server/auth";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";
import { StepPlayer, type StepView } from "@/components/learning/step-player";
import type { BomItemView } from "@/components/learning/bom-cards";
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
  if (!session?.user?.id) redirect(`/${locale}/auth/sign-in`);

  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      steps: { orderBy: { sortOrder: "asc" } },
      bom: {
        include: {
          component: true,
          board: true,
          affiliateLink: { include: { program: true } },
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
    const programActive = item.affiliateLink?.program?.isActive ?? false;
    return {
      id: item.id,
      name,
      quantity: item.quantity,
      imageUrl,
      descriptionShort: descriptionShort ?? null,
      affiliateUrl: programActive ? item.affiliateLink!.productUrl : null,
      affiliateProgram: programActive
        ? item.affiliateLink!.program.displayName
        : null,
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
