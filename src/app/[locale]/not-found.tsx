import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Compass, Home } from "lucide-react";

export default async function NotFound() {
  // next-intl routes locale-less requests through this file too, so we don't
  // assume a locale here — fall back to English-friendly defaults.
  let t: (k: string) => string;
  try {
    t = await getTranslations("errors");
  } catch {
    t = (k) =>
      ({
        error404Title: "Nothing to see here",
        error404Body: "The page you're looking for doesn't exist (yet).",
        backHome: "Back to home",
        browsePaths: "Browse paths",
        browseProjects: "Browse projects",
      })[k] ?? k;
  }

  return (
    <div className="container flex min-h-[70dvh] flex-col items-center justify-center gap-6 py-12 text-center">
      <Compass className="h-12 w-12 text-primary" />
      <div className="max-w-md space-y-2">
        <h1 className="text-3xl font-bold">{t("error404Title")}</h1>
        <p className="text-muted-foreground">{t("error404Body")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            {t("backHome")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/paths">{t("browsePaths")}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/projects">{t("browseProjects")}</Link>
        </Button>
      </div>
    </div>
  );
}
