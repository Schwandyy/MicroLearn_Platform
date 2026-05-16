"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";

export function LessonCompleteButton({
  lessonId,
  alreadyCompleted,
}: {
  lessonId: string;
  alreadyCompleted: boolean;
}) {
  const t = useTranslations("lesson");
  const tc = useTranslations("common");
  const [done, setDone] = useState(alreadyCompleted);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  if (done) {
    return (
      <Button variant="outline" disabled className="w-full">
        <Check className="mr-2 h-4 w-4 text-emerald-500" />
        {t("completed")}
      </Button>
    );
  }

  const complete = () =>
    startTransition(async () => {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, {
        method: "POST",
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      const body = await res.json();
      setDone(true);
      toast({
        title: t("completed"),
        description: t("xp", { xp: body.xpGained ?? 0 }),
      });
      router.refresh();
    });

  return (
    <Button size="lg" onClick={complete} disabled={isPending} className="w-full">
      {t("markComplete")}
    </Button>
  );
}
