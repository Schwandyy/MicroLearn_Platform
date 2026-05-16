"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Bell, BookOpen, Heart, MessageSquare, Sparkles } from "lucide-react";
import { useRouter } from "@/i18n/routing";

type NotificationType =
  | "COMMENT"
  | "LIKE"
  | "ASSIGNMENT"
  | "LESSON_PUBLISHED"
  | "SYSTEM";

interface Notif {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=20", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: Notif[];
        unreadCount: number;
      };
      setItems(data.items);
      setUnread(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const markRead = async (id: string) => {
    setItems((prev) =>
      prev.map((n) =>
        n.id === id && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n,
      ),
    );
    setUnread((u) => Math.max(0, u - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  const markAllRead = async () => {
    setItems((prev) =>
      prev.map((n) =>
        n.readAt ? n : { ...n, readAt: new Date().toISOString() },
      ),
    );
    setUnread(0);
    await fetch("/api/notifications/mark-all-read", { method: "POST" });
  };

  const handleClick = async (n: Notif) => {
    if (!n.readAt) await markRead(n.id);
    if (n.link) {
      setOpen(false);
      router.push(n.link as never);
    }
  };

  const badge = useMemo(() => {
    if (unread === 0) return null;
    return unread > 9 ? "9+" : String(unread);
  }, [unread]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("ariaLabel")}
        >
          <Bell className="h-4 w-4" />
          {badge && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {badge}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-w-[calc(100vw-1rem)] p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">{t("title")}</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("markAllRead")}
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t("loading")}
            </p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <ul>
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors last:border-b-0 hover:bg-muted/50 ${
                      n.readAt ? "" : "bg-primary/5"
                    }`}
                  >
                    <NotificationIcon type={n.type} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">
                          {n.title}
                        </p>
                        {!n.readAt && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatRelative(n.createdAt, t)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationIcon({ type }: { type: NotificationType }) {
  const cls = "mt-0.5 h-4 w-4 shrink-0";
  switch (type) {
    case "COMMENT":
      return <MessageSquare className={`${cls} text-sky-500`} />;
    case "LIKE":
      return <Heart className={`${cls} text-rose-500`} />;
    case "ASSIGNMENT":
      return <BookOpen className={`${cls} text-amber-500`} />;
    case "LESSON_PUBLISHED":
      return <Sparkles className={`${cls} text-emerald-500`} />;
    default:
      return <Bell className={`${cls} text-muted-foreground`} />;
  }
}

function formatRelative(iso: string, t: ReturnType<typeof useTranslations>): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return t("justNow");
  const min = Math.round(sec / 60);
  if (min < 60) return t("minutesAgo", { n: min });
  const hr = Math.round(min / 60);
  if (hr < 24) return t("hoursAgo", { n: hr });
  const day = Math.round(hr / 24);
  if (day < 30) return t("daysAgo", { n: day });
  return new Date(iso).toLocaleDateString();
}
