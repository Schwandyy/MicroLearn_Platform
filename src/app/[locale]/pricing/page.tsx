import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Sparkles } from "lucide-react";
import { CheckoutButton } from "@/components/pricing/checkout-button";
import { ManageSubscriptionButton } from "@/components/pricing/manage-button";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  const session = await auth();
  const subscription = session?.user?.id
    ? await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    : null;
  const tier = subscription?.tier ?? "FREE";

  const features = (key: "freeFeatures" | "proFeatures" | "institutionFeatures") =>
    (t.raw(key) as string[]) ?? [];

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <PlanCard
          name={t("free")}
          price={t("freePrice")}
          interval={`/ ${t("month")}`}
          features={features("freeFeatures")}
          highlighted={tier === "FREE"}
          cta={
            session ? (
              <Button asChild className="w-full" variant="secondary">
                <Link href="/dashboard">→</Link>
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link href="/auth/sign-up">{t("freeCta")}</Link>
              </Button>
            )
          }
        />

        <PlanCard
          name={t("pro")}
          price={t("proPriceMonthly")}
          interval={`/ ${t("month")}`}
          subline={`${t("proPriceYearly")} ${t("billedYearly")}`}
          features={features("proFeatures")}
          highlighted={tier === "PRO"}
          accent
          cta={
            tier === "PRO" ? (
              <ManageSubscriptionButton />
            ) : (
              <div className="grid gap-2">
                <CheckoutButton plan="PRO_MONTHLY">
                  {t("proCta")} — {t("proPriceMonthly")}/{t("month")}
                </CheckoutButton>
                <CheckoutButton plan="PRO_YEARLY" variant="outline">
                  {t("proPriceYearly")}/{t("year")}
                </CheckoutButton>
              </div>
            )
          }
        />

        <PlanCard
          name={t("institution")}
          price={t("institutionPrice")}
          interval={`/ ${t("month")}`}
          features={features("institutionFeatures")}
          highlighted={tier === "INSTITUTION"}
          cta={
            tier === "INSTITUTION" ? (
              <ManageSubscriptionButton />
            ) : (
              <CheckoutButton plan="INSTITUTION" variant="default">
                {t("institutionCta")}
              </CheckoutButton>
            )
          }
        />
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  interval,
  subline,
  features,
  cta,
  accent,
  highlighted,
}: {
  name: string;
  price: string;
  interval: string;
  subline?: string;
  features: string[];
  cta: React.ReactNode;
  accent?: boolean;
  highlighted?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        accent && "border-primary shadow-lg",
      )}
    >
      {accent && (
        <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          <Sparkles className="h-3 w-3" /> Most popular
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>
          <span className="text-3xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground"> {interval}</span>
          {subline && (
            <div className="mt-1 text-xs text-muted-foreground">{subline}</div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ul className="grid gap-2">
          {features.map((f) => (
            <li key={f} className="flex gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto">{cta}</div>
        {highlighted && (
          <div className="text-center text-xs text-muted-foreground">
            ✓ Aktiver Plan
          </div>
        )}
      </CardContent>
    </Card>
  );
}
