"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

export function AdminCommentDelete({ id }: { id: string }) {
  const router = useRouter();
  const tc = useTranslations("common");
  const tA = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(tA("commentDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      router.refresh();
    });
  };
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      disabled={isPending}
      aria-label="delete"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
