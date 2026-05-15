import { setRequestLocale, getTranslations } from "next-intl/server";
import { requireSession } from "@/server/auth/require-session";
import { prisma } from "@/server/db/prisma";
import { Link } from "@/i18n/routing";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ExternalLink } from "lucide-react";

export default async function MyCertificatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("certificates");
  const session = await requireSession({
    locale,
    callbackPath: `/${locale}/certificates`,
  });

  const certs = await prisma.certificate.findMany({
    where: { userId: session.user.id },
    include: { path: true },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6 flex items-center gap-2">
        <Award className="h-6 w-6 text-amber-500" />
        <h1 className="text-3xl font-bold">{t("myCertificates")}</h1>
      </div>

      {certs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("noCertificates")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {certs.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle>
                  {locale === "de" ? c.path.title_de : c.path.title_en}
                </CardTitle>
                <CardDescription>
                  {t("issued")}{" "}
                  {c.issuedAt.toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button asChild size="sm">
                  <Link href={`/certificates/${c.publicSlug}`}>
                    {t("view")}
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
