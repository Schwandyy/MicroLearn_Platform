"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function MentorChat({
  lessonId,
  available,
}: {
  lessonId?: string;
  available: boolean;
}) {
  const t = useTranslations("mentor");
  const locale = useLocale() as "de" | "en";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setErrorMessage(null);
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ];
    setMessages(next);
    setStreaming(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          locale,
          messages: next
            .filter((m, i) => i < next.length - 1)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (res.status === 402) {
        setErrorMessage(t("loginRequired"));
        setMessages(messages);
        return;
      }
      if (res.status === 429) {
        setErrorMessage(t("limitReached"));
        setMessages(messages);
        return;
      }
      if (!res.ok || !res.body) {
        setErrorMessage("Error");
        setMessages(messages);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          try {
            const evt = JSON.parse(line.slice(5).trim());
            if (evt.type === "meta") {
              setRemaining(evt.remaining);
            } else if (evt.type === "delta") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (!last) return prev;
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: last.content + evt.text },
                ];
              });
            } else if (evt.type === "error") {
              setErrorMessage(evt.message ?? "Error");
            }
          } catch {
            // ignore parse errors on partial frames
          }
        }
      }
    } finally {
      setStreaming(false);
    }
  };

  if (!available) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label={t("openMentor")}
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          {t("openMentor")}
        </button>
      )}

      <div
        className={cn(
          "fixed bottom-4 right-4 z-40 flex w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl transition-all",
          open ? "h-[min(640px,calc(100vh-2rem))]" : "pointer-events-none h-0 opacity-0",
        )}
      >
        <header className="flex items-center justify-between border-b bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{t("title")}</span>
          </div>
          <button
            type="button"
            aria-label="close"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {locale === "de"
                ? "Frag mich alles zur Lektion — Schaltplan, Code, Bauteile, Theorie."
                : "Ask me anything about the lesson — schematic, code, components, theory."}
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                m.role === "user"
                  ? "ml-8 bg-primary text-primary-foreground"
                  : "mr-8 bg-muted",
              )}
            >
              <div className="whitespace-pre-wrap">{m.content || (streaming && i === messages.length - 1 ? "…" : "")}</div>
            </div>
          ))}
          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>

        <footer className="border-t bg-card p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={streaming}
            />
            <Button type="submit" disabled={streaming || !input.trim()} size="icon">
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          {remaining !== null && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t("remaining", { n: remaining })}
            </p>
          )}
        </footer>
      </div>
    </>
  );
}
