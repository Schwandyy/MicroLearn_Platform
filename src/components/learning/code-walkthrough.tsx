"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface LineNote {
  from: number;
  to: number;
  explain_de: string;
  explain_en: string;
}

export function CodeWalkthrough({
  code,
  lines,
  locale,
}: {
  code: string;
  lines: LineNote[];
  locale: "de" | "en";
}) {
  const t = useTranslations("lesson");
  const [selected, setSelected] = useState<number | null>(0);

  const codeLines = code.split("\n");
  const noteForLine = (lineNumber: number) =>
    lines.find((n) => lineNumber >= n.from && lineNumber <= n.to);

  const selectedNote =
    selected !== null ? lines[selected] : null;

  return (
    <div className="grid gap-4">
      <div className="rounded-xl border bg-slate-950 p-1">
        <div className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-slate-100">
          {codeLines.map((line, idx) => {
            const lineNumber = idx + 1;
            const note = noteForLine(lineNumber);
            const noteIndex = note ? lines.indexOf(note) : -1;
            const isHighlighted = selected === noteIndex;
            return (
              <div
                key={idx}
                onClick={() => note && setSelected(noteIndex)}
                className={cn(
                  "flex gap-3 rounded px-2 py-0.5 transition",
                  note && "cursor-pointer hover:bg-slate-800",
                  isHighlighted && "bg-primary/30 ring-1 ring-primary",
                )}
              >
                <span className="w-6 select-none text-right text-slate-500">
                  {lineNumber}
                </span>
                <span className="flex-1 whitespace-pre">{line || " "}</span>
                {note && (
                  <span className="text-xs text-primary">
                    {isHighlighted ? "💡" : "ⓘ"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        {selectedNote ? (
          <p className="text-sm leading-relaxed">
            {locale === "de" ? selectedNote.explain_de : selectedNote.explain_en}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("tapToExplain")}</p>
        )}
      </div>
    </div>
  );
}
