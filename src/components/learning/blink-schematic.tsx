"use client";

import { useBoardVariant } from "./board-variant-context";
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
  findPinCol,
  getPinY,
} from "./wiring";
import type { ActivePin } from "./wiring";

/**
 * Premium-Schaltbild für `esp32-blink-led` — variant-aware (30-Pin / 38-Pin).
 * Pin-Positionen + ESP-Body-Geometrie kommen aus dem BoardVariant-Context.
 *
 * Bauteile sitzen RECHTS vom ESP, auf Brett-Reihe a (das ist sowohl bei 30-Pin
 * als auch bei 38-Pin eine freie Reihe — bei 38-Pin gilt das ab Spalte 20+,
 * bei 30-Pin ab Spalte 16+).
 *   • Widerstand 220 Ω: Reihe a, Spalte 25 → Spalte 28
 *   • LED rot:          Reihe a, Spalte 28 (Anode/+) → Spalte 29 (Kathode/−)
 */

interface BlinkSchematicProps {
  ledOn?: boolean;
  ledAnimation?: "blink" | "solid" | "off";
  /** 0 = leeres Brett+ESP, 1 = +Widerstand, 2 = +LED, 3 = +Drähte, "all" = SIMULATE */
  buildStage?: 0 | 1 | 2 | 3 | "all";
  mode?: "build" | "boardOnly" | "boardWithHighlight" | "insertHint";
  className?: string;
}

// Bauteil-Positionen — gleich für beide Varianten (rechts vom ESP, Spalten 20+)
const RES_LEFT_COL = 24;    // Spalte 25
const RES_RIGHT_COL = 27;   // Spalte 28
const LED_ANODE_COL = 27;   // Spalte 28
const LED_CATHODE_COL = 28; // Spalte 29

// Wire-Bridge-Y: Drähte fliegen oberhalb der Plus-Schiene (Y=110), bzw. wenn
// die GND-Verbindung zur Minus-Schiene unterhalb verlaufen soll (Y=540).
const WIRE_BRIDGE_Y_TOP = 110;
const WIRE_BRIDGE_Y_BOTTOM = 540;

