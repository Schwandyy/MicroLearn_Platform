"use client";

import { cn } from "@/lib/utils";
import {
  ActivePin,
  BB_COLS,
  BB_H,
  BB_W,
  BB_X,
  BB_Y,
  BOTTOM_PIN_LABELS,
  CHANNEL_BOTTOM,
  CHANNEL_TOP,
  ESP_BODY_H,
  ESP_BODY_W,
  ESP_BODY_X,
  ESP_BODY_Y,
  MINUS_RAIL_Y,
  PLUS_RAIL_Y,
  ROW_Y_LOWER,
  ROW_Y_UPPER,
  TONE_COLORS,
  TOP_PIN_LABELS,
  VB_H,
  VB_W,
  colX,
} from "./geometry";

/**
 * BreadboardCanvas — gemeinsamer Renderer für Brett + ESP32 + Modi.
 *
 * Verwendung pro Lesson:
 *   <BreadboardCanvas mode={mode} activePins={[
 *     { col: 3, side: "bottom", tone: "signal", callout: { title: "GPIO 2", subtitle: "Signal" }},
 *     { col: 1, side: "top",    tone: "ground", callout: { title: "GND",    subtitle: "Masse" }},
 *   ]}>
 *     {/* Lesson-eigene Bauteile + Wires + Spotlights *}
 *   </BreadboardCanvas>
 *
 * Render-Reihenfolge (z-order, exakt wie das Premium-Blink-Original):
 *   1. Breadboard-Korpus (Schienen, Kanal, Löcher, Reihen/Spalten-Labels)
 *   2. ESP32 komplett (PCB + WROOM + USB + Buttons + ICs + Pin-Header + Silkscreen + Floating Callouts)
 *   3. Mode-Overlays: Insert-Hint-Arrows + Column-Highlight
 *   4. children  — Bauteile (Resistor, LED), Wires, BuildSpotlights der Lesson — ALLE oben drauf,
 *      damit Drähte sauber über Pin-Header laufen und Spotlights nichts verdecken können.
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
  /** Spalte für boardWithHighlight (Default 8, also Spalte 9). */
  highlightCol?: number;
  /** Spalten in der Insert-Hint-Animation (Default [3, 7, 11]). */
  insertHintCols?: number[];
  children?: React.ReactNode;
  /** Eingebettete style/animation defs zusätzlich (z.B. led-blink). */
  extraDefs?: React.ReactNode;
  /** Zusätzliche aria-label-Beschreibung der Schaltung. */
  ariaLabel?: string;
  className?: string;
}

