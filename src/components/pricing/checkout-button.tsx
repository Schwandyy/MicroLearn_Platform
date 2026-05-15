"use client";

import { useTransition } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Plan = "PRO_MONTHLY" | "PRO_YEARLY" | "INSTITUTION";

export function CheckoutButton({
  plan,
  children,
  variant,
}: {
  plan: Plan;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const onClick = () =>
    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        window.location.href = "/auth/sign-in";
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) {
        toast({
          title: "Stripe nicht erreichbar",
          description: body.error ?? "Bitte später erneut versuchen.",
          variant: "destructive",
        });
        return;
      }
      window.location.href = body.url;
    });

  return (
    <Button onClick={onClick} disabled={isPending} className="w-full" variant={variant}>
      {children}
    </Button>
  );
}
