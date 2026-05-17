"use client";

import { cn } from "@/lib/utils";

/**
 * Premium-Schaltbild für die Blink-Lesson — handgefertigtes SVG im
 * Wokwi-/Fritzing-Look. Nur für `esp32-blink-led`. Sobald die Phase-A-
 * Engine (Fritzing-Library) steht, ersetzt sie diese Komponente
 * generisch — bis dahin ist das hier der Quality-Bar.
 */

interface BlinkSchematicProps {
  ledOn?: boolean;
  ledAnimation?: "blink" | "solid" | "off";
  /**
   * Aufbau-Stufe (Step-für-Step):
   * 0 = nur Breadboard + ESP32
   * 1 = + Widerstand
   * 2 = + LED
   * 3 = + Drähte (Signal + GND)
   * "all" = alles voll sichtbar mit LED-Animation
   */
  buildStage?: 0 | 1 | 2 | 3 | "all";
  /**
   * Erklär-Modi (für die EXPLAIN-Steps der Lesson):
   *   "boardOnly"          = nur das Brett, ohne ESP, ohne Schaltung
   *   "boardWithHighlight" = Brett + kurze-Spalten-Highlight + Reihen/Spalten-Annotationen
   *   "insertHint"         = ESP schwebt über Brett, Pfeile zeigen Steck-Richtung
   *   "build" (default)    = aktuelles BUILD/SIMULATE-Verhalten (mit ESP + Bauteile je buildStage)
   */
  mode?: "build" | "boardOnly" | "boardWithHighlight" | "insertHint";
  className?: string;
}

// Geometrie-Konstanten — alle in SVG-Units
const VB_W = 1100;
const VB_H = 620;

// Breadboard
const BB_X = 60;
const BB_Y = 140;
const BB_W = 980;
const BB_H = 360;
const BB_COLS = 30; // sichtbare Spalten — wir zeigen die linke Hälfte eines 60er-Boards
const BB_COL_DX = (BB_W - 80) / BB_COLS; // Spaltenabstand
const BB_COL_X0 = BB_X + 50; // x-Position der ersten Spaltenmitte
const colX = (c: number) => BB_COL_X0 + c * BB_COL_DX;

// Y-Positionen der 10 Reihen (a..e, Channel, f..j) + 2 Rails
const PLUS_RAIL_Y = BB_Y + 16;
const ROW_Y_UPPER = [200, 222, 244, 266, 288]; // a, b, c, d, e
const CHANNEL_TOP = 300;
const CHANNEL_BOTTOM = 340;
const ROW_Y_LOWER = [352, 374, 396, 418, 440]; // f, g, h, i, j
const MINUS_RAIL_Y = BB_Y + BB_H - 16;

// ESP32 — sitzt MIT Pin-Reihen auf row e + row f, body überspannt die Mittelrille
// Wir zeigen den 30-Pin-ESP32-DevKit, der real exakt diese Maße hat.
const ESP_FIRST_COL = 0; // Spalte 1
const ESP_LAST_COL = 14; // Spalte 15 (15 Pins pro Seite)
const ESP_BODY_X = colX(ESP_FIRST_COL) - 10;
const ESP_BODY_Y = ROW_Y_UPPER[4]! - 6;
const ESP_BODY_W = colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) + 20;
const ESP_BODY_H = ROW_Y_LOWER[0]! - ROW_Y_UPPER[4]! + 12;

// Pin-Positionen wie auf einem echten ESP32-DevKit-V1 (USB nach links).
// BOTTOM-Reihe (Brett Reihe e): 3V3(1), GND(2), D15(3), D2(4), D4(5), ...
// TOP-Reihe (Brett Reihe f): VIN(1), GND(2), D13(3), D12(4), D14(5), ...
const PIN_3V3_COL = 0; // Spalte 1, BOTTOM-Reihe (Brett Reihe e) — 3V3
const PIN_GPIO2_COL = 3; // Spalte 4, BOTTOM-Reihe — D2 = GPIO 2
const PIN_GND_COL = 1; // Spalte 2, TOP-Reihe (Brett Reihe f) — GND, kürzester Weg zur Minus-Schiene

const BOTTOM_PIN_LABELS = ["3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5", "D18", "D19", "D21", "RX0", "TX0", "D22", "D23"];
const TOP_PIN_LABELS = ["VIN", "GND", "D13", "D12", "D14", "D27", "D26", "D25", "D33", "D32", "D35", "D34", "VN", "VP", "EN"];

// Widerstand + LED — rechts vom ESP32 auf Reihe a/b
const RES_LEFT_COL = 17; // Spalte 18
const RES_RIGHT_COL = 20; // Spalte 21
const LED_ANODE_COL = 20; // Spalte 21 — selbe Spalte wie rechtes Widerstandsbein
const LED_CATHODE_COL = 21; // Spalte 22