export function BreadboardCanvas({
  mode = "build",
  activePins = [],
  highlightCol = 8,
  insertHintCols = [3, 7, 11],
  children,
  extraDefs,
  ariaLabel = "ESP32-Brett-Schaltbild",
  className,
}: BreadboardCanvasProps) {
  const isBuildMode = mode === "build";
  const showEsp = mode !== "boardOnly" && mode !== "boardWithHighlight";
  const showInsertHint = mode === "insertHint";
  const showColumnHighlight = mode === "boardWithHighlight";
  // EXPLAIN-Modi: jede Spalte beschriften — sonst nur 5er-Schritte
  const labelEveryColumn = !isBuildMode;
  const espInsertOffset = showInsertHint ? -130 : 0;
  const extraTopPad = showInsertHint ? 160 : 0;

  // Lookup-Sets für Pin-Highlights pro Seite
  const bottomActive = new Map<number, ActivePin>();
  const topActive = new Map<number, ActivePin>();
  for (const p of activePins) {
    if (p.side === "bottom") bottomActive.set(p.col, p);
    else topActive.set(p.col, p);
  }

  return (
    <div className={cn("relative mx-auto w-full max-w-4xl", className)}>
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
          {/* Animation für Strom-Fluss-Drähte (current-flow ist im Wire-Helper referenziert) */}
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

        {/* === BREADBOARD MB-102 (weißes ABS) === */}
        <g filter="url(#bb-shadow)">
          <rect x={BB_X} y={BB_Y} width={BB_W} height={BB_H} rx="6" fill="#fafafa" stroke="#cbd5e1" strokeWidth="1.4" />
          <rect x={BB_X + 2} y={BB_Y + 2} width={BB_W - 4} height={BB_H - 4} rx="5" fill="none" stroke="#e5e7eb" strokeWidth="1" opacity="0.7" />
        </g>

        {/* Plus-Schiene (rot) */}
        <g>
          <rect x={BB_X + 10} y={PLUS_RAIL_Y - 4} width={BB_W - 20} height="22" rx="2" fill="#fffaf0" />
          <line x1={BB_X + 10} y1={PLUS_RAIL_Y + 7} x2={BB_X + BB_W - 10} y2={PLUS_RAIL_Y + 7} stroke="#dc2626" strokeWidth="2" />
          <text x={BB_X + 18} y={PLUS_RAIL_Y + 12} textAnchor="start" fontSize="14" fontWeight="900" fill="#dc2626">+</text>
          <text x={BB_X + BB_W - 18} y={PLUS_RAIL_Y + 12} textAnchor="end" fontSize="14" fontWeight="900" fill="#dc2626">+</text>
          {Array.from({ length: BB_COLS }).map((_, c) => (
            <circle key={`pls-${c}`} cx={colX(c)} cy={PLUS_RAIL_Y + 7} r="2.8" fill="#1f2937" opacity="0.45" />
          ))}
        </g>

        {/* Minus-Schiene (blau) */}
        <g>
          <rect x={BB_X + 10} y={MINUS_RAIL_Y - 4} width={BB_W - 20} height="22" rx="2" fill="#f0f9ff" />
          <line x1={BB_X + 10} y1={MINUS_RAIL_Y + 7} x2={BB_X + BB_W - 10} y2={MINUS_RAIL_Y + 7} stroke="#2563eb" strokeWidth="2" />
          <text x={BB_X + 18} y={MINUS_RAIL_Y + 12} textAnchor="start" fontSize="14" fontWeight="900" fill="#2563eb">−</text>
          <text x={BB_X + BB_W - 18} y={MINUS_RAIL_Y + 12} textAnchor="end" fontSize="14" fontWeight="900" fill="#2563eb">−</text>
          {Array.from({ length: BB_COLS }).map((_, c) => (
            <circle key={`mns-${c}`} cx={colX(c)} cy={MINUS_RAIL_Y + 7} r="2.8" fill="#1f2937" opacity="0.45" />
          ))}
        </g>

        {/* Mittelrille */}
        <rect x={BB_X + 4} y={CHANNEL_TOP} width={BB_W - 8} height={CHANNEL_BOTTOM - CHANNEL_TOP} fill="#fef9c3" stroke="#e7d36c" strokeWidth="0.5" />

        {/* Spaltennummern */}
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

        {/* Loch-Raster */}
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

        {/* === ESP32 — PCB + WROOM + USB + Buttons + ICs + Pin-Header + Silkscreen === */}
        {showEsp && (
          <g transform={`translate(0, ${espInsertOffset})`} opacity={showInsertHint ? 0.92 : 1}>
            <Esp32PcbBody />
            <Esp32Wroom />
            <Esp32Usb />
            <Esp32EnBoot />
            <Esp32Ams1117 />
            <Esp32Cp2102 />
            {Array.from({ length: 15 }).map((_, i) => {
              const bot = bottomActive.get(i);
              const top = topActive.get(i);
              const pinW = 9;
              const pinH = 11;
              const botStroke = bot ? TONE_COLORS[bot.tone].stroke : "#92400e";
              const topStroke = top ? TONE_COLORS[top.tone].stroke : "#92400e";
              return (
                <g key={`pin-${i}`}>
                  <rect
                    x={colX(i) - pinW / 2}
                    y={ROW_Y_UPPER[4] - 5}
                    width={pinW}
                    height={pinH}
                    rx="1.2"
                    fill="url(#pin-gold)"
                    stroke={botStroke}
                    strokeWidth={bot ? "1.6" : "0.6"}
                  />
                  <rect
                    x={colX(i) - pinW / 2}
                    y={ROW_Y_LOWER[0] - 6}
                    width={pinW}
                    height={pinH}
                    rx="1.2"
                    fill="url(#pin-gold)"
                    stroke={topStroke}
                    strokeWidth={top ? "1.6" : "0.6"}
                  />
                </g>
              );
            })}
            {/* Silkscreen-Labels (nur linke 6 Pins — der Rest ist vom WROOM-Modul verdeckt) */}
            <g fontFamily="ui-monospace,monospace" fontWeight="700">
              {BOTTOM_PIN_LABELS.slice(0, 6).map((label, i) => {
                const a = bottomActive.get(i);
                const color = a ? TONE_COLORS[a.tone].light : "#cbd5e1";
                const isActive = Boolean(a);
                return (
                  <text key={`bp-label-${i}`} x={colX(i)} y={ROW_Y_UPPER[4] - 6} textAnchor="middle" fontSize={isActive ? "6.5" : "5.5"} fill={color}>
                    {label}
                  </text>
                );
              })}
              {TOP_PIN_LABELS.slice(0, 6).map((label, i) => {
                const a = topActive.get(i);
                const color = a ? TONE_COLORS[a.tone].light : "#cbd5e1";
                const isActive = Boolean(a);
                return (
                  <text key={`tp-label-${i}`} x={colX(i)} y={ROW_Y_LOWER[0] + 11} textAnchor="middle" fontSize={isActive ? "6.5" : "5.5"} fill={color}>
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
          if (p.side === "bottom") {
            // Callout ÜBER dem Brett
            return (
              <g key={`callout-bot-${idx}`}>
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
          // Callout UNTER dem Brett
          return (
            <g key={`callout-top-${idx}`}>
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
            {insertHintCols.map((col) => (
              <g key={`insert-arrow-${col}`}>
                <line x1={colX(col)} y1={BB_Y - 30} x2={colX(col)} y2={ROW_Y_LOWER[0] - 6} stroke="#0ea5e9" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 5">
                  <animate attributeName="stroke-dashoffset" values="0;-26" dur="0.9s" repeatCount="indefinite" />
                </line>
                <polygon
                  points={`${colX(col) - 8},${ROW_Y_LOWER[0] - 6} ${colX(col) + 8},${ROW_Y_LOWER[0] - 6} ${colX(col)},${ROW_Y_LOWER[0] + 8}`}
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

        {/* === CHILDREN (z-top): Lesson-spezifische Bauteile, Wires, BuildSpotlights === */}
        {children}
      </svg>
    </div>
  );
}

const CALLOUT_BG: Record<ActivePin["tone"], string> = {
  signal:   "#f0fdf4",
  ground:   "#eff6ff",
  power3v3: "#fef2f2",
  powerVin: "#fffbeb",
  neutral:  "#f8fafc",
};

// ============================================================
// ESP32-Sub-Komponenten (privat im Modul) — exakt das echte DevKit V1
// ============================================================

function Esp32PcbBody() {
  return (
    <g filter="url(#cmp-shadow)">
      <rect x={ESP_BODY_X} y={ESP_BODY_Y} width={ESP_BODY_W} height={ESP_BODY_H} rx="6" fill="#0a1422" stroke="#1f2937" strokeWidth="1.2" />
      <rect x={ESP_BODY_X + 4} y={ESP_BODY_Y + 4} width={ESP_BODY_W - 8} height={ESP_BODY_H - 8} rx="4" fill="none" stroke="#475569" strokeWidth="0.4" opacity="0.6" />
      {/* 4 Befestigungslöcher */}
      <circle cx={ESP_BODY_X + 8} cy={ESP_BODY_Y + 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      <circle cx={ESP_BODY_X + ESP_BODY_W - 8} cy={ESP_BODY_Y + 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      <circle cx={ESP_BODY_X + 8} cy={ESP_BODY_Y + ESP_BODY_H - 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
      <circle cx={ESP_BODY_X + ESP_BODY_W - 8} cy={ESP_BODY_Y + ESP_BODY_H - 8} r="2.5" fill="#0f172a" stroke="#475569" strokeWidth="0.6" />
    </g>
  );
}

function Esp32Wroom() {
  const wroomX = colX(6) - 4;
  const wroomY = ESP_BODY_Y + 12;
  const wroomW = colX(14) - colX(6) + 12;
  const wroomH = ESP_BODY_H - 28;
  return (
    <g filter="url(#cmp-shadow)">
      <rect x={wroomX} y={wroomY} width={wroomW} height={wroomH} rx="2" fill="url(#wroom-shield)" stroke="#475569" strokeWidth="0.8" />
      {/* Antennen-Mäander */}
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
      <text x={wroomX + (wroomW - 30) / 2} y={wroomY + wroomH / 2 - 2} textAnchor="middle" fontSize="11" fontWeight="900" fill="#0f172a" fontFamily="ui-monospace,monospace" letterSpacing="0.6">
        ESP-WROOM-32
      </text>
      <text x={wroomX + (wroomW - 30) / 2} y={wroomY + wroomH / 2 + 12} textAnchor="middle" fontSize="6" fontWeight="600" fill="#475569" fontFamily="ui-monospace,monospace">
        CE · FCC · DevKit V1
      </text>
    </g>
  );
}

function Esp32Usb() {
  return (
    <g filter="url(#cmp-shadow)">
      <rect x={ESP_BODY_X - 18} y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 - 14} width="22" height="28" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
      <rect x={ESP_BODY_X - 14} y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 - 10} width="14" height="20" rx="1.5" fill="#1e293b" />
    </g>
  );
}

function Esp32EnBoot() {
  return (
    <g>
      <rect x={ESP_BODY_X + 6} y={ESP_BODY_Y + 6} width="14" height="14" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="0.6" filter="url(#cmp-shadow)" />
      <circle cx={ESP_BODY_X + 13} cy={ESP_BODY_Y + 13} r="3.5" fill="#0f172a" />
      <text x={ESP_BODY_X + 13} y={ESP_BODY_Y + 30} textAnchor="middle" fontSize="6" fontWeight="800" fill="#cbd5e1" fontFamily="ui-monospace,monospace">EN</text>

      <rect x={ESP_BODY_X + 6} y={ESP_BODY_Y + ESP_BODY_H - 20} width="14" height="14" rx="2" fill="#1f2937" stroke="#475569" strokeWidth="0.6" filter="url(#cmp-shadow)" />
      <circle cx={ESP_BODY_X + 13} cy={ESP_BODY_Y + ESP_BODY_H - 13} r="3.5" fill="#0f172a" />
      <text x={ESP_BODY_X + 13} y={ESP_BODY_Y + ESP_BODY_H - 24} textAnchor="middle" fontSize="6" fontWeight="800" fill="#cbd5e1" fontFamily="ui-monospace,monospace">BOOT</text>
    </g>
  );
}

function Esp32Ams1117() {
  return (
    <g>
      <rect x={ESP_BODY_X + 26} y={ESP_BODY_Y + 8} width="22" height="11" rx="0.8" fill="#0f172a" stroke="#475569" strokeWidth="0.4" />
      <rect x={ESP_BODY_X + 26} y={ESP_BODY_Y + 8} width="22" height="3" fill="#ea580c" opacity="0.9" />
      <text x={ESP_BODY_X + 37} y={ESP_BODY_Y + 16} textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">AMS1117</text>
    </g>
  );
}

function Esp32Cp2102() {
  return (
    <g>
      <rect x={ESP_BODY_X + 26} y={ESP_BODY_Y + ESP_BODY_H - 19} width="16" height="11" rx="0.8" fill="#0a0f19" stroke="#475569" strokeWidth="0.4" />
      <text x={ESP_BODY_X + 34} y={ESP_BODY_Y + ESP_BODY_H - 12} textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">CP2102</text>
    </g>
  );
}
