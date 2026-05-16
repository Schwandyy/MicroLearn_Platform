"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function LikeButton({
  slug,
  initialCount,
  initialLiked,
  loggedIn,
}: {
  slug: string;
  initialCount: number;
  initialLiked: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const tc = useTranslations("common");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  const toggle = () => {
    if (!loggedIn) {
      router.push(`/auth/sign-in?callbackUrl=/projects/${slug}`);
      return;
    }
    startTransition(async () => {
      const method = liked ? "DELETE" : "POST";
      const res = await fetch(`/api/projects/${slug}/like`, { method });
      if (!res.ok) {
        toast({ title: tc("error"), variant: "destructive" });
        return;
      }
      const body = await res.json().catch(() => null);
      if (body?.liked !== undefined && typeof body.count === "number") {
        setLiked(body.liked);
        setCount(body.count);
      }
    });
  };

  return (
    <Button
      type="button"
      variant={liked ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "gap-1.5",
        liked && "bg-rose-500 hover:bg-rose-600",
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          liked && "fill-current",
        )}
      />
      <span className="tabular-nums">{count}</span>
    </Button>
  );
}
