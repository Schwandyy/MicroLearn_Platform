import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { renderCertificatePdf } from "@/server/lib/certificate-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isLocale(value: string | null): value is "de" | "en" {
  return value === "de" || value === "en";
}

function resolveAppUrl(req: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("host") ?? "localhost:3030";
  return `${proto}://${host}`;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ publicSlug: string }> },
) {
  const { publicSlug } = await ctx.params;

  const cert = await prisma.certificate.findUnique({
    where: { publicSlug },
    include: {
      user: { select: { name: true, username: true } },
      path: { select: { title_de: true, title_en: true } },
    },
  });

  if (!cert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const urlLocale = req.nextUrl.searchParams.get("locale");
  const locale: "de" | "en" = isLocale(urlLocale) ? urlLocale : "de";

  const recipient = cert.user.name ?? cert.user.username ?? "—";
  const pathTitle =
    locale === "de" ? cert.path.title_de : cert.path.title_en;
  const verifyUrl = `${resolveAppUrl(req)}/${locale}/certificates/${publicSlug}`;

  const pdf = await renderCertificatePdf({
    locale,
    recipient,
    pathTitle,
    issuedAt: cert.issuedAt,
    publicSlug,
    verifyUrl,
  });

  const filename = `microlearn-certificate-${publicSlug}.pdf`;
  return new NextResponse(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
