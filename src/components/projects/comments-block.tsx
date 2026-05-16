"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface CommentView {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

export function CommentsBlock({
  slug,
  loggedIn,
  currentUserId,
  isProjectOwner,
  isAdmin,
  comments,
}: {
  slug: string;
  loggedIn: boolean;
  currentUserId: string | null;
  isProjectOwner: boolean;
  isAdmin: boolean;
  comments: CommentView[];
}) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const body = text.trim();
    if (body.length < 2) return;
    startTransition(async () => {
      const res = await fetch(`/api/projects/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      setText("");
      router.refresh();
    });
  };

  const remove = (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    startTransition(async () => {
      const res = await fetch(`/api/projects/${slug}/comments/${id}`, {
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
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noComments")}</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const canDelete =
              isAdmin || isProjectOwner || c.authorId === currentUserId;
            return (
              <li
                key={c.id}
                className="rounded-md border bg-card p-3 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-medium">{c.authorName}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{c.body}</p>
                {canDelete && (
                  <div className="mt-1 flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(c.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {loggedIn ? (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("commentPlaceholder")}
            rows={3}
            maxLength={2000}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isPending || text.trim().length < 2}
          >
            {t("commentSubmit")}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">{t("loginToComment")}</p>
      )}
    </div>
  );
}
