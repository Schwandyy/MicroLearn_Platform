"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BomItemView {
  id: string;
  name: string;
  quantity: number;
  imageUrl: string | null;
  descriptionShort: string | null;
  affiliateUrl: string | null;
  affiliateProgram: string | null;
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
      {items.map((item) => {
        const owned = Boolean(have[item.id]);
        return (
          <Card
            key={item.id}
            className={cn(
              "transition",
              owned && "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/10",
            )}
          >
            <CardContent className="grid gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary">
                      {item.quantity}×
                    </span>
                    <span className="font-semibold">{item.name}</span>
                  </div>
                  {item.descriptionShort && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.descriptionShort}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={owned ? "default" : "outline"}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    "flex-1",
                    owned && "bg-emerald-500 hover:bg-emerald-600",
                  )}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {owned ? t("iHaveIt") : t("iNeedIt")}
                </Button>
                {!owned && item.affiliateUrl && (
                  <Button asChild size="sm" className="flex-1">
                    <a
                      href={item.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {t("buyNow")}
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
