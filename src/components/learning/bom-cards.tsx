"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, ChevronDown } from "lucide-react";
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

  return (
    <Card
      className={cn(
        "transition",
        owned && "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/10",
      )}
    >
      <CardContent className="grid gap-3 p-4">
        {/* Habe-ich-Checkbox oben rechts */}
        <div className="flex items-start gap-3">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
            {item.imageUrl && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full rounded-lg object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <PartIcon iconKey={item.iconKey} className="h-9 w-9 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                {item.quantity}×
              </span>
              <span className="break-words font-semibold">{item.name}</span>
            </div>
            {item.descriptionShort && (
              <p className="mt-1 text-xs text-muted-foreground">
                {item.descriptionShort}
              </p>
            )}
          </div>
          <label className="flex flex-shrink-0 cursor-pointer flex-col items-center gap-1 rounded-md px-2 py-1 transition hover:bg-muted">
            <Checkbox checked={owned} onCheckedChange={onToggle} />
            <span className="text-[10px] leading-tight text-muted-foreground">
              {owned ? t("haveItChecked") : t("haveItToggle")}
            </span>
          </label>
        </div>

        {!owned && primary && (
          <div className="grid gap-2">
            <Button asChild className="w-full" size="sm">
              <a
                href={primary.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {t("buyNow")} — {primary.programDisplayName}
              </a>
            </Button>

            {others.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                  <div className="mt-2 grid grid-cols-1 gap-1">
                    {others.map((opt) => (
                      <a
                        key={opt.programMerchant}
                        href={opt.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="rounded-md border bg-background px-2 py-1.5 text-center text-xs hover:border-primary hover:bg-primary/5"
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
