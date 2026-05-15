import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { CertificateActions } from "@/components/certificates/certificate-actions";

export default async function PublicCertificatePage({
  params,
}: {
  params: Promise<{ locale: string; publicSlug: string }>;
}) {
  const { locale, publicSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("certificates");

  const cert = await prisma.certificate.findUnique({
    where: { publicSlug },
    include: {
      user: { select: { name: true, username: true } },
      path: { select: { title_de: true, title_en: true } },
    },
  });

  if (!cert) notFound();

  const recipient =
    cert.user.name ?? cert.user.username ?? "—";
  const pathTitle =
    locale === "de" ? cert.path.title_de : cert.path.title_en;
  const issued = cert.issuedAt.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-amber-50 via-white to-amber-50 py-10 dark:from-amber-950/40 dark:via-background dark:to-amber-950/40">
      <div className="container max-w-3xl space-y-6">
        <article
          className="relative mx-auto overflow-hidden rounded-3xl border-[6px] border-amber-300 bg-white p-10 shadow-2xl dark:border-amber-700 dark:bg-zinc-950 md:p-16 print:border-2 print:shadow-none"
          aria-label="certificate"
        >
          <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-amber-300/70 dark:border-amber-700/70" />

          <div className="relative space-y-8 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.4em] text-amber-700 dark:text-amber-300">
              MicroLearn · Certificate
            </div>

            <h1 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
              {t("title")}
            </h1>

            <p className="text-sm text-muted-foreground">{t("awarded")}</p>

            <p className="font-serif text-3xl font-semibold md:text-4xl">
              {recipient}
            </p>

            <p className="text-sm text-muted-foreground">{t("for")}</p>

            <p className="font-serif text-2xl font-semibold text-amber-700 dark:text-amber-300 md:text-3xl">
              „{pathTitle}"
            </p>

            <div className="mx-auto mt-6 h-px w-32 bg-amber-300 dark:bg-amber-700" />

            <div className="grid gap-2 text-xs text-muted-foreground">
              <p>
                {t("issued")} {issued}
              </p>
              <p className="font-mono">
                {t("verify")}: {publicSlug}
              </p>
            </div>
          </div>
        </article>

        <div className="text-center print:hidden">
          <CertificateActions publicSlug={publicSlug} />
        </div>
      </div>
    </div>
  );
}
