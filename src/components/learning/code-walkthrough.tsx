"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: temporäres Textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      } finally {
        document.body.removeChild(ta);
      }
    }
  };

  const codeLines = code.split("\n");
  const noteForLine = (lineNumber: number) =>
    lines.find((n) => lineNumber >= n.from && lineNumber <= n.to);

  const selectedNote =
    selected !== null ? lines[selected] : null;

  return (
    <div className="grid gap-4">
      <div className="relative rounded-xl border bg-slate-950 p-1">
        <button
          type="button"
          onClick={copyCode}
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium transition",
            copied
              ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-100"
              : "bg-slate-900/80 text-slate-200 hover:bg-slate-800",
          )}
          aria-label={t("copyCode")}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t("copied")}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t("copyCode")}
            </>
          )}
        </button>
        <pre className="overflow-x-auto p-4 pt-10 font-mono text-sm leading-relaxed text-slate-100">
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
                <span className="flex-1 whitespace-pre select-text">{line || " "}</span>
                {note && (
                  <span className="select-none text-xs text-primary">
                    {isHighlighted ? "💡" : "ⓘ"}
                  </span>
                )}
              </div>
            );
          })}
        </pre>
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
