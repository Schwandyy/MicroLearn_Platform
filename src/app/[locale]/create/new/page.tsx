import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { LessonWizard } from "@/components/create/lesson-wizard";

const ALLOWED_ROLES = new Set(["TEACHER", "INSTRUCTOR", "ADMIN"]);

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("create");

  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/create/new`,
  });
  if (!ALLOWED_ROLES.has(session.user.role)) {
    notFound();
  }

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: [{ path: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      title_de: true,
      title_en: true,
      path: { select: { slug: true, title_de: true, title_en: true } },
    },
  });

  const titleField = locale === "en" ? "title_en" : "title_de";
  const groups = new Map<
    string,
    { pathTitle: string; courses: { id: string; title: string }[] }
  >();
  for (const c of courses) {
    const pathTitle = c.path[titleField];
    const key = c.path.slug;
    if (!groups.has(key)) {
      groups.set(key, { pathTitle, courses: [] });
    }
    groups.get(key)!.courses.push({ id: c.id, title: c[titleField] });
  }
  const courseGroups = Array.from(groups.values());

  return (
    <div className="container py-10">
      <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
        <Link href="/create">
          <ChevronLeft className="mr-1 h-4 w-4" />
          {t("backToCreate")}
        </Link>
      </Button>
      <h1 className="mb-2 text-3xl font-bold">{t("newLesson")}</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">{t("wizardHint")}</p>

      <LessonWizard courseGroups={courseGroups} />
    </div>
  );
}
