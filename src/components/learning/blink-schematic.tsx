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
 * Premium-Schaltbild für `esp32-blink-led` — echtes 830-Pin Breadboard +
 * 38-Pin AZ-Delivery ESP32 DevKit V1 (USB nach links, Pin-Header auf
 * Reihe a + Reihe i, 19 Pins pro Seite).
 *
 * Pin-Mapping (basierend auf offiziellem AZ-Delivery-Pinout):
 *   • GPIO 2 (D2)  = NORTH-Reihe (Brett-Reihe a) Index 12 → Spalte 13
 *   • GND          = SOUTH-Reihe (Brett-Reihe i) Index 13 → Spalte 14
 *                    (kürzester Weg zur Minus-Schiene unten)
 *   • 3V3          = SOUTH-Reihe Index 0 → Spalte 1 (Pin-Rand nur, kein Kabel)
 *
 * Bauteile sitzen RECHTS vom ESP-Modul (Spalten 20+ sind frei, weil das
 * 38-Pin ESP von Spalte 1-19 reicht):
 *   • Widerstand 220 Ω: Reihe a, Spalte 25 → Spalte 28
 *   • LED rot:         Reihe a, Spalte 28 (Anode/+) → Spalte 29 (Kathode/−)
 */

interface BlinkSchematicProps {
  ledOn?: boolean;
  ledAnimation?: "blink" | "solid" | "off";
  /** 0 = leeres Brett+ESP, 1 = +Widerstand, 2 = +LED, 3 = +Drähte, "all" = SIMULATE */
  buildStage?: 0 | 1 | 2 | 3 | "all";
  mode?: "build" | "boardOnly" | "boardWithHighlight" | "insertHint";
  className?: string;
}

// Pin-Positionen — Indizes in PIN_NORTH_LABELS / PIN_SOUTH_LABELS (s. geometry.ts)
const PIN_D2_INDEX = 12;       // NORTH: D2  → Brett-Spalte 13
const PIN_GND_INDEX = 13;      // SOUTH: GND → Brett-Spalte 14
const PIN_3V3_INDEX = 0;       // SOUTH: 3V3 → Brett-Spalte 1

// Bauteil-Positionen — RECHTS vom ESP (freier Brett-Bereich Spalten 20+)
const RES_LEFT_COL = 24;       // Spalte 25
const RES_RIGHT_COL = 27;      // Spalte 28
const LED_ANODE_COL = 27;      // Spalte 28 — gleich wie Resistor-rechts
const LED_CATHODE_COL = 28;    // Spalte 29

// Wire-Bridge-Höhe — Y-Position, auf der Drähte über das Brett "fliegen"
// (oberhalb der Plus-Schiene, im freien Raum zwischen Brett und Callouts)
const WIRE_BRIDGE_Y_TOP = 110;     // für Drähte, die ÜBER das Brett gehen
const WIRE_BRIDGE_Y_BOTTOM = 540;  // für Drähte, die UNTER das Brett gehen

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

  const activePins: ActivePin[] = [
    { col: PIN_3V3_INDEX, side: "south", tone: "power3v3" }, // Pin-Rand farbig, kein Callout
    {
      col: PIN_D2_INDEX,
      side: "north",
      tone: "signal",
      callout: { title: "GPIO 2", subtitle: "Signal-Pin" },
    },
    {
      col: PIN_GND_INDEX,
      side: "south",
      tone: "ground",
      callout: { title: "GND", subtitle: "Masse / Minus" },
    },
  ];

  return (
    <BreadboardCanvas
      mode={mode}
      activePins={activePins}
      ariaLabel="Blink-Schaltung — 38-Pin ESP32 mit LED + 220Ω Widerstand auf Breadboard"
      extraDefs={ledAnimation === "blink" ? <style>{LED_BLINK_CSS}</style> : null}
      className={className}
    >
      {/* 220Ω Widerstand — Reihe a, Spalte 25 → Spalte 28 (RECHTS vom ESP) */}
      {showResistor && <Resistor leftCol={RES_LEFT_COL} rightCol={RES_RIGHT_COL} ohms="220" />}

      {/* LED rot — Reihe a, Spalte 28 (Anode/+) → Spalte 29 (Kathode/−) */}
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
          {/* Grün-Signal: GPIO 2 (Reihe a Spalte 13) — F2M-Bridge OBEN ÜBER das Brett
              zur Widerstands-Spalte (Spalte 25, Reihe a). Real wird ein F2M-Jumper
              auf den ESP-Pin oben drauf gesteckt; im Diagramm fliegt das Kabel
              über die Plus-Schiene. */}
          <Wire
            {...WIRE_COLORS.signalGreen}
            path={`M ${colX(PIN_D2_INDEX)} ${ROW_Y_UPPER[0]}
                   L ${colX(PIN_D2_INDEX)} ${WIRE_BRIDGE_Y_TOP}
                   L ${colX(RES_LEFT_COL)} ${WIRE_BRIDGE_Y_TOP}
                   L ${colX(RES_LEFT_COL)} ${ROW_Y_UPPER[0]}`}
            animated={buildStage === "all" && isOn}
          />
          {/* Blau A: LED-Kathode (Spalte 29, Reihe a) — F2M-Bridge OBEN zur
              Minus-Schiene Spalte 29. Wire fliegt über das Brett. */}
          <Wire
            {...WIRE_COLORS.ground}
            path={`M ${colX(LED_CATHODE_COL)} ${ROW_Y_UPPER[0]}
                   L ${colX(LED_CATHODE_COL)} ${WIRE_BRIDGE_Y_BOTTOM}
                   L ${colX(LED_CATHODE_COL)} ${MINUS_RAIL_Y + 7}`}
            animated={buildStage === "all" && isOn}
          />
          {/* Blau B: GND-Pin (Reihe i Spalte 14, south) — F2M-Bridge UNTEN
              zur Minus-Schiene Spalte 14. Reihe i ist direkt nahe an
              Minus-Schiene (nur Reihe j dazwischen), daher kurzer Weg. */}
          <Wire
            {...WIRE_COLORS.ground}
            path={`M ${colX(PIN_GND_INDEX)} ${ROW_Y_LOWER[3]}
                   L ${colX(PIN_GND_INDEX)} ${ROW_Y_LOWER[4]}
                   L ${colX(PIN_GND_INDEX)} ${MINUS_RAIL_Y + 7}`}
            animated={buildStage === "all" && isOn}
          />
        </g>
      )}

      {/* BUILD-Stage-Spotlights — markieren Ziel-Spalten */}
      {buildStage === 1 && (
        <g>
          <BuildSpotlight col={RES_LEFT_COL} colLabel="25" />
          <BuildSpotlight col={RES_RIGHT_COL} colLabel="28" />
        </g>
      )}
      {buildStage === 2 && (
        <g>
          <BuildSpotlight col={LED_ANODE_COL} colLabel="28" subLabel="+ langes Bein" />
          <BuildSpotlight col={LED_CATHODE_COL} colLabel="29" subLabel="− kurzes Bein" />
        </g>
      )}
      {buildStage === 3 && (
        <g>
          <BuildSpotlight col={LED_CATHODE_COL} colLabel="29" subLabel="Kabel A — LED zur Minus-Schiene" />
          <PinSpotlight col={PIN_GND_INDEX} colLabel="14" subLabel="Kabel B — GND zur Minus-Schiene" row={ROW_Y_LOWER[3]} />
        </g>
      )}
    </BreadboardCanvas>
  );
}
