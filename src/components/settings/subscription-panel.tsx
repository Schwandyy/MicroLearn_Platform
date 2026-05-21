"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Award, ExternalLink, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Tier = "FREE" | "PRO" | "ELITE" | "INSTITUTION";
type Status =
  | "ACTIVE"
  | "TRIALING"
  | "PAST_DUE"
  | "CANCELED"
  | "INCOMPLETE"
  | null;

export function SubscriptionPanel({
  tier,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  hasCustomer,
}: {
  tier: Tier;
  status: Status;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  hasCustomer: boolean;
}) {
  const t = useTranslations("settings");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const tierLabel = t(
    tier === "PRO"
      ? "subTierPro"
      : tier === "ELITE"
        ? "subTierElite"
        : tier === "INSTITUTION"
          ? "subTierInstitution"
          : "subTierFree",
  );

  const statusLabel = status
    ? t(
        status === "ACTIVE"
          ? "subActive"
          : status === "TRIALING"
            ? "subTrialing"
            : status === "PAST_DUE"
              ? "subPastDue"
              : status === "CANCELED"
                ? "subCanceled"
                : "subIncomplete",
      )
    : null;

  const periodLabel = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString()
    : null;

  const openPortal = () =>
    startTransition(async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        toast({
          title: "Stripe-Portal nicht erreichbar",
          variant: "destructive",
        });
        return;
      }
      window.location.href = body.url;
    });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold",
            tier === "FREE"
              ? "border-muted bg-muted/50"
              : tier === "PRO"
                ? "border-primary/40 bg-primary/10 text-primary"
                : tier === "ELITE"
                  ? "border-violet-400 bg-violet-100 text-violet-900 dark:border-violet-600 dark:bg-violet-900/30 dark:text-violet-200"
                  : "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
          )}
        >
          {tier === "INSTITUTION" ? (
            <Award className="h-4 w-4" />
          ) : tier === "ELITE" ? (
            <Zap className="h-4 w-4" />
          ) : tier === "PRO" ? (
            <Sparkles className="h-4 w-4" />
          ) : null}
          {tierLabel}
        </div>
        {statusLabel && tier !== "FREE" && (
          <span className="text-xs text-muted-foreground">{statusLabel}</span>
        )}
      </div>

      {periodLabel && tier !== "FREE" && (
        <p className="text-sm text-muted-foreground">
          {cancelAtPeriodEnd
            ? t("subEndsOn", { date: periodLabel })
            : t("subRenewsOn", { date: periodLabel })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {hasCustomer && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openPortal}
            disabled={isPending}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {t("manage")}
          </Button>
        )}
        {(tier === "FREE" || tier === "PRO") && (
          <Button asChild size="sm">
            <Link href="/pricing">
              <Sparkles className="mr-2 h-4 w-4" />
              {t("upgrade")}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
