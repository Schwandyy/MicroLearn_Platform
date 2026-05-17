"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Breadboard } from "./breadboard-svg";
import { BlinkSchematic } from "./blink-schematic";
import { Button } from "@/components/ui/button";
import { Play, Square, AlertTriangle, Lightbulb, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimPayload {
  expectedBehavior_de?: string;
  expectedBehavior_en?: string;
  animation?: "blink" | "solid" | "fade" | "pulse";
  ledColor?: "red" | "green" | "yellow" | "blue";
  schematic?: "blink-premium";
}

type GndChoice = "minus" | "plus" | "missing";

/**
 * Mini-Simulator mit interaktivem GND-Anschluss.
 * Anfänger können live ausprobieren, was passiert, wenn das blaue
 * GND-Kabel woanders gesteckt wird — und sehen die Konsequenz.
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
  const [gndChoice, setGndChoice] = useState<GndChoice>("minus");

  const expectedBehavior =
    (locale === "de" ? payload.expectedBehavior_de : payload.expectedBehavior_en) ??
    "";

  const isCorrect = gndChoice === "minus";
  const isShort = gndChoice === "plus";

  // LED-Verhalten je nach Wahl
  const animation: SimPayload["animation"] | "off" = !running
    ? "off"
    : isCorrect
      ? payload.animation ?? "blink"
      : "off";

  const choiceMessages: Record<GndChoice, { de: string; en: string; tone: "ok" | "warn" | "err" }> = {
    minus: {
      de: "✓ Stromkreis geschlossen. Strom fließt: GPIO 2 → Widerstand → LED → Minus-Schiene → GND. Die LED blinkt.",
      en: "✓ Circuit closed. Current flows: GPIO 2 → resistor → LED → minus rail → GND. The LED blinks.",
      tone: "ok",
    },
    missing: {
      de: "✗ Kein Rückweg für den Strom. Stromkreis offen → die LED bleibt dunkel.",
      en: "✗ No return path for the current. Circuit open → the LED stays dark.",
      tone: "warn",
    },
    plus: {
      de: "⚠ ACHTUNG: GND an Plus = Kurzschluss zwischen 3,3 V und 0 V. Auf einem echten ESP32 würde das den Spannungsregler heiß machen — sofort wieder rausziehen!",
      en: "⚠ WARNING: GND on plus = short circuit between 3.3 V and 0 V. On a real ESP32 this would heat the regulator — pull it out right away!",
      tone: "err",
    },
  };
  const msg = choiceMessages[gndChoice];
  const msgText = locale === "de" ? msg.de : msg.en;

  return (
    <div className="grid gap-4">
      {payload.schematic === "blink-premium" ? (
        <BlinkSchematic
          ledOn={running && isCorrect}
          ledAnimation={
            !running || !isCorrect
              ? "off"
              : animation === "solid"
                ? "solid"
                : "blink"
          }
          buildStage="all"
        />
      ) : (
        <Breadboard
          ledOn={running && isCorrect}
          ledColor={payload.ledColor ?? "red"}
          ledAnimation={animation === "off" ? "off" : animation}
          highlightWires={running && !isCorrect ? [] : ["gnd"]}
        />
      )}

      <div className="grid gap-2">
        <p className="text-sm font-semibold">{t("simChoiceHeading")}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SimChoiceButton
            active={gndChoice === "minus"}
            onClick={() => setGndChoice("minus")}
            icon={<MinusCircle className="h-4 w-4" />}
            tone="ok"
          >
            {t("simChoiceMinus")}
          </SimChoiceButton>
          <SimChoiceButton
            active={gndChoice === "plus"}
            onClick={() => setGndChoice("plus")}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone="err"
          >
            {t("simChoicePlus")}
          </SimChoiceButton>
          <SimChoiceButton
            active={gndChoice === "missing"}
            onClick={() => setGndChoice("missing")}
            icon={<Lightbulb className="h-4 w-4" />}
            tone="warn"
          >
            {t("simChoiceMissing")}
          </SimChoiceButton>
        </div>

        <p
          className={cn(
            "rounded-md p-3 text-sm leading-relaxed",
            msg.tone === "ok" && "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
            msg.tone === "warn" && "bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
            msg.tone === "err" && "bg-red-50 text-red-900 dark:bg-red-900/30 dark:text-red-100",
          )}
        >
          {msgText}
        </p>
      </div>

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
        {expectedBehavior && (
          <p className="max-w-md text-center text-sm text-muted-foreground">
            {running && isCorrect ? "✨ " : "💡 "}
            {expectedBehavior}
          </p>
        )}
        <p className="max-w-md text-center text-xs text-muted-foreground/80">
          🖥️ {t("simulatorHint")}
        </p>
      </div>
    </div>
  );
}

function SimChoiceButton({
  active,
  onClick,
  icon,
  tone,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tone: "ok" | "warn" | "err";
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition",
        !active && "border-border bg-background text-muted-foreground hover:border-primary hover:text-foreground",
        active && tone === "ok" && "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30",
        active && tone === "warn" && "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-900/30",
        active && tone === "err" && "border-red-500 bg-red-50 text-red-900 dark:bg-red-900/30",
      )}
    >
      {icon}
      <span className="text-left text-xs leading-tight">{children}</span>
    </button>
  );
}
