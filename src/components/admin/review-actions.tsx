"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "@/i18n/routing";
import { CheckCircle2, XCircle, MessageSquareWarning } from "lucide-react";

export function ReviewActions({
  reviewId,
  lessonId,
  status,
}: {
  reviewId: string;
  lessonId: string;
  status: string;
}) {
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const tc = useTranslations("common");
  const { toast } = useToast();
  const router = useRouter();

  const act = (decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT") =>
    startTransition(async () => {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });
      if (!res.ok) {
        toast({
          title: tc("error"),
          description: await res.text().catch(() => undefined),
          variant: "destructive",
        });
        return;
      }
      toast({ title: `Entscheidung: ${decision}` });
      router.push("/admin/review");
    });

  return (
    <div className="mt-8 rounded-xl border bg-card p-6">
      <Label htmlFor="notes">Reviewer-Notizen (intern)</Label>
      <Input
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="optional — z.B. Begründung der Entscheidung"
        className="mt-2"
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => act("APPROVE")}
          disabled={isPending || status === "PUBLISHED"}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Approve &amp; Publish
        </Button>
        <Button
          variant="outline"
          onClick={() => act("REQUEST_CHANGES")}
          disabled={isPending}
        >
          <MessageSquareWarning className="mr-2 h-4 w-4" />
          Changes anfordern
        </Button>
        <Button
          variant="destructive"
          onClick={() => act("REJECT")}
          disabled={isPending}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Lesson-ID: <code>{lessonId}</code> · Review-ID: <code>{reviewId}</code>
      </p>
    </div>
  );
}
