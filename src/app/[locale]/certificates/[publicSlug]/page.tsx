import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/prisma";
import { CertificateActions } from "@/components/certificates/certificate-actions";

// Liefert die kanonische App-URL: NEXT_PUBLIC_APP_URL bevorzugt, sonst aus den
// Request-Headers rekonstruiert (x-forwarded-host/host + https). Vermeidet
// „http://localhost:3030"-Links in Zertifikaten, die in Production geteilt werden.
async function getCanonicalBaseUrl(): Promise<string> {
  const env = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) return env;
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-host");
    const host = forwarded ?? h.get("host") ?? "";
    if (!host || host.includes("localhost") || host.includes("127.0.0.1")) {
      return env; // Fallback auf evtl. localhost — nur lokal sichtbar
    }
    const proto = h.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  } catch {
    return env;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; publicSlug: string }>;
}): Promise<Metadata> {
  const { locale, publicSlug } = await params;
  const cert = await prisma.certificate.findUnique({
    where: { publicSlug },
    include: {
      user: { select: { name: true, username: true } },
      path: { select: { title_de: true, title_en: true } },
    },
  });
  if (!cert) return {};
  const recipient = cert.user.name ?? cert.user.username ?? "—";
  const pathTitle =
    locale === "de" ? cert.path.title_de : cert.path.title_en;
  const title =
    locale === "de"
      ? `Zertifikat · ${recipient} · ${pathTitle}`
      : `Certificate · ${recipient} · ${pathTitle}`;
  const description =
    locale === "de"
      ? `${recipient} hat den Lernpfad „${pathTitle}" bei MicroLearn abgeschlossen.`
      : `${recipient} completed the learning path "${pathTitle}" on MicroLearn.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

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
  const appUrl = await getCanonicalBaseUrl();
  const isLocalOnly = !appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
  const verifyUrl = isLocalOnly ? "" : `${appUrl}/${locale}/certificates/${publicSlug}`;

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
              &laquo; {pathTitle} &raquo;
            </p>

            <div className="mx-auto mt-6 h-px w-32 bg-amber-300 dark:bg-amber-700" />

            <div className="grid gap-2 text-xs text-muted-foreground">
              <p>
                {t("issued")} {issued}
              </p>
              {verifyUrl ? (
                <p className="font-mono break-all">
                  {t("verify")}: {verifyUrl}
                </p>
              ) : (
                <p className="font-mono">
                  {t("verify")}:&nbsp;
                  <span className="select-all">{publicSlug}</span>
                </p>
              )}
              <p className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                <span aria-hidden>✓</span>
                {t("verifiedBadge")}
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
