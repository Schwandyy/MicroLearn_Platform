import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Lightbulb,
  Cog,
  Thermometer,
  Wifi,
  Check,
  X,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { HeroDemo } from "@/components/landing/hero-demo";
import { prisma } from "@/server/db/prisma";
import { pickLocalized } from "@/lib/i18n-content";
import type { Locale } from "@/lib/utils";

const PATH_ICON: Record<string, typeof Lightbulb> = {
  "mein-erstes-licht": Lightbulb,
  "bewegung-robotik": Cog,
  "welt-der-sensoren": Thermometer,
  "anzeige-iot": Wifi,
};

const PATH_GRADIENT: Record<string, string> = {
  "mein-erstes-licht": "from-amber-500/15 to-rose-500/15",
  "bewegung-robotik": "from-sky-500/15 to-indigo-500/15",
  "welt-der-sensoren": "from-emerald-500/15 to-teal-500/15",
  "anzeige-iot": "from-violet-500/15 to-fuchsia-500/15",
};

const LEVEL_LABEL: Record<string, { de: string; en: string }> = {
  L1_BEGINNER: { de: "Beginner", en: "Beginner" },
  L2_NOVICE: { de: "Einsteiger", en: "Novice" },
  L3_INTERMEDIATE: { de: "Fortgeschrittener", en: "Intermediate" },
  L4_EXPERT: { de: "Experte", en: "Expert" },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const l = locale as Locale;

  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    include: {
      courses: { include: { _count: { select: { lessons: true } } } },
    },
  });

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="container py-12 md:py-20">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("heroBadge")}
            </div>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground md:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/sign-up">
                  {t("ctaStart")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/paths">{t("ctaSeePaths")}</Link>
              </Button>
            </div>
          </div>
          <div>
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* PATHS */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("pathsTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("pathsSubtitle")}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {paths.map((p) => {
            const Icon = PATH_ICON[p.slug] ?? Lightbulb;
            const lessons = p.courses.reduce(
              (sum, c) => sum + c._count.lessons,
              0,
            );
            const gradient =
              PATH_GRADIENT[p.slug] ?? "from-primary/10 to-transparent";
            return (
              <Card
                key={p.id}
                className={`group relative overflow-hidden bg-gradient-to-br ${gradient}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="rounded-xl border bg-background/80 p-3">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="rounded-full border bg-background/80 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {LEVEL_LABEL[p.level]?.[l] ?? p.level}
                    </span>
                  </div>
                  <CardTitle className="mt-4 text-xl">
                    {pickLocalized(p, "title", l)}
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {pickLocalized(p, "summary", l)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{t("pathLessonCount", { count: lessons })}</span>
                      {p.estimatedHours ? (
                        <span>
                          · {t("pathHours", { hours: p.estimatedHours })}
                        </span>
                      ) : null}
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/paths/${p.slug}`}>
                        {t("pathOpen")}
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* TEACHER STRIP */}
      <section className="container py-8 md:py-12">
        <div className="rounded-3xl border bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6 md:p-10">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[auto_1fr_auto]">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80">
              <GraduationCap className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                {t("teacherTitle")}
              </h3>
              <p className="mt-2 text-muted-foreground">{t("teacherBody")}</p>
            </div>
            <Button asChild size="lg">
              <Link href="/classroom">
                {t("teacherCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* WHY NOT YOUTUBE — Comparison Table */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("whyTitle")}
          </h2>
        </div>
        <div className="mt-10 overflow-x-auto">
          <table className="min-w-full overflow-hidden rounded-2xl border bg-card text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium md:px-6">
                  {t("whyCols.feature")}
                </th>
                <th className="px-4 py-3 text-center font-medium md:px-6">
                  {t("whyCols.youtube")}
                </th>
                <th className="px-4 py-3 text-center font-medium md:px-6">
                  {t("whyCols.courses")}
                </th>
                <th className="px-4 py-3 text-center font-medium md:px-6">
                  {t("whyCols.kit")}
                </th>
                <th className="bg-primary/10 px-4 py-3 text-center font-semibold text-primary md:px-6">
                  {t("whyCols.us")}
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  { key: "structure", row: ["x", "y", "y", "v"] },
                  { key: "mentor", row: ["x", "x", "x", "v"] },
                  { key: "progress", row: ["x", "y", "x", "v"] },
                  { key: "hardware", row: ["x", "x", "v", "v"] },
                  { key: "classroom", row: ["x", "x", "x", "v"] },
                ] as const
              ).map((r, i) => (
                <tr
                  key={r.key}
                  className={i % 2 === 1 ? "bg-muted/20" : undefined}
                >
                  <td className="px-4 py-3 md:px-6">
                    {t(`whyRows.${r.key}`)}
                  </td>
                  {r.row.map((cell, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 text-center md:px-6 ${
                        j === 3 ? "bg-primary/5" : ""
                      }`}
                    >
                      <Mark mark={cell} highlight={j === 3} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("pricingTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("pricingSubtitle")}</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {(
            [
              { titleKey: "pricingFree", descKey: "pricingFreeDesc", highlight: false },
              { titleKey: "pricingPro", descKey: "pricingProDesc", highlight: true },
              { titleKey: "pricingSchool", descKey: "pricingSchoolDesc", highlight: false },
            ] as const
          ).map((tier, idx) => (
            <Card
              key={idx}
              className={tier.highlight ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <CardTitle className="text-xl">{t(tier.titleKey)}</CardTitle>
                <CardDescription>{t(tier.descKey)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/pricing">{t("pricingCta")}</Link>
          </Button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container pb-24 pt-8">
        <div className="rounded-3xl bg-foreground/95 px-6 py-12 text-center text-background md:px-12 md:py-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            {t("finalCtaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl opacity-80">
            {t("finalCtaSubtitle")}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/auth/sign-up">
              {t("finalCta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Mark({
  mark,
  highlight,
}: {
  mark: "x" | "y" | "v";
  highlight?: boolean;
}) {
  if (mark === "v")
    return (
      <Check
        className={`mx-auto h-5 w-5 ${
          highlight ? "text-primary" : "text-emerald-600"
        }`}
      />
    );
  if (mark === "y") return <span className="text-muted-foreground">~</span>;
  return <X className="mx-auto h-5 w-5 text-muted-foreground/40" />;
}
