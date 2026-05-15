"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Breadboard } from "./breadboard-svg";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

interface SimPayload {
  expectedBehavior_de?: string;
  expectedBehavior_en?: string;
  animation?: "blink" | "solid" | "fade" | "pulse";
  ledColor?: "red" | "green" | "yellow" | "blue";
}

/**
 * Eigener Mini-Simulator (Stub).
 * Phase 1: zeigt das erwartete Verhalten als CSS-Animation.
 * Phase 3 später: echter Code-Interpreter mit GPIO-State-Machine.
 */
export function MiniSimulator({
  payload,
  locale,
}: {
  payload: SimPayload;
  locale: "de" | "en";
}) {
  const t = useTranslations("lesson");
  const [running, setRunning] = useState(false);
  const behavior =
    (locale === "de" ? payload.expectedBehavior_de : payload.expectedBehavior_en) ??
    "";

  return (
    <div className="grid gap-4">
      <Breadboard
        ledOn={running}
        ledColor={payload.ledColor ?? "red"}
        ledAnimation={running ? payload.animation ?? "blink" : "off"}
      />
      <div className="flex flex-col items-center gap-3">
        {running ? (
          <Button
            size="lg"
            variant="destructive"
            onClick={() => setRunning(false)}
            className="rounded-full px-8"
          >
            <Square className="mr-2 h-4 w-4" />
            {t("stopProgram")}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={() => setRunning(true)}
            className="rounded-full px-8 shadow-lg"
          >
            <Play className="mr-2 h-4 w-4" />
            {t("runProgram")}
          </Button>
        )}
        {behavior && (
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {running ? "✨ " : "💡 "}
            {behavior}
          </p>
        )}
      </div>
    </div>
  );
}
