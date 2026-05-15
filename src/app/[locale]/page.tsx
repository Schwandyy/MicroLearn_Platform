import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Bot, BarChart3, Boxes } from "lucide-react";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const features = [
    { icon: Cpu, key: "featureSimulator" as const },
    { icon: Bot, key: "featureAi" as const },
    { icon: BarChart3, key: "featureLevels" as const },
    { icon: Boxes, key: "featureBoards" as const },
  ];

  return (
    <div className="container py-16 md:py-24">
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
          {t("heroTitle")}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground md:text-xl">
          {t("heroSubtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </section>

      <section className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, key }) => (
          <div
            key={key}
            className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm"
          >
            <Icon className="h-8 w-8 text-primary" />
            <p className="mt-4 font-medium">{t(key)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
