"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Printer, Share2 } from "lucide-react";

export function CertificateActions({ publicSlug }: { publicSlug: string }) {
  const t = useTranslations("certificates");
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

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button onClick={() => window.print()} variant="outline">
        <Printer className="mr-2 h-4 w-4" />
        {t("print")}
      </Button>
      <Button onClick={share} variant="outline">
        <Share2 className="mr-2 h-4 w-4" />
        {t("share")}
      </Button>
    </div>
  );
}
