"use client";

import { useEffect, useState } from "react";

type Op = "HIGH" | "LOW" | "WAIT" | null;
type Line = { text: string; op: Op };

const CODE_LINES: Line[] = [
  { text: "void setup() {", op: null },
  { text: "  pinMode(2, OUTPUT);", op: null },
  { text: "}", op: null },
  { text: "", op: null },
  { text: "void loop() {", op: null },
  { text: "  digitalWrite(2, HIGH);", op: "HIGH" },
  { text: "  delay(500);", op: "WAIT" },
  { text: "  digitalWrite(2, LOW);", op: "LOW" },
  { text: "  delay(500);", op: "WAIT" },
  { text: "}", op: null },
];

const LOOP_START = 5;
const LOOP_END = 8;
const TICK_MS = 700;

export function HeroDemo() {
  const [activeIdx, setActiveIdx] = useState(LOOP_START);
  const [ledOn, setLedOn] = useState(false);

  useEffect(() => {
    const initial = CODE_LINES[LOOP_START];
    if (initial?.op === "HIGH") setLedOn(true);

    const id = setInterval(() => {
      setActiveIdx((prev) => {
        const next = prev >= LOOP_END ? LOOP_START : prev + 1;
        const line = CODE_LINES[next];
        if (line?.op === "HIGH") setLedOn(true);
        else if (line?.op === "LOW") setLedOn(false);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px]">
      <div className="rounded-xl bg-zinc-950 p-4 font-mono text-[13px] leading-relaxed text-zinc-100 shadow-2xl ring-1 ring-zinc-800/60">
        <div className="mb-3 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
          <span className="ml-3 text-[11px] uppercase tracking-wider text-zinc-500">
            blink.ino
          </span>
        </div>
        {CODE_LINES.map((line, i) => (
          <div
            key={i}
            className={`-mx-2 rounded px-2 transition-colors duration-200 ${
              i === activeIdx ? "bg-red-500/15 text-red-100" : "text-zinc-300"
            }`}
          >
            <span className="mr-3 select-none text-zinc-600">
              {(i + 1).toString().padStart(2, " ")}
            </span>
            <CodeLine text={line.text} />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl bg-zinc-900 p-6 text-zinc-100 shadow-2xl ring-1 ring-zinc-800/60">
        <div className="mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
          ESP32 · GPIO 2
        </div>
        <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-800">
          <div
            className={`h-12 w-12 rounded-full transition-all duration-200 ${
              ledOn
                ? "bg-red-500 shadow-[0_0_40px_10px_rgba(239,68,68,0.45)]"
                : "bg-zinc-700"
            }`}
          />
        </div>
        <div className="mt-4 text-center text-xs text-zinc-400">
          Live-Vorschau<br />
          deiner ersten Lesson
        </div>
      </div>
    </div>
  );
}

// Minimaler Syntax-Highlighter — kommt ohne externe Dependency aus.
function CodeLine({ text }: { text: string }) {
  if (!text) return <span>&nbsp;</span>;
  const keywords = ["void", "if", "else", "for", "while", "return"];
  const tokens = text.split(/(\s+|[(){};,]|"[^"]*")/g);
  return (
    <span>
      {tokens.map((tok, i) => {
        if (!tok) return null;
        if (keywords.includes(tok))
          return (
            <span key={i} className="text-violet-300">
              {tok}
            </span>
          );
        if (/^\d+$/.test(tok))
          return (
            <span key={i} className="text-amber-300">
              {tok}
            </span>
          );
        if (tok === "HIGH" || tok === "LOW")
          return (
            <span key={i} className="text-emerald-300">
              {tok}
            </span>
          );
        if (
          tok === "pinMode" ||
          tok === "digitalWrite" ||
          tok === "delay" ||
          tok === "setup" ||
          tok === "loop"
        )
          return (
            <span key={i} className="text-sky-300">
              {tok}
            </span>
          );
        return <span key={i}>{tok}</span>;
      })}
    </span>
  );
}
