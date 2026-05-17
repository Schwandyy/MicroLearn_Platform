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

// Relevante Pins (vereinfachte Positionen für die Lesson):
const PIN_3V3_COL = 0; // Spalte 1, linke Pinreihe (Reihe e)
const PIN_GPIO2_COL = 3; // Spalte 4
const PIN_GND_COL = 13; // Spalte 14, rechte Pinreihe (Reihe f)

// Widerstand + LED — rechts vom ESP32 auf Reihe a/b
const RES_LEFT_COL = 17; // Spalte 18
const RES_RIGHT_COL = 20; // Spalte 21
const LED_ANODE_COL = 20; // Spalte 21 — selbe Spalte wie rechtes Widerstandsbein
const LED_CATHODE_COL = 21; // Spalte 22

export function BlinkSchematic({
  ledOn = false,
  ledAnimation = "off",
  buildStage = "all",
  className,
}: BlinkSchematicProps) {
  const stageNum = buildStage === "all" ? 99 : buildStage;
  const showResistor = stageNum >= 1;
  const showLed = stageNum >= 2;
  const showWires = stageNum >= 3;
  const isOn = (ledOn || buildStage === "all") && ledAnimation !== "off";

  return (
    <div className={cn("relative mx-auto w-full max-w-4xl", className)}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
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
            BREADBOARD MB-102 (830 contacts)
            ==================================================================== */}
        <g filter="url(#bb-shadow)">
          {/* Korpus — leicht gelblich-weiß wie echtes ABS */}
          <rect
            x={BB_X}
            y={BB_Y}
            width={BB_W}
            height={BB_H}
            rx="6"
            fill="#fefce8"
            stroke="#a78b4a"
            strokeWidth="1.4"
          />
          {/* Subtile Strukturlinien für Plastik-Optik */}
          <rect x={BB_X + 2} y={BB_Y + 2} width={BB_W - 4} height={BB_H - 4} rx="5" fill="none" stroke="#fef9c3" strokeWidth="1" opacity="0.6" />
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

        {/* Spaltennummern oben (jede 5te) */}
        {Array.from({ length: BB_COLS }).map((_, c) => {
          const label = c + 1;
          const show = label === 1 || label % 5 === 0;
          if (!show) return null;
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
            ESP32 DevKit V1 — sitzt IM Breadboard, überspannt die Mittelrille
            ==================================================================== */}
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

        {/* ESP-WROOM-32 Modul (silbernes Metallgehäuse mit Antennen-Mäander) */}
        <g filter="url(#cmp-shadow)">
          <rect
            x={ESP_BODY_X + 12}
            y={ESP_BODY_Y + 14}
            width={ESP_BODY_W - 24}
            height={ESP_BODY_H - 60}
            rx="2"
            fill="url(#wroom-shield)"
            stroke="#475569"
            strokeWidth="0.8"
          />
          {/* Antennen-Mäander oben (PCB-Antenne) */}
          <path
            d={`M ${ESP_BODY_X + 24} ${ESP_BODY_Y + 22}
                L ${ESP_BODY_X + ESP_BODY_W - 24} ${ESP_BODY_Y + 22}
                L ${ESP_BODY_X + ESP_BODY_W - 24} ${ESP_BODY_Y + 27}
                L ${ESP_BODY_X + 24} ${ESP_BODY_Y + 27}
                L ${ESP_BODY_X + 24} ${ESP_BODY_Y + 32}
                L ${ESP_BODY_X + ESP_BODY_W - 24} ${ESP_BODY_Y + 32}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth="1.5"
            strokeLinejoin="miter"
          />
          {/* Aufdruck (generisch, kein Brand) */}
          <text
            x={ESP_BODY_X + ESP_BODY_W / 2}
            y={ESP_BODY_Y + ESP_BODY_H / 2 - 12}
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            fill="#0f172a"
            fontFamily="ui-monospace,monospace"
            letterSpacing="0.8"
          >
            ESP32-WROOM-32
          </text>
          <text
            x={ESP_BODY_X + ESP_BODY_W / 2}
            y={ESP_BODY_Y + ESP_BODY_H / 2 + 2}
            textAnchor="middle"
            fontSize="7"
            fontWeight="600"
            fill="#475569"
            fontFamily="ui-monospace,monospace"
          >
            DevKit V1 · 30-pin
          </text>
          <text
            x={ESP_BODY_X + ESP_BODY_W - 16}
            y={ESP_BODY_Y + ESP_BODY_H / 2 + 14}
            textAnchor="end"
            fontSize="6"
            fontWeight="600"
            fill="#475569"
            fontFamily="ui-monospace,monospace"
          >
            CE FCC
          </text>
        </g>

        {/* USB-Mikro-Port (am linken Schmalende des ESP32) */}
        <g filter="url(#cmp-shadow)">
          <rect
            x={ESP_BODY_X - 16}
            y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 - 14}
            width="20"
            height="28"
            rx="3"
            fill="#94a3b8"
            stroke="#475569"
            strokeWidth="1"
          />
          <rect
            x={ESP_BODY_X - 12}
            y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 - 10}
            width="12"
            height="20"
            rx="1.5"
            fill="#1e293b"
          />
          <text
            x={ESP_BODY_X - 6}
            y={(CHANNEL_TOP + CHANNEL_BOTTOM) / 2 + 28}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#64748b"
            fontFamily="ui-monospace,monospace"
          >
            USB
          </text>
        </g>

        {/* CP2102 USB-Serial-IC + AMS1117 Spannungsregler (auf der Platine) */}
        <g>
          <rect x={ESP_BODY_X + 16} y={ESP_BODY_Y + ESP_BODY_H - 36} width="28" height="18" rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
          <text x={ESP_BODY_X + 30} y={ESP_BODY_Y + ESP_BODY_H - 24} textAnchor="middle" fontSize="6" fontWeight="700" fill="#94a3b8" fontFamily="ui-monospace,monospace">CP2102</text>
          <rect x={ESP_BODY_X + ESP_BODY_W - 44} y={ESP_BODY_Y + ESP_BODY_H - 36} width="28" height="18" rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
          <text x={ESP_BODY_X + ESP_BODY_W - 30} y={ESP_BODY_Y + ESP_BODY_H - 24} textAnchor="middle" fontSize="6" fontWeight="700" fill="#94a3b8" fontFamily="ui-monospace,monospace">AMS1117</text>
        </g>

        {/* EN + BOOT Tact-Switches */}
        <g>
          <rect x={ESP_BODY_X + 56} y={ESP_BODY_Y + ESP_BODY_H - 38} width="14" height="14" rx="2" fill="#64748b" stroke="#334155" strokeWidth="0.5" filter="url(#cmp-shadow)" />
          <text x={ESP_BODY_X + 63} y={ESP_BODY_Y + ESP_BODY_H - 8} textAnchor="middle" fontSize="6" fontWeight="700" fill="#94a3b8">EN</text>
          <rect x={ESP_BODY_X + ESP_BODY_W - 70} y={ESP_BODY_Y + ESP_BODY_H - 38} width="14" height="14" rx="2" fill="#64748b" stroke="#334155" strokeWidth="0.5" filter="url(#cmp-shadow)" />
          <text x={ESP_BODY_X + ESP_BODY_W - 63} y={ESP_BODY_Y + ESP_BODY_H - 8} textAnchor="middle" fontSize="6" fontWeight="700" fill="#94a3b8">BOOT</text>
        </g>

        {/* PWR + USR LEDs */}
        <g>
          <circle cx={ESP_BODY_X + ESP_BODY_W / 2 - 16} cy={ESP_BODY_Y + ESP_BODY_H - 30} r="2.5" fill="#dc2626" />
          <text x={ESP_BODY_X + ESP_BODY_W / 2 - 16} y={ESP_BODY_Y + ESP_BODY_H - 8} textAnchor="middle" fontSize="6" fill="#94a3b8">PWR</text>
          <circle cx={ESP_BODY_X + ESP_BODY_W / 2 + 16} cy={ESP_BODY_Y + ESP_BODY_H - 30} r="2.5" fill="#2563eb" />
          <text x={ESP_BODY_X + ESP_BODY_W / 2 + 16} y={ESP_BODY_Y + ESP_BODY_H - 8} textAnchor="middle" fontSize="6" fill="#94a3b8">USR</text>
        </g>

        {/* Goldene Pin-Header — links (Reihe e) und rechts (Reihe f), 15 Pins je Seite */}
        {Array.from({ length: 15 }).map((_, i) => (
          <g key={`pin-${i}`}>
            {/* Oberer Pin sitzt in Loch row e column i */}
            <rect x={colX(i) - 3.5} y={ROW_Y_UPPER[4]! - 4} width="7" height="8" rx="0.8" fill="url(#pin-gold)" stroke="#92400e" strokeWidth="0.4" />
            {/* Unterer Pin sitzt in Loch row f column i */}
            <rect x={colX(i) - 3.5} y={ROW_Y_LOWER[0]! - 4} width="7" height="8" rx="0.8" fill="url(#pin-gold)" stroke="#92400e" strokeWidth="0.4" />
          </g>
        ))}

        {/* Wichtige Pin-Labels (3V3, GPIO 2 links — GND rechts) als kleine Anmerkungen */}
        <g>
          {/* 3V3 — Spalte 1, oben */}
          <line x1={colX(PIN_3V3_COL)} y1={ESP_BODY_Y - 8} x2={colX(PIN_3V3_COL)} y2={ESP_BODY_Y - 2} stroke="#fca5a5" strokeWidth="1.4" />
          <rect x={colX(PIN_3V3_COL) - 16} y={ESP_BODY_Y - 28} width="32" height="18" rx="3" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.8" />
          <text x={colX(PIN_3V3_COL)} y={ESP_BODY_Y - 15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#b91c1c" fontFamily="ui-monospace,monospace">3V3</text>

          {/* GPIO 2 — Spalte 4, oben */}
          <line x1={colX(PIN_GPIO2_COL)} y1={ESP_BODY_Y - 8} x2={colX(PIN_GPIO2_COL)} y2={ESP_BODY_Y - 2} stroke="#86efac" strokeWidth="1.4" />
          <rect x={colX(PIN_GPIO2_COL) - 22} y={ESP_BODY_Y - 28} width="44" height="18" rx="3" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.8" />
          <text x={colX(PIN_GPIO2_COL)} y={ESP_BODY_Y - 15} textAnchor="middle" fontSize="9" fontWeight="800" fill="#15803d" fontFamily="ui-monospace,monospace">GPIO 2</text>

          {/* GND — Spalte 14, unten (rechts vom Body) */}
          <line x1={colX(PIN_GND_COL)} y1={ESP_BODY_Y + ESP_BODY_H + 2} x2={colX(PIN_GND_COL)} y2={ESP_BODY_Y + ESP_BODY_H + 8} stroke="#93c5fd" strokeWidth="1.4" />
          <rect x={colX(PIN_GND_COL) - 16} y={ESP_BODY_Y + ESP_BODY_H + 10} width="32" height="18" rx="3" fill="#eff6ff" stroke="#93c5fd" strokeWidth="0.8" />
          <text x={colX(PIN_GND_COL)} y={ESP_BODY_Y + ESP_BODY_H + 23} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1d4ed8" fontFamily="ui-monospace,monospace">GND</text>
        </g>

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
              const cy = ROW_Y_UPPER[0]! - 14;
              const bodyW = (colX(RES_RIGHT_COL) - colX(RES_LEFT_COL)) * 0.7;
              const bodyH = 18;
              const bodyX = cx - bodyW / 2;
              const bodyY = cy - bodyH / 2;
              const ringW = 4;
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
                cy={ROW_Y_UPPER[0]! - 28}
                r="36"
                fill="url(#led-glow)"
                className={ledAnimation === "blink" ? "glow-on" : undefined}
              />
            )}
            {/* Beinchen (Anode lang, Kathode kurz) */}
            <line x1={colX(LED_ANODE_COL)} y1={ROW_Y_UPPER[0]!} x2={colX(LED_ANODE_COL)} y2={ROW_Y_UPPER[0]! - 22} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <line x1={colX(LED_CATHODE_COL)} y1={ROW_Y_UPPER[0]!} x2={colX(LED_CATHODE_COL)} y2={ROW_Y_UPPER[0]! - 16} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
            <circle cx={colX(LED_ANODE_COL)} cy={ROW_Y_UPPER[0]!} r="3" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
            <circle cx={colX(LED_CATHODE_COL)} cy={ROW_Y_UPPER[0]!} r="3" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
            {/* LED-Dom */}
            {(() => {
              const cx = (colX(LED_ANODE_COL) + colX(LED_CATHODE_COL)) / 2;
              const cy = ROW_Y_UPPER[0]! - 28;
              return (
                <>
                  {/* Basis-Flansch (schwarzes Plastik unten an der LED) */}
                  <ellipse cx={cx} cy={cy + 8} rx="14" ry="3.5" fill="#1f2937" />
                  {/* Halbkugel */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="13"
                    fill={isOn ? "url(#led-dome)" : "#fecaca"}
                    stroke="#7f1d1d"
                    strokeWidth="1"
                    className={isOn && ledAnimation === "blink" ? "led-on" : undefined}
                  />
                  {/* Reflexion (Highlight) */}
                  <ellipse cx={cx - 4} cy={cy - 5} rx="3" ry="5" fill="#fee2e2" opacity={isOn ? 0.85 : 0.6} />
                  {/* Kathode-Marker (kleines „−") */}
                  <text x={colX(LED_CATHODE_COL) + 8} y={ROW_Y_UPPER[0]! - 30} textAnchor="start" fontSize="9" fontWeight="800" fill="#7f1d1d">−</text>
                  <text x={colX(LED_ANODE_COL) - 8} y={ROW_Y_UPPER[0]! - 30} textAnchor="end" fontSize="9" fontWeight="800" fill="#15803d">+</text>
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
            {/* Blaues Kabel A: LED-Kathode (Spalte 22, Reihe a) → Minus-Schiene unten */}
            <Wire
              color="#3b82f6"
              darkColor="#1d4ed8"
              path={`M ${colX(LED_CATHODE_COL)} ${ROW_Y_UPPER[0]!}
                     L ${colX(LED_CATHODE_COL)} ${ROW_Y_UPPER[0]! - 56}
                     L ${colX(LED_CATHODE_COL) + 70} ${ROW_Y_UPPER[0]! - 56}
                     L ${colX(LED_CATHODE_COL) + 70} ${MINUS_RAIL_Y + 7}`}
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

        {/* Optional: Build-Stage-Pulsierende Highlights */}
        {buildStage === 1 && (
          <g>
            <circle cx={colX(RES_LEFT_COL)} cy={ROW_Y_UPPER[0]!} r="9" fill="#fbbf24" fillOpacity="0.5">
              <animate attributeName="r" values="7;13;7" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={colX(RES_RIGHT_COL)} cy={ROW_Y_UPPER[0]!} r="9" fill="#fbbf24" fillOpacity="0.5">
              <animate attributeName="r" values="7;13;7" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
        {buildStage === 2 && (
          <g>
            <circle cx={colX(LED_ANODE_COL)} cy={ROW_Y_UPPER[0]!} r="9" fill="#fbbf24" fillOpacity="0.5">
              <animate attributeName="r" values="7;13;7" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={colX(LED_CATHODE_COL)} cy={ROW_Y_UPPER[0]!} r="9" fill="#fbbf24" fillOpacity="0.5">
              <animate attributeName="r" values="7;13;7" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}
      </svg>
    </div>
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
