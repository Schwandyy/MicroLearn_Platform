import { setRequestLocale, getTranslations } from "next-intl/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PilotForm } from "@/components/pilot/pilot-form";
import { CheckCircle2, GraduationCap, School, Sparkles } from "lucide-react";

export default async function PilotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Pilot" });

  const session = await auth();
  const existingAdminship = session?.user?.id
    ? await prisma.institutionAdmin.findFirst({
        where: { userId: session.user.id },
        include: {
          institution: {
            include: { subscription: true },
          },
        },
      })
    : null;

  const trialActive =
    existingAdminship?.institution?.subscription?.status === "TRIALING" &&
    (existingAdminship.institution.subscription.trialEndsAt?.getTime() ?? 0) > Date.now();

  return (
    <div className="container max-w-5xl py-12 md:py-16">
      <header className="mb-10 text-center">
        <span className="inline-flex items-center gap-1 rounded-full border bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <Sparkles className="h-3 w-3" /> {t("badge")}
        </span>
        <h1 className="mt-3 text-3xl font-bold md:text-5xl">{t("headline")}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("subhead")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <Bullet icon={School} title={t("bullet1Title")} body={t("bullet1Body")} />
        <Bullet icon={GraduationCap} title={t("bullet2Title")} body={t("bullet2Body")} />
        <Bullet icon={CheckCircle2} title={t("bullet3Title")} body={t("bullet3Body")} />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t("formTitle")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("formSubtitle")}</p>
          </CardHeader>
          <CardContent>
            {!session?.user?.id ? (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4 text-sm">
                <p>{t("signInRequired")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href={`/auth/sign-up?next=${encodeURIComponent("/pilot")}`}>
                      {t("signUp")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/auth/sign-in?next=${encodeURIComponent("/pilot")}`}>
                      {t("signIn")}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : trialActive ? (
              <div className="space-y-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 font-medium text-emerald-900 dark:text-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                  {t("alreadyEnrolledTitle", { school: existingAdminship!.institution.name })}
                </div>
                <p className="text-emerald-900/80 dark:text-emerald-100/80">
                  {t("alreadyEnrolledBody", {
                    until: existingAdminship!.institution.subscription!.trialEndsAt!.toLocaleDateString(locale),
                  })}
                </p>
                <Button asChild>
                  <Link href="/classroom">{t("ctaClassroom")}</Link>
                </Button>
              </div>
            ) : (
              <PilotForm />
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">{t("includedTitle")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(t.raw("includedItems") as string[]).map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">{t("includedFooter")}</p>
          </CardContent>
        </Card>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        {t("legalFooter")}
      </p>
    </div>
  );
}

function Bullet({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