export function BlinkSchematic({
  ledOn = false,
  ledAnimation = "off",
  buildStage = "all",
  mode = "build",
  className,
}: BlinkSchematicProps) {
  const stageNum = buildStage === "all" ? 99 : buildStage;
  // In den Erklär-Modi: keine Schaltung rendern, ESP je nach Modus aus oder an.
  const isBuildMode = mode === "build";
  const showResistor = isBuildMode && stageNum >= 1;
  const showLed = isBuildMode && stageNum >= 2;
  const showWires = isBuildMode && stageNum >= 3;
  const showEsp = mode !== "boardOnly" && mode !== "boardWithHighlight";
  const showInsertHint = mode === "insertHint";
  const showColumnHighlight = mode === "boardWithHighlight";
  // Im EXPLAIN-Modus möchten wir alle Spalten beschriftet sehen — sonst muss
  // der Anfänger im 5er-Raster zählen. Im BUILD-Modus reicht das 5er-Raster.
  const labelEveryColumn = !isBuildMode;
  // Im Insert-Hint Modus rendern wir den ESP nach OBEN verschoben + Pfeile.
  const espInsertOffset = showInsertHint ? -130 : 0;
  // Extra-Padding oben für den schwebenden ESP im Insert-Hint
  const extraTopPad = showInsertHint ? 160 : 0;
  const isOn = (ledOn || buildStage === "all") && ledAnimation !== "off" && isBuildMode;

  return (
    <div className={cn("relative mx-auto w-full max-w-4xl", className)}>
      <svg
        viewBox={`0 ${-extraTopPad} ${VB_W} ${VB_H + extraTopPad}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="Blink-Schaltung — ESP32 mit LED + 220Ω Widerstand auf Breadboard"
      >
        <defs>
          {/* Schatten unter Bauteilen */}
          <filter id="bb-shadow" x="-2%" y="-2%" width="104%" height="110%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <filter id="cmp-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.35" />
          </filter>
          {/* LED-Glow */}
          <radialGradient id="led-glow">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity={isOn ? 0.95 : 0} />
            <stop offset="40%" stopColor="#ef4444" stopOpacity={isOn ? 0.5 : 0} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </radialGradient>
          {/* LED-Dom */}
          <radialGradient id="led-dome" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="60%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          {/* Widerstand-Körper */}
          <linearGradient id="res-body" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d4a437" />
          </linearGradient>
          {/* Goldener Pin-Header */}
          <linearGradient id="pin-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          {/* ESP-WROOM-32-Modul (silbern mit Glanz) */}
          <linearGradient id="wroom-shield" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          {/* Animation: LED blinkt */}
          {ledAnimation === "blink" && (
            <style>{`
              .led-on { animation: led-pulse 1s infinite; transform-origin: center; }
              @keyframes led-pulse {
                0%, 49% { opacity: 1; }
                50%, 100% { opacity: 0.15; }
              }
              .glow-on { animation: glow-pulse 1s infinite; }
              @keyframes glow-pulse {
                0%, 49% { opacity: 1; }
                50%, 100% { opacity: 0; }
              }
              .current-flow {
                stroke-dasharray: 8 6;
                animation: current 1.4s linear infinite;
              }
              @keyframes current {
                from { stroke-dashoffset: 0; }
                to   { stroke-dashoffset: -28; }
              }
            `}</style>
          )}
        </defs>

        {/* ====================================================================
            BREADBOARD MB-102 (830 contacts) — weißes ABS wie echte Boards
            ==================================================================== */}
        <g filter="url(#bb-shadow)">
          <rect
            x={BB_X}
            y={BB_Y}
            width={BB_W}
            height={BB_H}
            rx="6"
            fill="#fafafa"
            stroke="#cbd5e1"
            strokeWidth="1.4"
          />
          {/* Subtile Strukturlinien für Plastik-Optik */}
          <rect x={BB_X + 2} y={BB_Y + 2} width={BB_W - 4} height={BB_H - 4} rx="5" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.7" />
        </g>

        {/* Plus-Schiene oben (rot) */}
        <g>
          <rect x={BB_X + 10} y={PLUS_RAIL_Y - 4} width={BB_W - 20} height="22" rx="2" fill="#fffaf0" />
          <line x1={BB_X + 10} y1={PLUS_RAIL_Y + 7} x2={BB_X + BB_W - 10} y2={PLUS_RAIL_Y + 7} stroke="#dc2626" strokeWidth="2" />
          <text x={BB_X + 18} y={PLUS_RAIL_Y + 12} textAnchor="start" fontSize="14" fontWeight="900" fill="#dc2626">+</text>
          <text x={BB_X + BB_W - 18} y={PLUS_RAIL_Y + 12} textAnchor="end" fontSize="14" fontWeight="900" fill="#dc2626">+</text>
          {/* Plus-Schiene-Löcher */}
          {Array.from({ length: BB_COLS }).map((_, c) => (
            <circle key={`pls-${c}`} cx={colX(c)} cy={PLUS_RAIL_Y + 7} r="2.8" fill="#1f2937" opacity="0.45" />
          ))}
        </g>

        {/* Minus-Schiene unten (blau) */}
        <g>
          <rect x={BB_X + 10} y={MINUS_RAIL_Y - 4} width={BB_W - 20} height="22" rx="2" fill="#f0f9ff" />
          <line x1={BB_X + 10} y1={MINUS_RAIL_Y + 7} x2={BB_X + BB_W - 10} y2={MINUS_RAIL_Y + 7} stroke="#2563eb" strokeWidth="2" />
          <text x={BB_X + 18} y={MINUS_RAIL_Y + 12} textAnchor="start" fontSize="14" fontWeight="900" fill="#2563eb">−</text>
          <text x={BB_X + BB_W - 18} y={MINUS_RAIL_Y + 12} textAnchor="end" fontSize="14" fontWeight="900" fill="#2563eb">−</text>
          {/* Minus-Schiene-Löcher */}
          {Array.from({ length: BB_COLS }).map((_, c) => (
            <circle key={`mns-${c}`} cx={colX(c)} cy={MINUS_RAIL_Y + 7} r="2.8" fill="#1f2937" opacity="0.45" />
          ))}
        </g>

        {/* Mittelrille (Trennkanal) */}
        <rect x={BB_X + 4} y={CHANNEL_TOP} width={BB_W - 8} height={CHANNEL_BOTTOM - CHANNEL_TOP} fill="#fef9c3" stroke="#e7d36c" strokeWidth="0.5" />

        {/* Spaltennummern oben — im EXPLAIN-Modus jede Spalte, im BUILD-Modus
            nur 5er-Schritte (sonst zu eng zwischen Bauteilen). */}
        {Array.from({ length: BB_COLS }).map((_, c) => {
          const label = c + 1;
          const show = labelEveryColumn || label === 1 || label % 5 === 0;
          if (!show) return null;
          return (
            <text
              key={`cn-${c}`}
              x={colX(c)}
              y={BB_Y + 60}
              textAnchor="middle"
              fontSize={labelEveryColumn ? "9" : "10"}
              fontWeight="700"
              fill="#a16207"
              fontFamily="ui-monospace,monospace"
            >
              {label}
            </text>
          );
        })}

        {/* Reihen-Buchstaben links + rechts */}
        {["a", "b", "c", "d", "e"].map((r, i) => (
          <g key={`ru-${r}`}>
            <text x={BB_X + 24} y={ROW_Y_UPPER[i]! + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
            <text x={BB_X + BB_W - 24} y={ROW_Y_UPPER[i]! + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
          </g>
        ))}
        {["f", "g", "h", "i", "j"].map((r, i) => (
          <g key={`rd-${r}`}>
            <text x={BB_X + 24} y={ROW_Y_LOWER[i]! + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
            <text x={BB_X + BB_W - 24} y={ROW_Y_LOWER[i]! + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
          </g>
        ))}

        {/* Loch-Raster für alle Reihen */}
        {Array.from({ length: BB_COLS }).map((_, c) => (
          <g key={`grid-${c}`}>
            {ROW_Y_UPPER.map((y, ri) => (
              <circle key={`u-${c}-${ri}`} cx={colX(c)} cy={y} r="3.2" fill="#1f2937" opacity="0.55" />
            ))}
            {ROW_Y_LOWER.map((y, ri) => (
              <circle key={`d-${c}-${ri}`} cx={colX(c)} cy={y} r="3.2" fill="#1f2937" opacity="0.55" />
            ))}
          </g>
        ))}

        {/* ====================================================================
            ESP32 DevKit V1 — sitzt IM Breadboard, überspannt die Mittelrille.
            Im boardOnly/boardWithHighlight-Mode komplett ausgeblendet.
            Im insertHint-Mode nach oben versetzt + halbtransparent (schwebt).
            ==================================================================== */}
        {showEsp && (
        <>
        <g transform={`translate(0, ${espInsertOffset})`} opacity={showInsertHint ? 0.92 : 1}>
        <g filter="url(#cmp-shadow)">
          {/* PCB-Korpus (dunkelgrünlich-schwarz wie echte Platinen) */}
          <rect
            x={ESP_BODY_X}
            y={ESP_BODY_Y}
            width={ESP_BODY_W}
            height={ESP_BODY_H}
            rx="6"
            fill="#0a1422"
            stroke="#1f2937"
            strokeWidth="1.2"
          />
          {/* Subtile Silkscreen-Andeutung am Rand */}
          <rect
            x={ESP_BODY_X + 4}
            y={ESP_BODY_Y + 4}
            width={ESP_BODY_W - 8}
            height={ESP_BODY_H - 8}
            rx="4"
            fill="none"
            stroke="#475569"
            strokeWidth="0.4"
            opacity="0.6"
          />

          {/* Befestigungslöcher (4 Ecken) */}
          <circle cx={ESP_BODY_X + 8} cy={ESP_BODY_Y + 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
          <circle cx={ESP_BODY_X + ESP_BODY_W - 8} cy={ESP_BODY_Y + 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
          <circle cx={ESP_BODY_X + 8} cy={ESP_BODY_Y + ESP_BODY_H - 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
          <circle cx={ESP_BODY_X + ESP_BODY_W - 8} cy={ESP_BODY_Y + ESP_BODY_H - 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
        </g>

        {/* ESP-WROOM-32 Modul — RECHTS auf dem PCB (so wie auf echten DevKit V1).
            Linke Hälfte der Platine ist Platz für USB, EN, BOOT, AMS1117, CP2102. */}
        {(() => {
          const wroomX = colX(6) - 4;
          // 12px Padding oben/unten lässt 4px Luft zu Pin-Header (vorher 8px → 2px Überlapp).
          const wroomY = ESP_BODY_Y + 12;
          const wroomW = colX(14) - colX(6) + 12;
          const wroomH = ESP_BODY_H - 28;
          return (
            <g filter="url(#cmp-shadow)">
              <rect
                x={wroomX}
                y={wroomY}
                width={wroomW}
                height={wroomH}
                rx="2"
                fill="url(#wroom-shield)"
                stroke="#475569"
                strokeWidth="0.8"
              />
              {/* Antennen-Mäander rechts oben (PCB-Antenne wie auf echtem WROOM) */}
              <path
                d={`M ${wroomX + wroomW - 26} ${wroomY + 5}
                    L ${wroomX + wroomW - 6} ${wroomY + 5}
                    L ${wroomX + wroomW - 6} ${wroomY + 10}
                    L ${wroomX + wroomW - 26} ${wroomY + 10}
                    L ${wroomX + wroomW - 26} ${wroomY + 15}
                    L ${wroomX + wroomW - 6} ${wroomY + 15}`}
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.2"
                strokeLinejoin="miter"
              />
              {/* Aufdruck */}
              <text
                x={wroomX + (wroomW - 30) / 2}
                y={wroomY + wroomH / 2 - 2}
                textAnchor="middle"
                fontSize="11"
                fontWeight="900"
                fill="#0f172a"
                fontFamily="ui-monospace,monospace"
                letterSpacing="0.6"
              >
                ESP-WROOM-32
              </text>
              <text
                x={wroomX + (wroomW - 30) / 2}
                y={wroomY + wroomH / 2 + 12}
                textAnchor="middle"
                fontSize="6"
                fontWeight="600"
                fill="#475569"
                fontFamily="ui-monospace,monospace"
              >
                CE · FCC · DevKit V1
              </text>
            </g>
          );
        })()}

        {/* USB-Mikro-Port (am linken Schmalende des ESP32 — außerhalb des PCB) */}
        <g filter="url(#cmp-shadow)">
          <rect
            x={ESP_BODY_X - 18}
            y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 - 14}
            width="22"
            height="28"
            rx="3"
            fill="#94a3b8"
            stroke="#475569"
            strokeWidth="1"
          />
          <rect
            x={ESP_BODY_X - 14}
            y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 - 10}
            width="14"
            height="20"
            rx="1.5"
            fill="#1e293b"
          />
        </g>

        {/* EN-Button (oben links) und BOOT-Button (unten links) — wie auf echtem DevKit */}
        <g>
          <rect x={ESP_BODY_X + 6} y={ESP_BODY_Y + 6} width="14" height="14" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="0.6" filter="url(#cmp-shadow)" />
          <circle cx={ESP_BODY_X + 13} cy={ESP_BODY_Y + 13} r="3.5" fill="#0f172a" />
          <text x={ESP_BODY_X + 13} y={ESP_BODY_Y + 30} textAnchor="middle" fontSize="6" fontWeight="800" fill="#cbd5e1" fontFamily="ui-monospace,monospace">EN</text>

          <rect x={ESP_BODY_X + 6} y={ESP_BODY_Y + ESP_BODY_H - 20} width="14" height="14" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="0.6" filter="url(#cmp-shadow)" />
          <circle cx={ESP_BODY_X + 13} cy={ESP_BODY_Y + ESP_BODY_H - 13} r="3.5" fill="#0f172a" />
          <text x={ESP_BODY_X + 13} y={ESP_BODY_Y + ESP_BODY_H - 24} textAnchor="middle" fontSize="6" fontWeight="800" fill="#cbd5e1" fontFamily="ui-monospace,monospace">BOOT</text>
        </g>

        {/* AMS1117 Spannungsregler (oben Mitte-links) — kleines Rechteck mit oranger Tab */}
        <g>
          <rect x={ESP_BODY_X + 26} y={ESP_BODY_Y + 8} width="22" height="11" rx="0.8" fill="#0f172a" stroke="#475569" strokeWidth="0.4" />
          <rect x={ESP_BODY_X + 26} y={ESP_BODY_Y + 8} width="22" height="3" fill="#ea580c" opacity="0.9" />
          <text x={ESP_BODY_X + 37} y={ESP_BODY_Y + 16} textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">AMS1117</text>
        </g>

        {/* CP2102 USB-Serial-IC (unten Mitte-links) — kleines schwarzes Quadrat */}
        <g>
          <rect x={ESP_BODY_X + 26} y={ESP_BODY_Y + ESP_BODY_H - 19} width="16" height="11" rx="0.8" fill="#0a0f19" stroke="#475569" strokeWidth="0.4" />
          <text x={ESP_BODY_X + 34} y={ESP_BODY_Y + ESP_BODY_H - 12} textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">CP2102</text>
        </g>

        {/* Goldene Pin-Header — links (Reihe e) und rechts (Reihe f), 15 Pins je Seite.
            Aktive Pins (GPIO 2 + GND) sind farbig umrandet, damit der Schüler sie
            sofort findet ohne Beschriftungssalat. */}
        {Array.from({ length: 15 }).map((_, i) => {
          const isGpio2 = i === PIN_GPIO2_COL;
          const isGnd = i === PIN_GND_COL;
          const isV3 = i === PIN_3V3_COL;
          const pinW = 9;
          const pinH = 11;
          return (
            <g key={`pin-${i}`}>
              {/* Oberer Pin (Reihe e) */}
              <rect
                x={colX(i) - pinW / 2}
                y={ROW_Y_UPPER[4]! - 5}
                width={pinW}
                height={pinH}
                rx="1.2"
                fill="url(#pin-gold)"
                stroke={isGpio2 ? "#15803d" : isV3 ? "#b91c1c" : "#92400e"}
                strokeWidth={isGpio2 || isV3 ? "1.6" : "0.6"}
              />
              {/* Unterer Pin (Reihe f) */}
              <rect
                x={colX(i) - pinW / 2}
                y={ROW_Y_LOWER[0]! - 6}
                width={pinW}
                height={pinH}
                rx="1.2"
                fill="url(#pin-gold)"
                stroke={isGnd ? "#1d4ed8" : "#92400e"}
                strokeWidth={isGnd ? "1.6" : "0.6"}
              />
            </g>
          );
        })}

        {/* Silkscreen-Pin-Labels — exakt wie auf echten DevKit-V1-Boards aufgedruckt.
            BOTTOM-Reihe steht auf Brett-Reihe e (oben), TOP-Reihe auf Reihe f (unten).
            Nur Pins links vom ESP-WROOM-Modul werden beschriftet (Spalten 1-6); die
            anderen sind durch das Modul verdeckt. Wichtige Lesson-Pins farbig. */}
        <g fontFamily="ui-monospace,monospace" fontWeight="700">
          {BOTTOM_PIN_LABELS.slice(0, 6).map((label, i) => {
            const isActive = i === PIN_3V3_COL || i === PIN_GPIO2_COL;
            const color = i === PIN_3V3_COL ? "#fca5a5" : i === PIN_GPIO2_COL ? "#86efac" : "#cbd5e1";
            return (
              <text
                key={`bp-label-${i}`}
                x={colX(i)}
                y={ROW_Y_UPPER[4]! - 6}
                textAnchor="middle"
                fontSize={isActive ? "6.5" : "5.5"}
                fill={color}
              >
                {label}
              </text>
            );
          })}
          {TOP_PIN_LABELS.slice(0, 6).map((label, i) => {
            const isActive = i === PIN_GND_COL;
            const color = isActive ? "#93c5fd" : "#cbd5e1";
            return (
              <text
                key={`tp-label-${i}`}
                x={colX(i)}
                y={ROW_Y_LOWER[0]! + 11}
                textAnchor="middle"
                fontSize={isActive ? "6.5" : "5.5"}
                fill={color}
              >
                {label}
              </text>
            );
          })}
        </g>
        </g>

        {/* Floating Callouts für die genutzten Pins — außerhalb des Bretts, mit
            gestrichelter Hilfslinie zum tatsächlichen Pin. So liegen die Labels
            NIE in den Brett-Reihen und der Schüler kann den Pin sofort finden.
            NICHT mit dem ESP-Transform mitbewegen (im Insert-Hint zeigen sie
            sonst nicht mehr auf das Brett) — und im Insert-Hint ganz weglassen,
            weil dort der Steck-Vorgang im Fokus ist, nicht die Pin-Namen. */}
        {!showInsertHint && (
        <g>
          {/* GPIO 2 Callout — oberhalb des Bretts, Pfeil tippt nur den Brett-Rand an */}
          <line
            x1={colX(PIN_GPIO2_COL)}
            y1={BB_Y - 4}
            x2={colX(PIN_GPIO2_COL)}
            y2={BB_Y - 14}
            stroke="#15803d"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <polygon
            points={`${colX(PIN_GPIO2_COL) - 4},${BB_Y - 14} ${colX(PIN_GPIO2_COL) + 4},${BB_Y - 14} ${colX(PIN_GPIO2_COL)},${BB_Y - 4}`}
            fill="#15803d"
          />
          <g filter="url(#cmp-shadow)">
            <rect
              x={colX(PIN_GPIO2_COL) - 38}
              y={BB_Y - 58}
              width="76"
              height="42"
              rx="8"
              fill="#f0fdf4"
              stroke="#15803d"
              strokeWidth="1.4"
            />
          </g>
          <text x={colX(PIN_GPIO2_COL)} y={BB_Y - 40} textAnchor="middle" fontSize="13" fontWeight="900" fill="#15803d" fontFamily="ui-monospace,monospace">GPIO 2</text>
          <text x={colX(PIN_GPIO2_COL)} y={BB_Y - 26} textAnchor="middle" fontSize="8" fontWeight="600" fill="#16a34a">Signal-Pin</text>

          {/* GND Callout — unterhalb des Bretts, Pfeil tippt den unteren Rand an */}
          <line
            x1={colX(PIN_GND_COL)}
            y1={BB_Y + BB_H + 4}
            x2={colX(PIN_GND_COL)}
            y2={BB_Y + BB_H + 14}
            stroke="#1d4ed8"
            strokeWidth="1.4"
            strokeDasharray="3 3"
          />
          <polygon
            points={`${colX(PIN_GND_COL) - 4},${BB_Y + BB_H + 14} ${colX(PIN_GND_COL) + 4},${BB_Y + BB_H + 14} ${colX(PIN_GND_COL)},${BB_Y + BB_H + 4}`}
            fill="#1d4ed8"
          />
          <g filter="url(#cmp-shadow)">
            <rect
              x={colX(PIN_GND_COL) - 38}
              y={BB_Y + BB_H + 16}
              width="76"
              height="42"
              rx="8"
              fill="#eff6ff"
              stroke="#1d4ed8"
              strokeWidth="1.4"
            />
          </g>
          <text x={colX(PIN_GND_COL)} y={BB_Y + BB_H + 36} textAnchor="middle" fontSize="13" fontWeight="900" fill="#1d4ed8" fontFamily="ui-monospace,monospace">GND</text>
          <text x={colX(PIN_GND_COL)} y={BB_Y + BB_H + 50} textAnchor="middle" fontSize="8" fontWeight="600" fill="#2563eb">Masse / Minus</text>
        </g>
        )}
        </>
        )}

        {/* Insert-Hint-Pfeile — drei dicke Pfeile zwischen ESP (schwebend) und
            Brett, plus Banner. Nur wenn mode=insertHint. */}
        {showInsertHint && (
          <g>
            {[3, 7, 11].map((col) => (
              <g key={`insert-arrow-${col}`}>
                <line
                  x1={colX(col)}
                  y1={BB_Y - 30}
                  x2={colX(col)}
                  y2={ROW_Y_LOWER[0]! - 6}
                  stroke="#0ea5e9"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 5"
                >
                  <animate attributeName="stroke-dashoffset" values="0;-26" dur="0.9s" repeatCount="indefinite" />
                </line>
                <polygon
                  points={`${colX(col) - 8},${ROW_Y_LOWER[0]! - 6} ${colX(col) + 8},${ROW_Y_LOWER[0]! - 6} ${colX(col)},${ROW_Y_LOWER[0]! + 8}`}
                  fill="#0ea5e9"
                />
              </g>
            ))}
            <rect x={BB_X + BB_W / 2 - 160} y={BB_Y - 56} width="320" height="24" rx="12" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.4" />
            <text x={BB_X + BB_W / 2} y={BB_Y - 40} textAnchor="middle" fontSize="12" fontWeight="800" fill="#075985" fontFamily="ui-monospace,monospace">
              Mittig drücken — beide Pin-Reihen rein
            </text>
          </g>
        )}

        {/* Kurze-Spalten-Highlight — markiert eine Spalte (a–e) damit der
            Schüler sieht: alle 5 Löcher dieser Spalte sind elektrisch eins. */}
        {showColumnHighlight && (
          <g>
            <rect
              x={colX(8) - 12}
              y={ROW_Y_UPPER[0]! - 10}
              width="24"
              height={ROW_Y_UPPER[4]! - ROW_Y_UPPER[0]! + 20}
              rx="6"
              fill="#fde68a"
              fillOpacity="0.55"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="5 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
            </rect>
            {/* Hinweis-Pille zur Erklärung */}
            <rect x={colX(8) - 80} y={ROW_Y_UPPER[0]! - 40} width="160" height="22" rx="11" fill="#fef3c7" stroke="#d97706" strokeWidth="1.4" />
            <text x={colX(8)} y={ROW_Y_UPPER[0]! - 25} textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e" fontFamily="ui-monospace,monospace">
              5 Löcher = elektrisch EINS
            </text>
            <line x1={colX(8)} y1={ROW_Y_UPPER[0]! - 18} x2={colX(8)} y2={ROW_Y_UPPER[0]! - 12} stroke="#d97706" strokeWidth="1.4" />
          </g>
        )}

        {/* ====================================================================
            220Ω WIDERSTAND — Reihe a, Spalte 18 → Spalte 21
            ==================================================================== */}
        {showResistor && (
          <g filter="url(#cmp-shadow)" opacity={showResistor ? 1 : 0.2}>
            {/* Beinchen (Drähte) — beide enden in Loch row-a */}
            <line x1={colX(RES_LEFT_COL)} y1={ROW_Y_UPPER[0]!} x2={colX(RES_LEFT_COL) + 6} y2={ROW_Y_UPPER[0]! - 14} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1={colX(RES_RIGHT_COL)} y1={ROW_Y_UPPER[0]!} x2={colX(RES_RIGHT_COL) - 6} y2={ROW_Y_UPPER[0]! - 14} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            {/* Stecker-Kontaktpunkte (Lötaugen) */}
            <circle cx={colX(RES_LEFT_COL)} cy={ROW_Y_UPPER[0]!} r="3" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
            <circle cx={colX(RES_RIGHT_COL)} cy={ROW_Y_UPPER[0]!} r="3" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
            {/* Widerstandskörper — oval, beige mit Farbringen */}
            {(() => {
              const cx = (colX(RES_LEFT_COL) + colX(RES_RIGHT_COL)) / 2;
              const cy = ROW_Y_UPPER[0]! - 18;
              const bodyW = (colX(RES_RIGHT_COL) - colX(RES_LEFT_COL)) * 0.75;
              const bodyH = 24;
              const bodyX = cx - bodyW / 2;
              const bodyY = cy - bodyH / 2;
              const ringW = 5;
              return (
                <>
                  {/* Drahtstummel innen */}
                  <line x1={colX(RES_LEFT_COL) + 6} y1={cy} x2={bodyX} y2={cy} stroke="#cbd5e1" strokeWidth="2" />
                  <line x1={bodyX + bodyW} y1={cy} x2={colX(RES_RIGHT_COL) - 6} y2={cy} stroke="#cbd5e1" strokeWidth="2" />
                  {/* Körper */}
                  <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={bodyH / 2} fill="url(#res-body)" stroke="#92400e" strokeWidth="0.6" />
                  {/* 4 Farbringe für 220Ω 5%: rot-rot-braun-gold */}
                  <rect x={bodyX + bodyW * 0.18} y={bodyY} width={ringW} height={bodyH} fill="#dc2626" />
                  <rect x={bodyX + bodyW * 0.34} y={bodyY} width={ringW} height={bodyH} fill="#dc2626" />
                  <rect x={bodyX + bodyW * 0.50} y={bodyY} width={ringW} height={bodyH} fill="#7c2d12" />
                  <rect x={bodyX + bodyW * 0.78} y={bodyY} width={ringW} height={bodyH} fill="#eab308" />
                  {/* Label */}
                  <text x={cx} y={bodyY - 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#7c2d12" fontFamily="ui-monospace,monospace">
                    220 Ω
                  </text>
                </>
              );
            })()}
          </g>
        )}

        {/* ====================================================================
            LED 5mm rot — Anode Reihe a Spalte 21, Kathode Reihe a Spalte 22
            ==================================================================== */}
        {showLed && (
          <g filter="url(#cmp-shadow)">
            {/* Glow-Halo (nur wenn an) */}
            {isOn && (
              <circle
                cx={(colX(LED_ANODE_COL) + colX(LED_CATHODE_COL)) / 2}
                cy={ROW_Y_UPPER[0]! - 36}
                r="48"
                fill="url(#led-glow)"
                className={ledAnimation === "blink" ? "glow-on" : undefined}
              />
            )}
            {/* Beinchen (Anode lang, Kathode kurz) */}
            <line x1={colX(LED_ANODE_COL)} y1={ROW_Y_UPPER[0]!} x2={colX(LED_ANODE_COL)} y2={ROW_Y_UPPER[0]! - 28} stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
            <line x1={colX(LED_CATHODE_COL)} y1={ROW_Y_UPPER[0]!} x2={colX(LED_CATHODE_COL)} y2={ROW_Y_UPPER[0]! - 22} stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx={colX(LED_ANODE_COL)} cy={ROW_Y_UPPER[0]!} r="3.4" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
            <circle cx={colX(LED_CATHODE_COL)} cy={ROW_Y_UPPER[0]!} r="3.4" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
            {/* LED-Dom */}
            {(() => {
              const cx = (colX(LED_ANODE_COL) + colX(LED_CATHODE_COL)) / 2;
              const cy = ROW_Y_UPPER[0]! - 36;
              return (
                <>
                  {/* Basis-Flansch (schwarzes Plastik unten an der LED) */}
                  <ellipse cx={cx} cy={cy + 12} rx="20" ry="5" fill="#1f2937" />
                  {/* Halbkugel */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="18"
                    fill={isOn ? "url(#led-dome)" : "#fecaca"}
                    stroke="#7f1d1d"
                    strokeWidth="1.4"
                    className={isOn && ledAnimation === "blink" ? "led-on" : undefined}
                  />
                  {/* Reflexion (Highlight) */}
                  <ellipse cx={cx - 6} cy={cy - 7} rx="4" ry="6.5" fill="#fee2e2" opacity={isOn ? 0.85 : 0.55} />
                  {/* Kathode-Marker (kleines „−") */}
                  <text x={colX(LED_CATHODE_COL) + 10} y={ROW_Y_UPPER[0]! - 40} textAnchor="start" fontSize="11" fontWeight="900" fill="#7f1d1d">−</text>
                  <text x={colX(LED_ANODE_COL) - 10} y={ROW_Y_UPPER[0]! - 40} textAnchor="end" fontSize="11" fontWeight="900" fill="#15803d">+</text>
                  <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7f1d1d" fontFamily="ui-monospace,monospace">LED</text>
                </>
              );
            })()}
          </g>
        )}

        {/* ====================================================================
            DRÄHTE — alle 3 sind M2M-Jumper, mit kleinen Stecker-Endkappen
            ==================================================================== */}
        {showWires && (
          <g>
            {/* Grünes Signal-Kabel: GPIO 2 (Spalte 4, Reihe a) → Widerstand-links (Spalte 18, Reihe a)
                Erst nach oben, dann über mehrere Spalten hinweg, dann runter */}
            <Wire
              color="#22c55e"
              darkColor="#15803d"
              path={`M ${colX(PIN_GPIO2_COL)} ${ROW_Y_UPPER[0]!}
                     L ${colX(PIN_GPIO2_COL)} ${ROW_Y_UPPER[0]! - 50}
                     L ${colX(RES_LEFT_COL)} ${ROW_Y_UPPER[0]! - 50}
                     L ${colX(RES_LEFT_COL)} ${ROW_Y_UPPER[0]!}`}
              animated={buildStage === "all" && isOn}
            />
            {/* Blaues Kabel A: LED-Kathode (Spalte 22, Reihe a) → senkrecht
                runter zur Minus-Schiene Spalte 22. So sieht der Schüler die
                Verbindung direkt — keine verwirrenden Bögen. */}
            <Wire
              color="#3b82f6"
              darkColor="#1d4ed8"
              path={`M ${colX(LED_CATHODE_COL)} ${ROW_Y_UPPER[0]!} L ${colX(LED_CATHODE_COL)} ${MINUS_RAIL_Y + 7}`}
              animated={buildStage === "all" && isOn}
            />
            {/* Blaues Kabel B: GND-Pin Spalte 14 (untere Hälfte Reihe j) → Minus-Schiene */}
            <Wire
              color="#3b82f6"
              darkColor="#1d4ed8"
              path={`M ${colX(PIN_GND_COL)} ${ROW_Y_LOWER[4]!}
                     L ${colX(PIN_GND_COL)} ${MINUS_RAIL_Y + 7}`}
              animated={buildStage === "all" && isOn}
            />
          </g>
        )}

        {/* BUILD-Stage-Highlights: pulsierender Kreis + Spalten-Label, damit
            der Schüler die Zielposition sofort findet (statt im 5er-Raster
            zu zählen). */}
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
            {/* Kabel A — LED-Kathode (Spalte 22) zur Minus-Schiene */}
            <BuildSpotlight col={LED_CATHODE_COL} colLabel="22" subLabel="Kabel A — LED zur Minus-Schiene" />
            {/* Kabel B — GND-Pin (Spalte 2, untere Pin-Reihe) zur Minus-Schiene */}
            <g>
              <line x1={colX(PIN_GND_COL)} y1={BB_Y - 4} x2={colX(PIN_GND_COL)} y2={ROW_Y_LOWER[4]! + 14} stroke="#d97706" strokeWidth="1.4" strokeDasharray="3 3" />
              <circle cx={colX(PIN_GND_COL)} cy={ROW_Y_LOWER[4]!} r="11" fill="#fbbf24" fillOpacity="0.55">
                <animate attributeName="r" values="9;15;9" dur="1.3s" repeatCount="indefinite" />
              </circle>
              <circle cx={colX(PIN_GND_COL)} cy={ROW_Y_LOWER[4]!} r="5" fill="#f59e0b" stroke="#92400e" strokeWidth="0.8" />
              <rect x={colX(PIN_GND_COL) - 36} y={BB_Y - 26} width="72" height="22" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.4" />
              <text x={colX(PIN_GND_COL)} y={BB_Y - 11} textAnchor="middle" fontSize="11" fontWeight="900" fill="#92400e" fontFamily="ui-monospace,monospace">
                Spalte 2
              </text>
              <rect x={colX(PIN_GND_COL) - 54} y={ROW_Y_LOWER[4]! + 18} width="108" height="16" rx="5" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
              <text x={colX(PIN_GND_COL)} y={ROW_Y_LOWER[4]! + 29} textAnchor="middle" fontSize="9" fontWeight="800" fill="#92400e" fontFamily="ui-monospace,monospace">
                Kabel B — GND zur Minus-Schiene
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

/**
 * BUILD-Step-Spotlight: pulsierender Highlight-Kreis am Ziel-Loch + eine
 * gut sichtbare „Spalte X"-Pille im Padding über dem Brett. Damit findet
 * der Schüler die Zielposition sofort und muss nicht im 5er-Raster zählen.
 */
function BuildSpotlight({
  col,
  colLabel,
  subLabel,
}: {
  col: number;
  colLabel: string;
  subLabel?: string;
}) {
  // Wir brauchen colX + ROW_Y_UPPER + BB_Y aus dem Modul-Scope.
  // (Die Funktion wird innerhalb von BlinkSchematic gerendert.)
  const cx = BB_COL_X0 + col * BB_COL_DX;
  const cy = ROW_Y_UPPER[0]!;
  return (
    <g>
      {/* Verbindungslinie von der Pille zum Highlight */}
      <line x1={cx} y1={BB_Y - 4} x2={cx} y2={cy - 14} stroke="#d97706" strokeWidth="1.4" strokeDasharray="3 3" />
      {/* Pulsierender gelber Highlight-Kreis am Loch */}
      <circle cx={cx} cy={cy} r="11" fill="#fbbf24" fillOpacity="0.55">
        <animate attributeName="r" values="9;15;9" dur="1.3s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="5" fill="#f59e0b" stroke="#92400e" strokeWidth="0.8" />
      {/* Spalten-Label-Pille im Padding oberhalb des Bretts */}
      <rect x={cx - 36} y={BB_Y - 26} width="72" height="22" rx="6" fill="#fef3c7" stroke="#d97706" strokeWidth="1.4" />
      <text x={cx} y={BB_Y - 11} textAnchor="middle" fontSize="11" fontWeight="900" fill="#92400e" fontFamily="ui-monospace,monospace">
        Spalte {colLabel}
      </text>
      {/* Optionaler Sub-Text (z.B. „+ langes Bein") */}
      {subLabel && (
        <g>
          <rect x={cx - 44} y={cy + 14} width="88" height="16" rx="5" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
          <text x={cx} y={cy + 25} textAnchor="middle" fontSize="9" fontWeight="800" fill="#92400e" fontFamily="ui-monospace,monospace">
            {subLabel}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Draht-Helper: rendert einen Schatten-Pfad + den eigentlichen farbigen Draht
 * + kleine schwarze Stecker-Endkappen, sodass es nach M2M-Jumper aussieht.
 */
function Wire({
  color,
  darkColor,
  path,
  animated,
}: {
  color: string;
  darkColor: string;
  path: string;
  animated?: boolean;
}) {
  return (
    <g>
      {/* Schatten unter dem Draht */}
      <path d={path} fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" transform="translate(0, 1.5)" />
      {/* Dunkler Rand des Drahts */}
      <path d={path} fill="none" stroke={darkColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Heller Kernstrich */}
      <path d={path} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Animierter „Strom" entlang des Drahts */}
      {animated && (
        <path d={path} fill="none" stroke="#fff7d6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" className="current-flow" />
      )}
    </g>
  );
}
