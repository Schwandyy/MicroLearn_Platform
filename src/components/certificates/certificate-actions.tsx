"use client";

import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2 } from "lucide-react";

export function CertificateActions({ publicSlug }: { publicSlug: string }) {
  const t = useTranslations("certificates");
  const locale = useLocale();
  const { toast } = useToast();

  const share = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `/certificates/${publicSlug}`;
    if (navigator.share) {
      try {
        await navigator.share({ url, title: t("title") });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
    toast({ title: t("linkCopied") });
  };

  const pdfUrl = `/api/certificates/${publicSlug}/pdf?locale=${locale}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button asChild>
        <a href={pdfUrl} download>
          <Download className="mr-2 h-4 w-4" />
          {t("downloadPdf")}
        </a>
      </Button>
      <Button onClick={share} variant="outline">
        <Share2 className="mr-2 h-4 w-4" />
        {t("share")}
      </Button>
    </div>
  );
}
