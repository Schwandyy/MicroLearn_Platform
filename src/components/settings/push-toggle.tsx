"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/admin/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, BellOff } from "lucide-react";

type State = "idle" | "denied" | "unsupported" | "subscribed";

export function PushToggle({
  vapidPublicKey,
  preferredLocale,
}: {
  vapidPublicKey: string | null;
  preferredLocale: "de" | "en";
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const [state, setState] = useState<State>("idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setState("subscribed");
      })
      .catch(() => undefined);
  }, []);

  const subscribe = async () => {
    if (!vapidPublicKey) {
      toast({ title: t("pushNotConfigured"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      let sub = existing;
      if (!sub) {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setState(perm === "denied" ? "denied" : "idle");
          return;
        }
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            .buffer as ArrayBuffer,
        });
      }
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          locale: preferredLocale,
        }),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      setState("subscribed");
      toast({ title: t("pushEnabled") });
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("idle");
      toast({ title: t("pushDisabled") });
    } finally {
      setBusy(false);
    }
  };

  if (state === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">{t("pushUnsupported")}</p>
    );
  }
  if (state === "denied") {
    return (
      <div className="grid gap-2">
        <Badge tone="warn">{t("pushBlocked")}</Badge>
        <p className="text-sm text-muted-foreground">{t("pushBlockedHint")}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="grid gap-1">
        <div className="flex items-center gap-2">
          {state === "subscribed" ? (
            <Bell className="h-4 w-4 text-primary" />
          ) : (
            <BellOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium">
            {state === "subscribed" ? t("pushOn") : t("pushOff")}
          </span>
        </div>
      </div>
      {state === "subscribed" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={unsubscribe}
          disabled={busy}
        >
          {t("pushTurnOff")}
        </Button>
      ) : (
        <Button size="sm" onClick={subscribe} disabled={busy || !vapidPublicKey}>
          {t("pushTurnOn")}
        </Button>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
