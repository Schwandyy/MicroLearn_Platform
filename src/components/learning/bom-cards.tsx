"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ChevronDown,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { PartIcon } from "./part-icon";
import { cn } from "@/lib/utils";

export interface BomAffiliateOption {
  programMerchant: string;
  programDisplayName: string;
  url: string;
}

export interface BomItemView {
  id: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  iconKey: string | null;
  descriptionShort: string | null;
  affiliates: BomAffiliateOption[];
}

const HAVE_KEY = "microlearn.have-it";

function loadHave(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(HAVE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveHave(state: Record<string, boolean>) {
  try {
    localStorage.setItem(HAVE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function BomCards({ items }: { items: BomItemView[] }) {
  const t = useTranslations("lesson");
  const [have, setHave] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setHave(loadHave());
  }, []);

  const toggle = (id: string) => {
    setHave((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveHave(next);
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t("youNeed")}: —
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {items.map((item) => (
        <BomCard
          key={item.id}
          item={item}
          owned={Boolean(have[item.id])}
          onToggle={() => toggle(item.id)}
        />
      ))}
    </div>
  );
}

function BomCard({
  item,
  owned,
  onToggle,
}: {
  item: BomItemView;
  owned: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("lesson");
  const [imgFailed, setImgFailed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = item.affiliates[0];
  const others = item.affiliates.slice(1);
  const showImage = item.imageUrl && !imgFailed;

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition",
        owned && "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10",
      )}
    >
      {/* Toggle: sichtbarer "Hab ich"-Schalter oben rechts */}
      <button
        type="button"
        aria-label={owned ? t("haveItChecked") : t("haveItToggle")}
        onClick={onToggle}
        className={cn(
          "absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
          owned
            ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200"
            : "border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted hover:text-foreground",
        )}
      >
        {owned ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
        <span>{owned ? t("haveItChecked") : t("haveItToggle")}</span>
      </button>

      <CardContent className="grid gap-3 p-4 pr-24 pt-10 sm:pt-4">
        {/* Header: Bild mit Quantity-Badge + Name */}
        <div className="flex items-start gap-3">
          <div className="relative h-16 w-16 flex-shrink-0">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-muted">
              {showImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl!}
                  alt={item.name}
                  className="h-full w-full object-contain"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <PartIcon
                  iconKey={item.iconKey}
                  className="h-8 w-8 text-muted-foreground"
                />
              )}
            </div>
            {/* Quantity-Badge */}
            <span className="absolute -bottom-1 -right-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground shadow-md ring-2 ring-background">
              {item.quantity}×
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="break-words text-sm font-semibold leading-tight">
              {item.name}
            </h3>
            {item.descriptionShort && (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {item.descriptionShort}
              </p>
            )}
          </div>
        </div>

        {!owned && primary && (
          <div className="grid gap-1.5">
            <Button asChild size="sm" className="w-full">
              <a
                href={primary.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span className="truncate">
                  {t("buyNow")} · {primary.programDisplayName}
                </span>
              </a>
            </Button>

            {others.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition",
                      moreOpen && "rotate-180",
                    )}
                  />
                  {t("moreOptions")} ({others.length})
                </button>
                {moreOpen && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {others.map((opt) => (
                      <a
                        key={opt.programMerchant}
                        href={opt.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex-1 rounded-md border bg-background px-2 py-1 text-center text-xs hover:border-primary hover:bg-primary/5"
                      >
                        {opt.programDisplayName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
