"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function DataActions() {
  const t = useTranslations("settings");
  return (
    <Button asChild variant="outline">
      <a href="/api/profile/export" download>
        <Download className="mr-2 h-4 w-4" />
        {t("exportButton")}
      </a>
    </Button>
  );
}
