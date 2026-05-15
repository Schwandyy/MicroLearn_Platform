"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

const LABEL: Record<string, string> = {
  de: "Deutsch",
  en: "English",
};

export function LanguageSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("nav");
  const [isPending, startTransition] = useTransition();

  const onSelect = (next: "de" | "en") => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- params are typed by next-intl runtime
        { pathname, params },
        { locale: next },
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={t("languageSwitch")}
          disabled={isPending}
        >
          <Languages className="mr-2 h-4 w-4" />
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onSelect("de")}>
          {LABEL.de}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect("en")}>
          {LABEL.en}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
