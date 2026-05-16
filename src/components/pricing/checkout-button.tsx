"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Plan = "PRO_MONTHLY" | "PRO_YEARLY" | "INSTITUTION";
type Currency = "EUR" | "CHF";

export function CheckoutButton({
  plan,
  currency,
  children,
  variant,
  className,
}: {
  plan: Plan;
  currency?: Currency;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const tc = useTranslations("common");
  const tP = useTranslations("pricing");
  const { toast } = useToast();

  const onClick = () =>
    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, currency }),
      });
      if (res.status === 401) {
        window.location.href = "/auth/sign-in";
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        toast({
          title: tP("stripeUnavailable"),
          description: body.error ?? tc("retryLater"),
          variant: "destructive",
        });
        return;
      }
      window.location.href = body.url;
    });

  return (
    <Button
      onClick={onClick}
      disabled={isPending}
      className={className ?? "w-full"}
      variant={variant}
    >
      {children}
    </Button>
  );
}
