"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export function DeleteProjectButton({ slug }: { slug: string }) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const res = await fetch(`/api/projects/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      router.push("/projects");
    });
  };

  return (
    <Button
      onClick={onClick}
      size="sm"
      variant="outline"
      disabled={isPending}
    >
      <Trash2 className="mr-2 h-3.5 w-3.5" />
      {t("delete")}
    </Button>
  );
}
