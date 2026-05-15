"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function ManageSubscriptionButton() {
  const t = useTranslations("pricing");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onClick = () =>
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
    <Button onClick={onClick} disabled={isPending} className="w-full">
      {t("managePortal")}
    </Button>
  );
}
