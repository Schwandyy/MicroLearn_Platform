"use client";

import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export interface BoardOption {
  id: string;
  name: string;
  family: string | null;
}

export function BoardSelector({
  boards,
  initialSelected,
}: {
  boards: BoardOption[];
  initialSelected: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  );
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = () => {
    startTransition(async () => {
      const res = await fetch("/api/profile/boards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardIds: Array.from(selected) }),
      });
      toast({
        title: res.ok ? "Saved" : "Failed",
        variant: res.ok ? "default" : "destructive",
      });
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
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:border-primary"
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
      <div className="flex justify-end">
        <Button onClick={save} disabled={isPending} size="sm">
          Save
        </Button>
      </div>
    </div>
  );
}
