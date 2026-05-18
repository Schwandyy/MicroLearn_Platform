"use client";

import {
  BreadboardCanvas,
  BuildSpotlight,
  Led,
  LED_BLINK_CSS,
  PinSpotlight,
  Resistor,
  Wire,
  WIRE_COLORS,
  colX,
  ROW_Y_UPPER,
  ROW_Y_LOWER,
  MINUS_RAIL_Y,
} from "./wiring";
import type { ActivePin } from "./wiring";

/**
 * Premium-Schaltbild für `esp32-blink-led`. Verwendet die shared Wiring-
 * Building-Blocks (BreadboardCanvas + Resistor + Led + Wire) und definiert
 * nur die Blink-spezifischen Positionen + Build-Stages.
 *
 * 17-Step-Anfänger-Flow:
 *   - Step 3/4/6 EXPLAIN: mode="boardOnly" / "boardWithHighlight" / "insertHint"
 *   - Step BUILD 1-3: buildStage 1 (Widerstand), 2 (+LED), 3 (+Wires)
 *   - Step SIMULATE: buildStage="all" mit animation="blink"
 */

interface BlinkSchematicProps {
  ledOn?: boolean;
  ledAnimation?: "blink" | "solid" | "off";
  /** 0 = leeres Brett+ESP, 1 = +Widerstand, 2 = +LED, 3 = +Drähte, "all" = SIMULATE */
  buildStage?: 0 | 1 | 2 | 3 | "all";
  mode?: "build" | "boardOnly" | "boardWithHighlight" | "insertHint";
  className?: string;
}

// Lesson-spezifische Pin- und Bauteil-Positionen
const PIN_3V3_COL = 0;     // Spalte 1, bottom — nur farbig markiert
const PIN_GPIO2_COL = 3;   // Spalte 4, bottom — Signal-Pin
const PIN_GND_COL = 1;     // Spalte 2, top    — kürzester Weg zur Minus-Schiene
const RES_LEFT_COL = 17;
const RES_RIGHT_COL = 20;
const LED_ANODE_COL = 20;  // teilt sich mit RES_RIGHT_COL
const LED_CATHODE_COL = 21;

export function BlinkSchematic({
  ledOn = false,
  ledAnimation = "off",
  buildStage = "all",
  mode = "build",
  className,
}: BlinkSchematicProps) {
  const stageNum = buildStage === "all" ? 99 : buildStage;
  const isBuildMode = mode === "build";
  const showResistor = isBuildMode && stageNum >= 1;
  const showLed = isBuildMode && stageNum >= 2;
  const showWires = isBuildMode && stageNum >= 3;
  const isOn = (ledOn || buildStage === "all") && ledAnimation !== "off" && isBuildMode;

  // Pin-Coloring + Callouts: identisch zum Premium-Original — Pin-Ränder werden
  // immer farbig markiert wenn ESP gezeigt wird (insertHint inklusive). Die
  // Floating Callouts unterdrückt BreadboardCanvas im insertHint-Mode selbst.
  const activePins: ActivePin[] = [
    { col: PIN_3V3_COL, side: "bottom", tone: "power3v3" }, // nur Pin-Rand farbig, kein Callout
    {
      col: PIN_GPIO2_COL,
      side: "bottom",
      tone: "signal",
      callout: { title: "GPIO 2", subtitle: "Signal-Pin" },
    },
    {
      col: PIN_GND_COL,
      side: "top",
      tone: "ground",
      callout: { title: "GND", subtitle: "Masse / Minus" },
    },
  ];

  return (
    <BreadboardCanvas
      mode={mode}
      activePins={activePins}
      ariaLabel="Blink-Schaltung — ESP32 mit LED + 220Ω Widerstand auf Breadboard"
      extraDefs={ledAnimation === "blink" ? <style>{LED_BLINK_CSS}</style> : null}
      className={className}
    >
      {/* 220Ω Widerstand — Reihe a, Spalte 18 → Spalte 21 */}
      {showResistor && <Resistor leftCol={RES_LEFT_COL} rightCol={RES_RIGHT_COL} ohms="220" />}

      {/* LED rot — Reihe a, Spalte 21 (Anode/+) → Spalte 22 (Kathode/−) */}
      {showLed && (
        <Led
          anodeCol={LED_ANODE_COL}
          cathodeCol={LED_CATHODE_COL}
          color="red"
          on={isOn}
          animation={ledAnimation}
        />
      )}

      {/* Drähte */}
      {showWires && (
        <g>
          {/* Grün: GPIO 2 (Spalte 4, Reihe a) → Widerstand-links (Spalte 18, Reihe a) */}
          <Wire
            {...WIRE_COLORS.signalGreen}
            path={`M ${colX(PIN_GPIO2_COL)} ${ROW_Y_UPPER[0]}
                   L ${colX(PIN_GPIO2_COL)} ${ROW_Y_UPPER[0] - 50}
                   L ${colX(RES_LEFT_COL)} ${ROW_Y_UPPER[0] - 50}
                   L ${colX(RES_LEFT_COL)} ${ROW_Y_UPPER[0]}`}
            animated={buildStage === "all" && isOn}
          />
          {/* Blau A: LED-Kathode (Spalte 22) → Minus-Schiene Spalte 22 (senkrecht) */}
          <Wire
            {...WIRE_COLORS.ground}
            path={`M ${colX(LED_CATHODE_COL)} ${ROW_Y_UPPER[0]} L ${colX(LED_CATHODE_COL)} ${MINUS_RAIL_Y + 7}`}
            animated={buildStage === "all" && isOn}
          />
          {/* Blau B: GND-Pin (Spalte 2, untere Pin-Reihe j) → Minus-Schiene */}
          <Wire
            {...WIRE_COLORS.ground}
            path={`M ${colX(PIN_GND_COL)} ${ROW_Y_LOWER[4]}
                   L ${colX(PIN_GND_COL)} ${MINUS_RAIL_Y + 7}`}
            animated={buildStage === "all" && isOn}
          />
        </g>
      )}

      {/* BUILD-Stage-Spotlights */}
      {buildStage === 1 && (
        <g>
          <BuildSpotlight col={RES_LEFT_COL} colLabel="18" />
          <BuildSpotlight col={RES_RIGHT_COL} colLabel="21" />
        </g>
      )}
      {buildStage === 2 && (
        <g>
          <BuildSpotlight col={LED_ANODE_COL} colLabel="21" subLabel="+ langes Bein" />
          <BuildSpotlight col={LED_CATHODE_COL} colLabel="22" subLabel="− kurzes Bein" />
        </g>
      )}
      {buildStage === 3 && (
        <g>
          <BuildSpotlight col={LED_CATHODE_COL} colLabel="22" subLabel="Kabel A — LED zur Minus-Schiene" />
          <PinSpotlight col={PIN_GND_COL} colLabel="2" subLabel="Kabel B — GND zur Minus-Schiene" row={ROW_Y_LOWER[4]} />
        </g>
      )}
    </BreadboardCanvas>
  );
}
