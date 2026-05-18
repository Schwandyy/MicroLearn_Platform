"use client";

import { cn } from "@/lib/utils";
import {
  ActivePin,
  BB_COLS,
  BB_H,
  BB_W,
  BB_X,
  BB_Y,
  CHANNEL_BOTTOM,
  CHANNEL_TOP,
  ESP_BODY_H,
  ESP_BODY_W,
  ESP_BODY_X,
  ESP_BODY_Y,
  ESP_FIRST_COL,
  ESP_LAST_COL,
  ESP_PIN_COUNT,
  MINUS_RAIL_Y,
  PIN_NORTH_LABELS,
  PIN_SOUTH_LABELS,
  PLUS_RAIL_Y,
  ROW_Y_LOWER,
  ROW_Y_UPPER,
  TONE_COLORS,
  VB_H,
  VB_W,
  colX,
} from "./geometry";

/**
 * BreadboardCanvas — Standard-Schaltbild-Renderer:
 *   • Echtes 830-Pin-Breadboard (MB-102): 60 Spalten × 10 Reihen + 2 Rails
 *   • Echtes 38-Pin ESP32 NodeMCU DevKit V1 (AZ-Delivery): 19 Pins/Seite,
 *     Pin-Header sitzen MIT Brett-Reihe a (north) und Brett-Reihe i (south).
 *     PCB-Körper überspannt Reihen a-i (= fast die ganze Brett-Breite).
 *
 * Render-Reihenfolge (z-order):
 *   1. Breadboard-Korpus (Schienen, Kanal, Löcher, Reihen/Spalten-Labels)
 *   2. ESP32 komplett (PCB + WROOM + USB + Buttons + ICs + Pin-Header + Silkscreen)
 *   3. Floating Pin-Callouts (außerhalb des Bretts)
 *   4. Mode-Overlays: Insert-Hint-Arrows + Column-Highlight
 *   5. children — Lesson-spezifische Bauteile/Wires/Spotlights (z-top, sodass
 *      Drähte sauber über Pin-Header laufen)
 */
