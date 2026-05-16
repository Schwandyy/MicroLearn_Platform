"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, X } from "lucide-react";

export function ShowcaseToggle({
  slug,
  featured,
  initialRank,
}: {
  slug: string;
  featured: boolean;
  initialRank: number | null;
}) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [rank, setRank] = useState<string>(
    initialRank?.toString() ?? "",
  );

  const submit = (next: boolean) =>
    startTransition(async () => {
      const parsedRank = rank.trim() === "" ? null : Number(rank);
      const res = await fetch(`/api/projects/${slug}/showcase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featured: next,
          rank: Number.isFinite(parsedRank as number)
            ? (parsedRank as number)
            : null,
        }),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-primary/5 px-3 py-2">
      <Sparkles className="h-4 w-4 text-primary" />
      <span className="text-xs font-medium uppercase tracking-wide text-primary">
        Admin
      </span>
      {featured ? (
        <>
          <Input
            type="number"
            min={0}
            max={9999}
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            placeholder="rank"
            className="h-8 w-20"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => submit(true)}
            disabled={isPending}
          >
            {t("save")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => submit(false)}
            disabled={isPending}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            unpin
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          onClick={() => submit(true)}
          disabled={isPending}
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          {t("showcase")}
        </Button>
      )}
    </div>
  );
}
