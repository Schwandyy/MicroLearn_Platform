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
import { Check, Sparkles, Zap } from "lucide-react";
import { CheckoutButton } from "@/components/pricing/checkout-button";
import { ManageSubscriptionButton } from "@/components/pricing/manage-button";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { detectCurrency, isCurrency, type Currency } from "@/server/lib/currency";

export default async function PricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ currency?: string }>;
}) {
  const { locale } = await params;
  const sp = (await searchParams) ?? {};
  setRequestLocale(locale);
  const t = await getTranslations("pricing");

  const requestedCurrency = sp.currency?.toUpperCase();
  const currency: Currency = isCurrency(requestedCurrency)
    ? requestedCurrency
    : await detectCurrency();

  const session = await auth();
  const subscription = session?.user?.id
    ? await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    : null;
  const tier = subscription?.tier ?? "FREE";

  const priceFor = (k: string) =>
    currency === "CHF" ? t(`${k}CHF` as Parameters<typeof t>[0]) : t(k as Parameters<typeof t>[0]);

  const features = (key: string) =>
    (t.raw(key as Parameters<typeof t.raw>[0]) as string[]) ?? [];

  return (
    <div className="container py-12 md:py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-bold md:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        <div className="mt-4 inline-flex items-center gap-1 rounded-full border bg-background p-1 text-xs">
          <Link
            href={{ pathname: "/pricing", query: { currency: "EUR" } }}
            className={cn(
              "rounded-full px-3 py-1 transition",
              currency === "EUR"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            EUR
          </Link>
          <Link
            href={{ pathname: "/pricing", query: { currency: "CHF" } }}
            className={cn(
              "rounded-full px-3 py-1 transition",
              currency === "CHF"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            CHF
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Free */}
        <PlanCard
          name={t("free")}
          price={priceFor("freePrice")}
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

        {/* Pro */}
        <PlanCard
          name={t("pro")}
          price={priceFor("proPriceMonthly")}
          interval={`/ ${t("month")}`}
          subline={`${priceFor("proPriceYearly")} ${t("billedYearly")}`}
          features={features("proFeatures")}
          highlighted={tier === "PRO"}
          accent
          cta={
            tier === "PRO" ? (
              <ManageSubscriptionButton />
            ) : (
              <div className="grid gap-2">
                <CheckoutButton plan="PRO_MONTHLY" currency={currency}>
                  {t("proCta")} — {priceFor("proPriceMonthly")}/{t("month")}
                </CheckoutButton>
                <div className="relative">
                  <span className="absolute -top-2 right-3 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    {t("annualSave")}
                  </span>
                  <CheckoutButton
                    plan="PRO_YEARLY"
                    currency={currency}
                    variant="outline"
                    className="w-full"
                  >
                    {priceFor("proPriceYearly")}/{t("year")}
                  </CheckoutButton>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  {t("annualSaveHint")}
                </p>
              </div>
            )
          }
        />

        {/* Elite */}
        <PlanCard
          name={t("elite")}
          price={priceFor("elitePriceMonthly")}
          interval={`/ ${t("month")}`}
          subline={`${priceFor("elitePriceYearly")} ${t("billedYearly")}`}
          features={features("eliteFeatures")}
          highlighted={tier === "ELITE"}
          eliteAccent
          cta={
            tier === "ELITE" ? (
              <ManageSubscriptionButton />
            ) : (
              <div className="grid gap-2">
                <CheckoutButton plan="ELITE_MONTHLY" currency={currency} variant="default">
                  {t("eliteCta")} — {priceFor("elitePriceMonthly")}/{t("month")}
                </CheckoutButton>
                <div className="relative">
                  <span className="absolute -top-2 right-3 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    {t("annualSave")}
                  </span>
                  <CheckoutButton
                    plan="ELITE_YEARLY"
                    currency={currency}
                    variant="outline"
                    className="w-full"
                  >
                    {priceFor("elitePriceYearly")}/{t("year")}
                  </CheckoutButton>
                </div>
                <p className="text-center text-[11px] text-muted-foreground">
                  {t("annualSaveHint")}
                </p>
              </div>
            )
          }
        />

        {/* Institution */}
        <PlanCard
          name={t("institution")}
          price={priceFor("institutionPrice")}
          interval={`/ ${t("month")}`}
          features={features("institutionFeatures")}
          highlighted={tier === "INSTITUTION"}
          cta={
            tier === "INSTITUTION" ? (
              <ManageSubscriptionButton />
            ) : (
              <div className="grid gap-2">
                <Button asChild size="lg">
                  <Link href="/pilot">{t("pilotCta")}</Link>
                </Button>
                <CheckoutButton
                  plan="INSTITUTION"
                  currency={currency}
                  variant="outline"
                  className="w-full"
                >
                  {t("institutionCta")}
                </CheckoutButton>
                <p className="text-center text-[11px] text-muted-foreground">
                  {t("pilotHint")}
                </p>
              </div>
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
  eliteAccent,
  highlighted,
}: {
  name: string;
  price: string;
  interval: string;
  subline?: string;
  features: string[];
  cta: React.ReactNode;
  accent?: boolean;
  eliteAccent?: boolean;
  highlighted?: boolean;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        accent && "border-primary shadow-lg",
        eliteAccent && "border-violet-500 shadow-lg shadow-violet-500/10",
      )}
    >
      {accent && (
        <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          <Sparkles className="h-3 w-3" /> Most popular
        </div>
      )}
      {eliteAccent && (
        <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-violet-600 px-3 py-1 text-xs font-medium text-white">
          <Zap className="h-3 w-3" /> Elite
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
