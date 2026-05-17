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
  priceCents: number | null;
  currency: string;
  packageNote: string | null;
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

function formatPrice(priceCents: number, currency: string): string {
  const symbol = currency === "EUR" ? "€" : currency;
  return `${(priceCents / 100).toFixed(2).replace(".", ",")} ${symbol}`;
}

function cheapestPriceCents(item: BomItemView): number | null {
  let min: number | null = null;
  for (const a of item.affiliates) {
    if (a.priceCents == null) continue;
    if (min == null || a.priceCents < min) min = a.priceCents;
  }
  return min;
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

  // Gesamtsumme = Summe(min-Preis × Stückzahl) über alle NICHT-besessenen Bauteile.
  // „Hab ich" markierte Teile zählen nicht.
  let totalCents = 0;
  let missingCents = 0;
  let hasUnknownPrice = false;
  let currency = "EUR";
  for (const item of items) {
    const cheap = cheapestPriceCents(item);
    if (cheap == null) {
      hasUnknownPrice = true;
      continue;
    }
    if (item.affiliates[0]) currency = item.affiliates[0].currency;
    const cost = cheap * item.quantity;
    totalCents += cost;
    if (!have[item.id]) missingCents += cost;
  }

  return (
    <div className="grid gap-4">
      <SummaryBar
        totalCents={totalCents}
        missingCents={missingCents}
        hasUnknownPrice={hasUnknownPrice}
        currency={currency}
      />
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
      <p className="text-center text-xs text-muted-foreground">
        {t("priceDisclaimer")}
      </p>
    </div>
  );
}

function SummaryBar({
  totalCents,
  missingCents,
  hasUnknownPrice,
  currency,
}: {
  totalCents: number;
  missingCents: number;
  hasUnknownPrice: boolean;
  currency: string;
}) {
  const t = useTranslations("lesson");
  if (totalCents === 0) return null;
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("bomTotalLabel")}
          </p>
          <p className="text-2xl font-bold tabular-nums">
            ~ {formatPrice(missingCents, currency)}
          </p>
          {missingCents !== totalCents && (
            <p className="text-xs text-muted-foreground">
              {t("bomTotalAll")}: {formatPrice(totalCents, currency)}
            </p>
          )}
        </div>
        <p className="max-w-[12rem] text-right text-xs text-muted-foreground">
          {t("bomTotalHint")}
          {hasUnknownPrice && (
            <span className="block text-amber-700 dark:text-amber-400">
              {t("bomTotalUnknown")}
            </span>
          )}
        </p>
      </div>
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
        "relative transition",
        owned && "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10",
      )}
    >
      <CardContent className="grid gap-3 p-4">
        {/* Header: Bild mit Quantity-Badge + Name + „Hab ich"-Toggle als Icon */}
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
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="min-w-0 flex-1 break-words text-sm font-semibold leading-tight">
                {item.name}
              </h3>
              <button
                type="button"
                aria-label={owned ? t("haveItChecked") : t("haveItToggle")}
                title={owned ? t("haveItChecked") : t("haveItToggle")}
                onClick={onToggle}
                className={cn(
                  "flex-shrink-0 rounded-full border p-1 transition",
                  owned
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "border-border bg-background text-muted-foreground hover:border-primary hover:bg-muted hover:text-foreground",
                )}
              >
                {owned ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </button>
            </div>
            {item.descriptionShort && (
              <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
                {item.descriptionShort}
              </p>
            )}
          </div>
        </div>

        {!owned && primary && (() => {
          // Preis-Spread berechnen: wenn der teuerste Anbieter > 3× günstigster
          // ist, handelt es sich i.d.R. um Pro-Stück vs. Multi-Pack.
          const pricedOptions = item.affiliates.filter((a) => a.priceCents != null);
          const minPrice = pricedOptions.length
            ? Math.min(...pricedOptions.map((a) => a.priceCents!))
            : null;
          const maxPrice = pricedOptions.length
            ? Math.max(...pricedOptions.map((a) => a.priceCents!))
            : null;
          const hasBigSpread =
            minPrice !== null &&
            maxPrice !== null &&
            minPrice > 0 &&
            maxPrice / minPrice >= 3;
          return (
          <div className="grid gap-1.5">
            <Button asChild size="sm" className="h-auto w-full py-2">
              <a
                href={primary.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex flex-col items-start gap-1"
              >
                <span className="flex w-full items-center gap-2">
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                  <span className="min-w-0 flex-1 text-left">
                    {primary.programDisplayName}
                  </span>
                  {primary.priceCents != null && (
                    <span className="flex-shrink-0 whitespace-nowrap tabular-nums font-bold">
                      {others.length > 0 ? "ab " : ""}
                      {formatPrice(primary.priceCents, primary.currency)}
                    </span>
                  )}
                </span>
                {primary.packageNote && (
                  <span className="ml-6 inline-block max-w-full whitespace-normal break-words rounded-sm bg-white/15 px-1.5 py-0.5 text-left text-[11px] font-medium leading-snug">
                    {primary.packageNote}
                  </span>
                )}
              </a>
            </Button>
            {hasBigSpread && (
              <p className="rounded-md bg-amber-100 px-2 py-1 text-[11px] leading-snug text-amber-900 dark:bg-amber-900/30 dark:text-amber-100">
                {t("packSpreadHint")}
              </p>
            )}

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
                  <div className="mt-1 grid gap-1">
                    {others.map((opt) => (
                      <a
                        key={opt.programMerchant}
                        href={opt.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1.5 text-xs hover:border-primary hover:bg-primary/5"
                      >
                        <span className="flex flex-col text-left">
                          <span className="font-medium">
                            {opt.programDisplayName}
                          </span>
                          {opt.packageNote && (
                            <span className="text-[10px] text-muted-foreground">
                              {opt.packageNote}
                            </span>
                          )}
                        </span>
                        {opt.priceCents != null && (
                          <span className="tabular-nums font-semibold">
                            {formatPrice(opt.priceCents, opt.currency)}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}
