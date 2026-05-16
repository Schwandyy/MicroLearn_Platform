"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

const BLINK_MS = 500;
const TARGET_BLINKS = 5;

export function LedBlinkSimulator({
  onCompleted,
}: {
  onCompleted: () => void;
}) {
  const t = useTranslations("starter.simulator");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [ledOn, setLedOn] = useState(false);
  const [blinkCount, setBlinkCount] = useState(0);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const lastReportedDone = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLedOn((prev) => {
        const next = !prev;
        if (next) {
          setHighlightedLine(2);
          setBlinkCount((c) => c + 1);
        } else {
          setHighlightedLine(4);
        }
        return next;
      });
    }, BLINK_MS);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (blinkCount >= TARGET_BLINKS && !lastReportedDone.current) {
      lastReportedDone.current = true;
      setRunning(false);
      setLedOn(false);
      setHighlightedLine(null);
      onCompleted();
    }
  }, [blinkCount, onCompleted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 360;
    const height = 220;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Steckbrett-Untergrund (vereinfacht)
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, width, height);

    // Mikrocontroller-Block
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(28, 90, 90, 60);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText("ESP32", 50, 124);
    // GPIO13-Pin
    ctx.fillStyle = "#facc15";
    ctx.fillRect(118, 100, 8, 6);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("D13", 130, 106);

    // Kabel zum Widerstand
    ctx.strokeStyle = "#fcd34d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(126, 103);
    ctx.lineTo(180, 103);
    ctx.stroke();

    // Widerstand 220 Ω
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(180, 96, 50, 14);
    ctx.fillStyle = "#1f2937";
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText("220 Ω", 188, 106);

    // Kabel zur LED
    ctx.strokeStyle = "#fcd34d";
    ctx.beginPath();
    ctx.moveTo(230, 103);
    ctx.lineTo(270, 103);
    ctx.stroke();

    // LED-Body
    const ledX = 285;
    const ledY = 103;
    const ledR = 14;
    if (ledOn) {
      const glow = ctx.createRadialGradient(ledX, ledY, 0, ledX, ledY, 60);
      glow.addColorStop(0, "rgba(248, 113, 113, 0.6)");
      glow.addColorStop(1, "rgba(248, 113, 113, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ledX, ledY, 60, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ledOn ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(ledX, ledY, ledR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Lead-Beinchen
    ctx.strokeStyle = "#cbd5e1";
    ctx.beginPath();
    ctx.moveTo(ledX - 4, ledY + ledR);
    ctx.lineTo(ledX - 4, ledY + ledR + 18);
    ctx.moveTo(ledX + 4, ledY + ledR);
    ctx.lineTo(ledX + 4, ledY + ledR + 18);
    ctx.stroke();

    // GND-Linie zurück
    ctx.strokeStyle = "#60a5fa";
    ctx.beginPath();
    ctx.moveTo(ledX + 4, ledY + ledR + 18);
    ctx.lineTo(60, ledY + ledR + 30);
    ctx.lineTo(60, 150);
    ctx.stroke();
    ctx.fillStyle = "#60a5fa";
    ctx.font = "9px ui-monospace, monospace";
    ctx.fillText("GND", 65, 175);
  }, [ledOn]);

  const codeLines: { text: string; line: number; comment: string }[] = [
    { text: "void setup() {", line: 1, comment: t("commentSetup") },
    { text: "  pinMode(13, OUTPUT);", line: 1, comment: t("commentPinMode") },
    { text: "}", line: 1, comment: "" },
    { text: "void loop() {", line: 2, comment: "" },
    { text: "  digitalWrite(13, HIGH);", line: 2, comment: t("commentOn") },
    { text: "  delay(500);", line: 2, comment: t("commentDelay") },
    { text: "  digitalWrite(13, LOW);", line: 4, comment: t("commentOff") },
    { text: "  delay(500);", line: 4, comment: t("commentDelay") },
    { text: "}", line: 4, comment: "" },
  ];

  const start = () => {
    if (blinkCount >= TARGET_BLINKS) reset();
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setLedOn(false);
    setBlinkCount(0);
    setHighlightedLine(null);
    lastReportedDone.current = false;
  };

  const progressLabel = t("progress", {
    current: Math.min(blinkCount, TARGET_BLINKS),
    total: TARGET_BLINKS,
  });

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-[auto_1fr]">
        <div className="rounded-2xl border bg-slate-950 p-2">
          <canvas ref={canvasRef} className="rounded-xl" />
        </div>
        <pre className="overflow-x-auto rounded-2xl border bg-slate-950 p-4 text-xs leading-relaxed text-slate-200 md:text-sm">
          <code>
            {codeLines.map((cl, i) => {
              const active = cl.line === highlightedLine;
              return (
                <div
                  key={i}
                  className={
                    active
                      ? "rounded bg-amber-400/20 px-1 transition"
                      : "px-1 transition"
                  }
                >
                  <span className="text-slate-100">{cl.text}</span>
                  {cl.comment && (
                    <span className="ml-3 text-slate-500">
                      {"// "}
                      {cl.comment}
                    </span>
                  )}
                </div>
              );
            })}
          </code>
        </pre>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3">
        <div className="text-sm font-medium">{progressLabel}</div>
        <div className="flex items-center gap-2">
          {running ? (
            <Button type="button" size="sm" variant="outline" onClick={pause}>
              <Pause className="mr-2 h-4 w-4" />
              {t("pause")}
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={start}>
              <Play className="mr-2 h-4 w-4" />
              {blinkCount > 0 && blinkCount < TARGET_BLINKS
                ? t("resume")
                : t("run")}
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("reset")}
          </Button>
        </div>
      </div>
    </div>
  );
}
