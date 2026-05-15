import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { WifiOff } from "lucide-react";

export default async function OfflinePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("offline");

  return (
    <div className="container flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground" />
      <h1 className="mt-6 text-3xl font-bold">{t("title")}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t("subtitle")}</p>
      <Button asChild className="mt-8">
        <Link href="/">{t("retry")}</Link>
      </Button>
    </div>
  );
}
