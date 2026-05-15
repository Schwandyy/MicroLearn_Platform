"use client";

import { useEffect, useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BoardOption {
  id: string;
  name: string;
  family: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function BoardSelector({
  boards,
  initialSelected,
}: {
  boards: BoardOption[];
  initialSelected: string[];
}) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { toast } = useToast();
  const initialSet = new Set(initialSelected);
  const [persisted, setPersisted] = useState<Set<string>>(initialSet);
  const [selected, setSelected] = useState<Set<string>>(initialSet);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const dirty = !sameSet(selected, persisted);

  // „Gespeichert" automatisch nach 2 s zurücksetzen
  useEffect(() => {
    if (saveState !== "saved") return;
    const id = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(id);
  }, [saveState]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (saveState === "saved" || saveState === "error") setSaveState("idle");
  };

  const save = () => {
    setSaveState("saving");
    startTransition(async () => {
      try {
        const res = await fetch("/api/profile/boards", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ boardIds: Array.from(selected) }),
        });
        if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}));
          console.error("[boards] save failed", res.status, errorBody);
          setSaveState("error");
          toast({
            title: t("boardSaveError"),
            description:
              (errorBody as { error?: string }).error ?? `HTTP ${res.status}`,
            variant: "destructive",
          });
          return;
        }
        setPersisted(new Set(selected));
        setSaveState("saved");
        toast({
          title: t("boardSaveOk"),
          description: t("boardSaveOkBody", { count: selected.size }),
        });
        // Empfohlene Projekte/Sektionen aktualisieren
        router.refresh();
      } catch (e) {
        console.error("[boards] save threw", e);
        setSaveState("error");
        toast({
          title: t("boardSaveError"),
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => {
          const checked = selected.has(b.id);
          return (
            <label
              key={b.id}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition",
                checked
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary",
              )}
            >
              <Checkbox checked={checked} onCheckedChange={() => toggle(b.id)} />
              <div>
                <div className="font-medium">{b.name}</div>
                {b.family && (
                  <div className="text-xs text-muted-foreground">{b.family}</div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "text-sm transition",
            saveState === "saved" && "font-medium text-emerald-600",
            saveState === "error" && "font-medium text-destructive",
            saveState !== "saved" && saveState !== "error" && "text-muted-foreground",
          )}
          aria-live="polite"
        >
          {saveState === "saved" && (
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              {t("boardSaveOk")}
            </span>
          )}
          {saveState === "error" && t("boardSaveError")}
          {saveState !== "saved" &&
            saveState !== "error" &&
            (dirty
              ? t("boardUnsavedHint")
              : selected.size > 0
                ? t("boardSelectedCount", { count: selected.size })
                : t("boardEmptyHint"))}
        </p>
        <Button
          onClick={save}
          disabled={isPending || !dirty}
          size="sm"
          className="min-w-[140px]"
        >
          {saveState === "saving" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("boardSaving")}
            </>
          ) : saveState === "saved" ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("boardSaved")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("boardSave")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