export interface BreadboardCanvasProps {
  /**
   *   "build"              = Normal-BUILD-/SIMULATE-Modus, ESP voll sichtbar
   *   "boardOnly"          = nur Brett, kein ESP — für „Was ist ein Breadboard?"
   *   "boardWithHighlight" = Brett + Beispiel-Spalten-Highlight (5 Löcher = eins)
   *   "insertHint"         = ESP schwebt über Brett, Pfeile zeigen Steck-Richtung
   */
  mode?: "build" | "boardOnly" | "boardWithHighlight" | "insertHint";
  activePins?: ActivePin[];
  /** Spalte für boardWithHighlight (Default 8). */
  highlightCol?: number;
  /** Spalten in der Insert-Hint-Animation. Default sind drei Pins quer übers ESP. */
  insertHintCols?: number[];
  children?: React.ReactNode;
  extraDefs?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function BreadboardCanvas({
  mode = "build",
  activePins = [],
  highlightCol = 8,
  insertHintCols = [3, 9, 15],
  children,
  extraDefs,
  ariaLabel = "ESP32-Brett-Schaltbild",
  className,
}: BreadboardCanvasProps) {
  const isBuildMode = mode === "build";
  const showEsp = mode !== "boardOnly" && mode !== "boardWithHighlight";
  const showInsertHint = mode === "insertHint";
  const showColumnHighlight = mode === "boardWithHighlight";
  // Im insertHint-Mode schwebt der ESP komplett OBERHALB des Bretts (Offset
  // so groß, dass ESP-Body-Bottom etwa 20 SVG-Units über Brett-Top liegt).
  // ESP-Body geht von ESP_BODY_Y=192 bis ESP_BODY_Y+ESP_BODY_H=426; mit
  // offset -310 liegt das visible Body von y=-118 bis y=116 — über Brett.
  const espInsertOffset = showInsertHint ? -310 : 0;
  const extraTopPad = showInsertHint ? 260 : 0;

  // Pin-Coloring je Seite
  const northActive = new Map<number, ActivePin>();
  const southActive = new Map<number, ActivePin>();
  for (const p of activePins) {
    if (p.side === "north") northActive.set(p.col, p);
    else southActive.set(p.col, p);
  }

  return (
    <div className={cn("relative mx-auto w-full max-w-6xl", className)}>
      <svg
        viewBox={`0 ${-extraTopPad} ${VB_W} ${VB_H + extraTopPad}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <filter id="bb-shadow" x="-2%" y="-2%" width="104%" height="110%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <filter id="cmp-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodOpacity="0.35" />
          </filter>
          <linearGradient id="pin-gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          <linearGradient id="wroom-shield" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <style>{`
            .current-flow {
              stroke-dasharray: 8 6;
              animation: current 1.4s linear infinite;
            }
            @keyframes current {
              from { stroke-dashoffset: 0; }
              to   { stroke-dashoffset: -28; }
            }
          `}</style>
          {extraDefs}
        </defs>

        {/* === BREADBOARD MB-102 === */}
        <g filter="url(#bb-shadow)">
          <rect x={BB_X} y={BB_Y} width={BB_W} height={BB_H} rx="6" fill="#fafafa" stroke="#cbd5e1" strokeWidth="1.4" />
          <rect x={BB_X + 2} y={BB_Y + 2} width={BB_W - 4} height={BB_H - 4} rx="5" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.7" />
        </g>

        {/* Plus-Schiene — zwei Loch-Reihen + rote Linie zwischen ihnen
            (wie auf echtem MB-102: pro Schiene 2 parallele Loch-Reihen) */}
        <g>
          <rect x={BB_X + 10} y={PLUS_RAIL_Y - 12} width={BB_W - 20} height="28" rx="2" fill="#fffaf0" />
          <line x1={BB_X + 10} y1={PLUS_RAIL_Y} x2={BB_X + BB_W - 10} y2={PLUS_RAIL_Y} stroke="#dc2626" strokeWidth="2" />
          <text x={BB_X + 18} y={PLUS_RAIL_Y + 4} textAnchor="start" fontSize="14" fontWeight="900" fill="#dc2626">+</text>
          <text x={BB_X + BB_W - 18} y={PLUS_RAIL_Y + 4} textAnchor="end" fontSize="14" fontWeight="900" fill="#dc2626">+</text>
          {Array.from({ length: BB_COLS }).map((_, c) => (
            <g key={`pls-${c}`}>
              <circle cx={colX(c)} cy={PLUS_RAIL_Y - 7} r="2.8" fill="#1f2937" opacity="0.45" />
              <circle cx={colX(c)} cy={PLUS_RAIL_Y + 7} r="2.8" fill="#1f2937" opacity="0.45" />
            </g>
          ))}
        </g>

        {/* Minus-Schiene — zwei Loch-Reihen + blaue Linie zwischen ihnen */}
        <g>
          <rect x={BB_X + 10} y={MINUS_RAIL_Y - 12} width={BB_W - 20} height="28" rx="2" fill="#f0f9ff" />
          <line x1={BB_X + 10} y1={MINUS_RAIL_Y} x2={BB_X + BB_W - 10} y2={MINUS_RAIL_Y} stroke="#2563eb" strokeWidth="2" />
          <text x={BB_X + 18} y={MINUS_RAIL_Y + 4} textAnchor="start" fontSize="14" fontWeight="900" fill="#2563eb">−</text>
          <text x={BB_X + BB_W - 18} y={MINUS_RAIL_Y + 4} textAnchor="end" fontSize="14" fontWeight="900" fill="#2563eb">−</text>
          {Array.from({ length: BB_COLS }).map((_, c) => (
            <g key={`mns-${c}`}>
              <circle cx={colX(c)} cy={MINUS_RAIL_Y - 7} r="2.8" fill="#1f2937" opacity="0.45" />
              <circle cx={colX(c)} cy={MINUS_RAIL_Y + 7} r="2.8" fill="#1f2937" opacity="0.45" />
            </g>
          ))}
        </g>

        {/* Mittelrille */}
        <rect x={BB_X + 4} y={CHANNEL_TOP} width={BB_W - 8} height={CHANNEL_BOTTOM - CHANNEL_TOP} fill="#fef9c3" stroke="#e7d36c" strokeWidth="0.5" />

        {/* Spaltennummern — bei 60 Spalten nur 5er-Schritte (sonst zu eng) */}
        {Array.from({ length: BB_COLS }).map((_, c) => {
          const label = c + 1;
          if (label !== 1 && label % 5 !== 0) return null;
          return (
            <text
              key={`cn-${c}`}
              x={colX(c)}
              y={BB_Y + 60}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#a16207"
              fontFamily="ui-monospace,monospace"
            >
              {label}
            </text>
          );
        })}

        {/* Reihen-Buchstaben */}
        {ROW_Y_UPPER.map((y, i) => {
          const r = (["a", "b", "c", "d", "e"] as const)[i]!;
          return (
            <g key={`ru-${r}`}>
              <text x={BB_X + 24} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
              <text x={BB_X + BB_W - 24} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
            </g>
          );
        })}
        {ROW_Y_LOWER.map((y, i) => {
          const r = (["f", "g", "h", "i", "j"] as const)[i]!;
          return (
            <g key={`rd-${r}`}>
              <text x={BB_X + 24} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
              <text x={BB_X + BB_W - 24} y={y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#a16207" fontFamily="ui-monospace,monospace">{r}</text>
            </g>
          );
        })}

        {/* Loch-Raster — 60 Spalten × 10 Reihen */}
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

        {/* === ESP32 38-Pin DevKit V1 === */}
        {showEsp && (
          <g transform={`translate(0, ${espInsertOffset})`} opacity={showInsertHint ? 0.92 : 1}>
            <Esp32PcbBody />
            <Esp32Wroom />
            <Esp32Usb />
            <Esp32EnBoot />
            <Esp32Ams1117 />
            <Esp32Cp2102 />
            {/* Pin-Header: north (Reihe a) + south (Reihe i), 19 Pins pro Seite */}
            {Array.from({ length: ESP_PIN_COUNT }).map((_, i) => {
              const n = northActive.get(i);
              const s = southActive.get(i);
              const pinW = 9;
              const pinH = 11;
              const nStroke = n ? TONE_COLORS[n.tone].stroke : "#92400e";
              const sStroke = s ? TONE_COLORS[s.tone].stroke : "#92400e";
              return (
                <g key={`pin-${i}`}>
                  {/* North-Pin auf Reihe a */}
                  <rect
                    x={colX(i) - pinW / 2}
                    y={ROW_Y_UPPER[0] - 5}
                    width={pinW}
                    height={pinH}
                    rx="1.2"
                    fill="url(#pin-gold)"
                    stroke={nStroke}
                    strokeWidth={n ? "1.6" : "0.6"}
                  />
                  {/* South-Pin auf Reihe i */}
                  <rect
                    x={colX(i) - pinW / 2}
                    y={ROW_Y_LOWER[3] - 6}
                    width={pinW}
                    height={pinH}
                    rx="1.2"
                    fill="url(#pin-gold)"
                    stroke={sStroke}
                    strokeWidth={s ? "1.6" : "0.6"}
                  />
                </g>
              );
            })}
            {/* Silkscreen-Labels für ALLE 19 Pins beider Seiten */}
            <g fontFamily="ui-monospace,monospace" fontWeight="700">
              {PIN_NORTH_LABELS.map((label, i) => {
                const a = northActive.get(i);
                const color = a ? TONE_COLORS[a.tone].light : "#cbd5e1";
                const isActive = Boolean(a);
                // North-Labels: TEXT zeigt auf der ESP-PCB-Seite Richtung INNEN (also nach unten, INNER pcb)
                // Y-Position: knapp unter dem Pin-Loch (Pin-Body ist 11 hoch ab y=ROW_Y_UPPER[0]-5)
                return (
                  <text
                    key={`np-label-${i}`}
                    x={colX(i)}
                    y={ROW_Y_UPPER[0] + 14}
                    textAnchor="middle"
                    fontSize={isActive ? "7" : "6"}
                    fill={color}
                  >
                    {label}
                  </text>
                );
              })}
              {PIN_SOUTH_LABELS.map((label, i) => {
                const a = southActive.get(i);
                const color = a ? TONE_COLORS[a.tone].light : "#cbd5e1";
                const isActive = Boolean(a);
                // South-Labels: knapp ÜBER dem Pin-Loch (Richtung Innen-PCB nach oben)
                return (
                  <text
                    key={`sp-label-${i}`}
                    x={colX(i)}
                    y={ROW_Y_LOWER[3] - 9}
                    textAnchor="middle"
                    fontSize={isActive ? "7" : "6"}
                    fill={color}
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          </g>
        )}

        {/* === Floating Pin-Callouts === */}
        {showEsp && !showInsertHint && activePins.filter((p) => p.callout).map((p, idx) => {
          const stroke = TONE_COLORS[p.tone].stroke;
          const text = TONE_COLORS[p.tone].text;
          if (p.side === "north") {
            // North → Callout ÜBER dem Brett (Richtung Plus-Schiene-oben)
            return (
              <g key={`callout-n-${idx}`}>
                <line x1={colX(p.col)} y1={BB_Y - 4} x2={colX(p.col)} y2={BB_Y - 14} stroke={stroke} strokeWidth="1.4" strokeDasharray="3 3" />
                <polygon
                  points={`${colX(p.col) - 4},${BB_Y - 14} ${colX(p.col) + 4},${BB_Y - 14} ${colX(p.col)},${BB_Y - 4}`}
                  fill={stroke}
                />
                <g filter="url(#cmp-shadow)">
                  <rect x={colX(p.col) - 38} y={BB_Y - 58} width="76" height="42" rx="8" fill={CALLOUT_BG[p.tone]} stroke={stroke} strokeWidth="1.4" />
                </g>
                <text x={colX(p.col)} y={BB_Y - 40} textAnchor="middle" fontSize="13" fontWeight="900" fill={text} fontFamily="ui-monospace,monospace">
                  {p.callout!.title}
                </text>
                <text x={colX(p.col)} y={BB_Y - 26} textAnchor="middle" fontSize="8" fontWeight="600" fill={text}>
                  {p.callout!.subtitle}
                </text>
              </g>
            );
          }
          // South → Callout UNTER dem Brett (Richtung Minus-Schiene-unten)
          return (
            <g key={`callout-s-${idx}`}>
              <line x1={colX(p.col)} y1={BB_Y + BB_H + 4} x2={colX(p.col)} y2={BB_Y + BB_H + 14} stroke={stroke} strokeWidth="1.4" strokeDasharray="3 3" />
              <polygon
                points={`${colX(p.col) - 4},${BB_Y + BB_H + 14} ${colX(p.col) + 4},${BB_Y + BB_H + 14} ${colX(p.col)},${BB_Y + BB_H + 4}`}
                fill={stroke}
              />
              <g filter="url(#cmp-shadow)">
                <rect x={colX(p.col) - 38} y={BB_Y + BB_H + 16} width="76" height="42" rx="8" fill={CALLOUT_BG[p.tone]} stroke={stroke} strokeWidth="1.4" />
              </g>
              <text x={colX(p.col)} y={BB_Y + BB_H + 36} textAnchor="middle" fontSize="13" fontWeight="900" fill={text} fontFamily="ui-monospace,monospace">
                {p.callout!.title}
              </text>
              <text x={colX(p.col)} y={BB_Y + BB_H + 50} textAnchor="middle" fontSize="8" fontWeight="600" fill={text}>
                {p.callout!.subtitle}
              </text>
            </g>
          );
        })}

        {/* === Insert-Hint-Pfeile === */}
        {showInsertHint && (
          <g>
            {/* Pro ausgewählter Spalte ZWEI Pfeile: einer vom oberen ESP-Pin
                nach unten zu Brett-Reihe a, einer vom unteren ESP-Pin nach
                unten zu Brett-Reihe i. So ist klar: 38-Pin-ESP belegt zwei
                Brett-Reihen gleichzeitig. */}
            {insertHintCols.map((col) => {
              // ESP-North-Pin Y im versetzten Modus
              const northPinVisible = ROW_Y_UPPER[0] + espInsertOffset; // = -110
              // ESP-South-Pin Y im versetzten Modus
              const southPinVisible = ROW_Y_LOWER[3] + espInsertOffset; // = 108
              return (
                <g key={`insert-arrow-${col}`}>
                  {/* Pfeil vom North-Pin (oben) → Brett-Reihe a */}
                  <line
                    x1={colX(col)}
                    y1={northPinVisible + 8}
                    x2={colX(col)}
                    y2={ROW_Y_UPPER[0] - 8}
                    stroke="#0ea5e9"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="8 5"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;-26" dur="0.9s" repeatCount="indefinite" />
                  </line>
                  <polygon
                    points={`${colX(col) - 8},${ROW_Y_UPPER[0] - 8} ${colX(col) + 8},${ROW_Y_UPPER[0] - 8} ${colX(col)},${ROW_Y_UPPER[0] + 6}`}
                    fill="#0ea5e9"
                  />
                  {/* Pfeil vom South-Pin (am ESP unten) → Brett-Reihe i */}
                  <line
                    x1={colX(col)}
                    y1={southPinVisible + 8}
                    x2={colX(col)}
                    y2={ROW_Y_LOWER[3] - 8}
                    stroke="#0ea5e9"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="8 5"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;-26" dur="0.9s" repeatCount="indefinite" />
                  </line>
                  <polygon
                    points={`${colX(col) - 8},${ROW_Y_LOWER[3] - 8} ${colX(col) + 8},${ROW_Y_LOWER[3] - 8} ${colX(col)},${ROW_Y_LOWER[3] + 6}`}
                    fill="#0ea5e9"
                  />
                  {/* Ziel-Marker am Brett: Reihe a + Reihe i pulsierend */}
                  <circle cx={colX(col)} cy={ROW_Y_UPPER[0]} r="6" fill="none" stroke="#0284c7" strokeWidth="2">
                    <animate attributeName="r" values="5;9;5" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={colX(col)} cy={ROW_Y_LOWER[3]} r="6" fill="none" stroke="#0284c7" strokeWidth="2">
                    <animate attributeName="r" values="5;9;5" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}
            {/* Zwei separate Banner: Top (north→a) und Bottom (south→i) */}
            <rect x={BB_X + 20} y={BB_Y - 32} width="280" height="22" rx="11" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.4" />
            <text x={BB_X + 160} y={BB_Y - 17} textAnchor="middle" fontSize="11" fontWeight="800" fill="#075985" fontFamily="ui-monospace,monospace">
              ↓ Obere Pin-Reihe → Brett-Reihe a
            </text>
            <rect x={BB_X + 20} y={BB_Y + BB_H + 10} width="280" height="22" rx="11" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.4" />
            <text x={BB_X + 160} y={BB_Y + BB_H + 25} textAnchor="middle" fontSize="11" fontWeight="800" fill="#075985" fontFamily="ui-monospace,monospace">
              ↑ Untere Pin-Reihe → Brett-Reihe i
            </text>
            {/* Gesamthinweis ganz oben */}
            <rect x={BB_X + BB_W / 2 - 220} y={-extraTopPad + 20} width="440" height="28" rx="14" fill="#fef3c7" stroke="#d97706" strokeWidth="1.6" />
            <text x={BB_X + BB_W / 2} y={-extraTopPad + 38} textAnchor="middle" fontSize="13" fontWeight="900" fill="#92400e" fontFamily="ui-monospace,monospace">
              ESP32 mittig drücken — alle 38 Pins gleichzeitig rein
            </text>
          </g>
        )}

        {/* === Column-Highlight === */}
        {showColumnHighlight && (
          <g>
            <rect
              x={colX(highlightCol) - 12}
              y={ROW_Y_UPPER[0] - 10}
              width="24"
              height={ROW_Y_UPPER[4] - ROW_Y_UPPER[0] + 20}
              rx="6"
              fill="#fde68a"
              fillOpacity="0.55"
              stroke="#f59e0b"
              strokeWidth="1.8"
              strokeDasharray="5 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
            </rect>
            <rect x={colX(highlightCol) - 80} y={ROW_Y_UPPER[0] - 40} width="160" height="22" rx="11" fill="#fef3c7" stroke="#d97706" strokeWidth="1.4" />
            <text x={colX(highlightCol)} y={ROW_Y_UPPER[0] - 25} textAnchor="middle" fontSize="10" fontWeight="800" fill="#92400e" fontFamily="ui-monospace,monospace">
              5 Löcher = elektrisch EINS
            </text>
            <line x1={colX(highlightCol)} y1={ROW_Y_UPPER[0] - 18} x2={colX(highlightCol)} y2={ROW_Y_UPPER[0] - 12} stroke="#d97706" strokeWidth="1.4" />
          </g>
        )}

        {/* === CHILDREN (z-top) === */}
        {children}
      </svg>
    </div>
  );
}

const CALLOUT_BG: Record<ActivePin["tone"], string> = {
  signal:   "#f0fdf4",
  ground:   "#eff6ff",
  power3v3: "#fef2f2",
  power5v:  "#fffbeb",
  neutral:  "#f8fafc",
};

// ============================================================
// ESP32-Sub-Komponenten (Layout AZ-Delivery 38-Pin DevKit V1)
// USB ist auf der LINKEN Schmalseite (im Renderer = ESP_BODY_X-Ende).
// WROOM-Modul sitzt RECHTS (USB-fern) auf dem PCB.
// ============================================================

function Esp32PcbBody() {
  return (
    <g filter="url(#cmp-shadow)">
      <rect x={ESP_BODY_X} y={ESP_BODY_Y} width={ESP_BODY_W} height={ESP_BODY_H} rx="6" fill="#0a1422" stroke="#1f2937" strokeWidth="1.2" />
      <rect x={ESP_BODY_X + 4} y={ESP_BODY_Y + 4} width={ESP_BODY_W - 8} height={ESP_BODY_H - 8} rx="4" fill="none" stroke="#475569" strokeWidth="0.4" opacity="0.6" />
      {/* 4 Befestigungslöcher */}
      <circle cx={ESP_BODY_X + 10} cy={ESP_BODY_Y + 10} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      <circle cx={ESP_BODY_X + ESP_BODY_W - 10} cy={ESP_BODY_Y + 10} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      <circle cx={ESP_BODY_X + 10} cy={ESP_BODY_Y + ESP_BODY_H - 10} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      <circle cx={ESP_BODY_X + ESP_BODY_W - 10} cy={ESP_BODY_Y + ESP_BODY_H - 10} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
    </g>
  );
}

function Esp32Wroom() {
  // WROOM-32 echte Maße 18×25.5 mm. In SVG (1 mm ≈ 11.8 Units): 213 × 301
  // — zu groß für unseren 540×210 ESP-Body. Wir skalieren auf 220 × 160
  // (= visuell-passend, echt-aussehend, nimmt die rechte Hälfte des PCB ein).
  const wroomW = 220;
  const wroomH = 160;
  const wroomX = ESP_BODY_X + ESP_BODY_W - wroomW - 30;
  const wroomY = ESP_BODY_Y + (ESP_BODY_H - wroomH) / 2;
  return (
    <g filter="url(#cmp-shadow)">
      <rect x={wroomX} y={wroomY} width={wroomW} height={wroomH} rx="3" fill="url(#wroom-shield)" stroke="#475569" strokeWidth="0.8" />
      {/* Antennen-Mäander rechts oben */}
      <path
        d={`M ${wroomX + wroomW - 50} ${wroomY + 8}
            L ${wroomX + wroomW - 10} ${wroomY + 8}
            L ${wroomX + wroomW - 10} ${wroomY + 14}
            L ${wroomX + wroomW - 50} ${wroomY + 14}
            L ${wroomX + wroomW - 50} ${wroomY + 20}
            L ${wroomX + wroomW - 10} ${wroomY + 20}`}
        fill="none"
        stroke="#1e293b"
        strokeWidth="1.4"
        strokeLinejoin="miter"
      />
      <text x={wroomX + wroomW / 2 - 15} y={wroomY + wroomH / 2 - 4} textAnchor="middle" fontSize="14" fontWeight="900" fill="#0f172a" fontFamily="ui-monospace,monospace" letterSpacing="0.6">
        ESP-WROOM-32
      </text>
      <text x={wroomX + wroomW / 2 - 15} y={wroomY + wroomH / 2 + 14} textAnchor="middle" fontSize="8" fontWeight="600" fill="#475569" fontFamily="ui-monospace,monospace">
        CE · FCC · DevKit V1
      </text>
      <text x={wroomX + wroomW / 2 - 15} y={wroomY + wroomH / 2 + 28} textAnchor="middle" fontSize="6.5" fontWeight="500" fill="#64748b" fontFamily="ui-monospace,monospace">
        38-Pin · AZ-Delivery
      </text>
    </g>
  );
}

function Esp32Usb() {
  // USB-Anschluss ragt links AUSSERHALB des PCBs (echtes Board hat
  // USB-Stecker, der über den PCB-Rand hinausragt).
  const usbX = ESP_BODY_X - 18;
  const usbY = ESP_BODY_Y + ESP_BODY_H / 2 - 14;
  return (
    <g filter="url(#cmp-shadow)">
      <rect x={usbX} y={usbY} width="22" height="28" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      <rect x={usbX + 4} y={usbY + 4} width="14" height="20" rx="1.5" fill="#1e293b" />
    </g>
  );
}

function Esp32EnBoot() {
  // EN- und BOOT-Buttons sitzen am USB-Ende des PCB (linke Schmalseite).
  // Real: EN oben, BOOT unten — quer zur USB-Achse.
  const btnX = ESP_BODY_X + 18;
  return (
    <g>
      {/* EN-Button (oben am USB-Ende) */}
      <rect x={btnX} y={ESP_BODY_Y + 14} width="16" height="16" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="0.6" filter="url(#cmp-shadow)" />
      <circle cx={btnX + 8} cy={ESP_BODY_Y + 22} r="4" fill="#0f172a" />
      <text x={btnX + 8} y={ESP_BODY_Y + 42} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#cbd5e1" fontFamily="ui-monospace,monospace">EN</text>

      {/* BOOT-Button (unten am USB-Ende) */}
      <rect x={btnX} y={ESP_BODY_Y + ESP_BODY_H - 30} width="16" height="16" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="0.6" filter="url(#cmp-shadow)" />
      <circle cx={btnX + 8} cy={ESP_BODY_Y + ESP_BODY_H - 22} r="4" fill="#0f172a" />
      <text x={btnX + 8} y={ESP_BODY_Y + ESP_BODY_H - 36} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#cbd5e1" fontFamily="ui-monospace,monospace">BOOT</text>
    </g>
  );
}

function Esp32Ams1117() {
  // AMS1117 Spannungsregler — sitzt zwischen USB-Ende und WROOM-Modul,
  // typisch nahe der EN-Button-Reihe (oberhalb auf dem PCB).
  const x = ESP_BODY_X + 50;
  const y = ESP_BODY_Y + 30;
  return (
    <g>
      <rect x={x} y={y} width="32" height="14" rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.4" />
      <rect x={x} y={y} width="32" height="4" fill="#ea580c" opacity="0.9" />
      <text x={x + 16} y={y + 10} textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">AMS1117</text>
    </g>
  );
}

function Esp32Cp2102() {
  // CP2102 USB-Serial-IC — sitzt zwischen USB-Ende und WROOM, typisch in
  // der unteren Hälfte des PCBs nahe der BOOT-Button-Reihe.
  const x = ESP_BODY_X + 50;
  const y = ESP_BODY_Y + ESP_BODY_H - 44;
  return (
    <g>
      <rect x={x} y={y} width="24" height="14" rx="1" fill="#0a0f19" stroke="#475569" strokeWidth="0.4" />
      <text x={x + 12} y={y + 9} textAnchor="middle" fontSize="5.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">CP2102</text>
    </g>
  );
}