export function BlinkSchematic({
  ledOn = false,
  ledAnimation = "off",
  buildStage = "all",
  mode = "build",
  className,
}: BlinkSchematicProps) {
  const { variant, signalPinLabel } = useBoardVariant();
  const stageNum = buildStage === "all" ? 99 : buildStage;
  const isBuildMode = mode === "build";
  const showResistor = isBuildMode && stageNum >= 1;
  const showLed = isBuildMode && stageNum >= 2;
  const showWires = isBuildMode && stageNum >= 3;
  const isOn = (ledOn || buildStage === "all") && ledAnimation !== "off" && isBuildMode;

  // Pin-Positionen aus der gewählten Variante. Signal-Pin (default D2)
  // ist vom User pro Lesson wählbar — siehe Esp32PinVisual.
  // Signal-Pin liegt auf der NORTH-Seite, GND auf SOUTH (kürzester Weg).
  // Falls Pin nicht auf der NORTH-Seite ist (z.B. exotischer Pin), nehmen
  // wir D2 als Fallback.
  let signalPinCol = findPinCol(variant, "north", signalPinLabel);
  let signalSide: "north" | "south" = "north";
  if (signalPinCol < 0) {
    signalPinCol = findPinCol(variant, "south", signalPinLabel);
    signalSide = "south";
  }
  if (signalPinCol < 0) {
    signalPinCol = findPinCol(variant, "north", "D2");
    signalSide = "north";
  }
  const signalPinY = signalSide === "north" ? getPinY(variant, "north") : getPinY(variant, "south");

  const pinGndCol = findPinCol(variant, "south", "GND");
  const pin3v3Col = findPinCol(variant, "south", "3V3");
  const pinGndY = getPinY(variant, "south");

  // GPIO-Nummer aus Label (z.B. "D4" → 4); für den Callout-Titel
  const signalGpioMatch = signalPinLabel.match(/D(\d+)/);
  const signalGpioNum = signalGpioMatch ? signalGpioMatch[1] : "?";

  const activePins: ActivePin[] = [
    ...(pin3v3Col >= 0 ? [{ col: pin3v3Col, side: "south" as const, tone: "power3v3" as const }] : []),
    ...(signalPinCol >= 0
      ? [{ col: signalPinCol, side: signalSide, tone: "signal" as const, callout: { title: `GPIO ${signalGpioNum}`, subtitle: "Signal-Pin" } }]
      : []),
    ...(pinGndCol >= 0
      ? [{ col: pinGndCol, side: "south" as const, tone: "ground" as const, callout: { title: "GND", subtitle: "Masse / Minus" } }]
      : []),
  ];

  // GND-Pin liegt bei 38-Pin in Reihe i (nah Minus-Schiene), bei 30-Pin in
  // Reihe f (etwas weiter weg). In beiden Fällen geht das Kabel senkrecht
  // runter zur Minus-Schiene.
  return (
    <BreadboardCanvas
      mode={mode}
      activePins={activePins}
      ariaLabel={`Blink-Schaltung — ${variant.shortLabel} ESP32 mit LED + 220Ω Widerstand auf Breadboard`}
      extraDefs={ledAnimation === "blink" ? <style>{LED_BLINK_CSS}</style> : null}
      className={className}
    >
      {/* 220Ω Widerstand */}
      {showResistor && <Resistor leftCol={RES_LEFT_COL} rightCol={RES_RIGHT_COL} ohms="220" />}

      {/* LED rot */}
      {showLed && (
        <Led
          anodeCol={LED_ANODE_COL}
          cathodeCol={LED_CATHODE_COL}
          color="red"
          on={isOn}
          animation={ledAnimation}
        />
      )}

      {/* Drähte — physisch korrekt:
          • Bei 38-Pin (Pin-Header auf Reihe a + i) gibt es KEINE freien Brett-
            Löcher in der Pin-Spalte. Signal-Kabel braucht F2M (weibliches Ende
            auf den Pin oben drauf). Wire-Anfang liegt visuell ÜBER dem Pin.
          • Bei 30-Pin (Pin-Header auf e + f) sind Reihen a-d Spalte X freie
            Löcher der gleichen Brett-Spalten-Reihe — M-M-Kabel passt direkt
            in z.B. Reihe a Spalte X.
          • GND-Kabel: Reihe j Spalte X ist für BEIDE Varianten ein freies
            Loch in der gleichen Brett-Spalten-Reihe wie der GND-Pin
            (Brett verbindet Reihen f-j intern). M-M passt rein. */}
      {showWires && signalPinCol >= 0 && pinGndCol >= 0 && (() => {
        const isCompactBoard = variant.northRowYIndex === 0; // 38-Pin
        const signalWireStartY = isCompactBoard ? signalPinY - 18 : ROW_Y_UPPER[0];
        return (
          <g>
            {/* F2M-Stecker-Indicator OBEN auf dem Signal-Pin (nur 38-Pin) */}
            {isCompactBoard && (
              <g pointerEvents="none">
                <rect
                  x={colX(signalPinCol) - 6}
                  y={signalPinY - 24}
                  width="12"
                  height="10"
                  rx="1.5"
                  fill="#1f2937"
                  stroke="#0f172a"
                  strokeWidth="0.6"
                />
                <circle cx={colX(signalPinCol)} cy={signalPinY - 19} r="2" fill="#facc15" />
              </g>
            )}
            {/* Grün-Signal: aktuell gewählter Pin → Widerstand */}
            <Wire
              {...WIRE_COLORS.signalGreen}
              path={`M ${colX(signalPinCol)} ${signalWireStartY}
                     L ${colX(signalPinCol)} ${WIRE_BRIDGE_Y_TOP}
                     L ${colX(RES_LEFT_COL)} ${WIRE_BRIDGE_Y_TOP}
                     L ${colX(RES_LEFT_COL)} ${ROW_Y_UPPER[0]}`}
              animated={buildStage === "all" && isOn}
            />
            {/* Blau A: LED-Kathode (Reihe a) → Minus-Schiene */}
            <Wire
              {...WIRE_COLORS.ground}
              path={`M ${colX(LED_CATHODE_COL)} ${ROW_Y_UPPER[0]}
                     L ${colX(LED_CATHODE_COL)} ${WIRE_BRIDGE_Y_BOTTOM}
                     L ${colX(LED_CATHODE_COL)} ${MINUS_RAIL_Y + 7}`}
              animated={buildStage === "all" && isOn}
            />
            {/* Blau B: Reihe j Spalte X (freies Loch unter dem GND-Pin) → Minus-Schiene.
                Kabel-Start ist NICHT im Pin-Loch (das ist vom Pin belegt) sondern in
                Reihe j — elektrisch identisch via Brett-Spalten-Schiene. */}
            <Wire
              {...WIRE_COLORS.ground}
              path={`M ${colX(pinGndCol)} ${ROW_Y_LOWER[4]}
                     L ${colX(pinGndCol)} ${MINUS_RAIL_Y + 7}`}
              animated={buildStage === "all" && isOn}
            />
            {/* Verbindungsstrich (gestrichelt) vom Pin zum Wire-Anfang in Reihe j,
                damit der Schüler die elektrische Verbindung sieht. */}
            <line
              x1={colX(pinGndCol)}
              y1={pinGndY + 6}
              x2={colX(pinGndCol)}
              y2={ROW_Y_LOWER[4] - 4}
              stroke="#1d4ed8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity="0.5"
              pointerEvents="none"
            />
          </g>
        );
      })()}

      {/* BUILD-Stage-Spotlights */}
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
      {buildStage === 3 && pinGndCol >= 0 && (
        <g>
          <BuildSpotlight col={LED_CATHODE_COL} colLabel="29" subLabel="Kabel A — LED zur Minus-Schiene" />
          {/* Spotlight auf Reihe j (= freies Loch unter dem GND-Pin, NICHT
              das Pin-Loch selbst). Damit klar wird: Kabel in Reihe j stecken,
              nicht in den GND-Pin. */}
          <PinSpotlight
            col={pinGndCol}
            colLabel={String(pinGndCol + 1)}
            subLabel="Kabel B — Reihe j (unter GND-Pin) zur Minus-Schiene"
            row={ROW_Y_LOWER[4]}
          />
        </g>
      )}
    </BreadboardCanvas>
  );
}
