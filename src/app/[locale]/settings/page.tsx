import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { DataActions } from "@/components/settings/data-actions";
import { DangerZone } from "@/components/settings/danger-zone";
import { SubscriptionPanel } from "@/components/settings/subscription-panel";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("settings");
  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/settings`,
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, subscription: true },
  });

  return (
    <div className="container max-w-2xl py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("sectionProfile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              initial={{
                name: user?.name ?? "",
                username: user?.username ?? "",
                image: user?.image ?? "",
                bio: user?.profile?.bio ?? "",
                preferredLocale:
                  (user?.preferredLocale as "de" | "en") ?? "de",
                marketingOptIn: user?.marketingOptIn ?? false,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sectionSubscription")}</CardTitle>
          </CardHeader>
          <CardContent>
            <SubscriptionPanel
              tier={user?.subscription?.tier ?? "FREE"}
              status={user?.subscription?.status ?? null}
              currentPeriodEnd={
                user?.subscription?.currentPeriodEnd?.toISOString() ?? null
              }
              cancelAtPeriodEnd={user?.subscription?.cancelAtPeriodEnd ?? false}
              hasCustomer={Boolean(user?.subscription?.stripeCustomerId)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("sectionData")}</CardTitle>
            <CardDescription>{t("exportBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DataActions />
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("sectionDanger")}
            </CardTitle>
            <CardDescription>{t("deleteBody")}</CardDescription>
          </CardHeader>
          <CardContent>
            <DangerZone />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
