"use client";

import { cn } from "@/lib/utils";

interface BreadboardProps {
  ledOn?: boolean;
  ledColor?: "red" | "green" | "yellow" | "blue";
  ledAnimation?: "blink" | "solid" | "fade" | "pulse" | "off";
  highlightWires?: ("3v3" | "gnd" | "signal")[];
  /**
   * Aufbau-Stufe für Schritt-für-Schritt-Diagramme.
   * 1 = nur Widerstand neu, LED + GND-Kabel ausgegraut
   * 2 = + LED neu, GND-Kabel ausgegraut
   * 3 = + GND-Kabel neu (alles eingebaut)
   * "all" = alles voll sichtbar (Default — z.B. für Simulator)
   */
  buildStage?: 1 | 2 | 3 | "all";
  /**
   * Erklär-Modus: zeigt zusätzliche Beschriftungen für die Strom-Schienen
   * (rote Schiene = +, blaue Schiene = −) sowie eine markierte „verbundene
   * Reihe", damit Anfänger die Brett-Logik visuell verstehen.
   */
  explainerMode?: boolean;
  className?: string;
}

const COLOR_MAP: Record<string, { core: string; glow: string }> = {
  red: { core: "#ef4444", glow: "#fca5a5" },
  green: { core: "#10b981", glow: "#6ee7b7" },
  yellow: { core: "#eab308", glow: "#fde68a" },
  blue: { core: "#3b82f6", glow: "#93c5fd" },
};

const NUM_COLS = 14;
const COL_X0 = 60;
const COL_DX = 22;
// Y-Positionen der oberen 5-Loch-Spalte (Reihen a..e)
const UPPER_ROWS_Y = [110, 124, 138, 152, 166];
// Y-Positionen der unteren 5-Loch-Spalte (Reihen f..j)
const LOWER_ROWS_Y = [196, 210, 224, 238, 252];
// Spalten- und Reihenlabels nach Steckbrett-Konvention
const COL_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14"];

/**
 * Steckbrett-Visualisierung. Eigene SVG — kein externes Embed.
 * Größer, mit echten Reihen-/Spalten-Beschriftungen damit ein Anfänger
 * Anweisungen wie „Reihe 5, Spalte e" tatsächlich befolgen kann.
 */
export function Breadboard({
  ledOn = false,
  ledColor = "red",
  ledAnimation = "off",
  highlightWires = [],
  buildStage = "all",
  explainerMode = false,
  className,
}: BreadboardProps) {
  const led = COLOR_MAP[ledColor]!;
  const isOn = ledOn && ledAnimation !== "off";

  type Vis = "active" | "dim" | "full";
  const vis: { resistor: Vis; led: Vis; wireGnd: Vis; wireSignal: Vis } =
    buildStage === "all"
      ? { resistor: "full", led: "full", wireGnd: "full", wireSignal: "full" }
      : buildStage === 1
        ? { resistor: "active", led: "dim", wireGnd: "dim", wireSignal: "active" }
        : buildStage === 2
          ? { resistor: "full", led: "active", wireGnd: "dim", wireSignal: "full" }
          : { resistor: "full", led: "full", wireGnd: "active", wireSignal: "full" };

  const dimOpacity = (v: Vis): number => (v === "dim" ? 0.15 : 1);
  const isActive = (v: Vis): boolean => v === "active";

  // Position-Helper: Reihen/Spalten → X/Y
  const colX = (col: number) => COL_X0 + col * COL_DX;

  // Ziel-Lochkoordinaten für die Beispielschaltung (Spalte 0 = links)
  // GPIO2 → Widerstand: linkes Bein in Spalte 4, rechtes Bein in Spalte 7
  const resLeftCol = 4;
  const resRightCol = 7;
  // LED: Anode (lang, Plus) in derselben Spalte wie rechtes Resistor-Bein,
  // Kathode (kurz, Minus) in Spalte 9, unten-rechts in Minus-Schiene
  const ledAnodeCol = resRightCol;
  const ledCathodeCol = 9;

  return (
    <div className={cn("relative mx-auto w-full max-w-2xl", className)}>
      <svg
        viewBox="0 0 480 320"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="Schaltung auf dem Steckbrett"
      >
        <defs>
          <radialGradient id="ledGlow">
            <stop offset="0%" stopColor={led.glow} stopOpacity={isOn ? 0.9 : 0} />
            <stop offset="100%" stopColor={led.glow} stopOpacity={0} />
          </radialGradient>
          {ledAnimation === "blink" && (
            <style>{`@keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }`}</style>
          )}
          {ledAnimation === "fade" && (
            <style>{`@keyframes fade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }`}</style>
          )}
          {ledAnimation === "pulse" && (
            <style>{`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }`}</style>
          )}
          <style>{`@keyframes blinkRow { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.55; } }`}</style>
        </defs>

        {/* Steckbrett-Körper */}
        <rect x="14" y="60" width="452" height="240" rx="10" fill="#fef9e7" stroke="#facc15" strokeWidth="1.5" />

        {/* Power-Rails — sichtbarer Streifen + Plus/Minus-Beschriftung */}
        <rect x="22" y="68" width="436" height="14" rx="3" fill="#fee2e2" />
        <line x1="22" y1="75" x2="458" y2="75" stroke="#dc2626" strokeWidth="1.5" />
        <text x="18" y="80" textAnchor="end" fontSize="14" fontWeight="800" fill="#dc2626">
          +
        </text>
        <text x="462" y="80" textAnchor="start" fontSize="14" fontWeight="800" fill="#dc2626">
          +
        </text>
        {explainerMode && (
          <text x="240" y="58" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">
            Plus-Schiene (rot) — über das ganze Brett verbunden
          </text>
        )}

        <rect x="22" y="278" width="436" height="14" rx="3" fill="#dbeafe" />
        <line x1="22" y1="285" x2="458" y2="285" stroke="#2563eb" strokeWidth="1.5" />
        <text x="18" y="290" textAnchor="end" fontSize="14" fontWeight="800" fill="#2563eb">
          −
        </text>
        <text x="462" y="290" textAnchor="start" fontSize="14" fontWeight="800" fill="#2563eb">
          −
        </text>
        {explainerMode && (
          <text x="240" y="306" textAnchor="middle" fontSize="11" fontWeight="700" fill="#2563eb">
            Minus-Schiene (blau) — über das ganze Brett verbunden
          </text>
        )}

        {/* Power-Rail-Punkte */}
        {Array.from({ length: NUM_COLS }).map((_, col) => (
          <g key={`pwr-${col}`}>
            <circle cx={colX(col)} cy={75} r={2.2} fill="#fca5a5" />
            <circle cx={colX(col)} cy={285} r={2.2} fill="#93c5fd" />
          </g>
        ))}

        {/* Mitten-Trennstreifen */}
        <line x1="22" y1="181" x2="458" y2="181" stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Erklär-Modus: Reihe Hervorhebung + Beschriftung */}
        {explainerMode && (
          <>
            {/* eine vertikale Reihe gelb hinterlegen — die „verbundene Reihe" */}
            <rect
              x={colX(5) - 9}
              y={100}
              width={18}
              height={75}
              rx={3}
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
            </rect>
            <text x={colX(5)} y="92" textAnchor="middle" fontSize="11" fontWeight="800" fill="#b45309">
              eine Reihe
            </text>
            <text x={colX(5)} y="103" textAnchor="middle" fontSize="9" fontWeight="600" fill="#b45309">
              (alle 5 Löcher verbunden)
            </text>
          </>
        )}

        {/* Reihen-Labels links (a..e oben, f..j unten) */}
        {["a", "b", "c", "d", "e"].map((r, i) => (
          <text
            key={`row-l-up-${r}`}
            x="40"
            y={UPPER_ROWS_Y[i]! + 4}
            textAnchor="end"
            fontSize="9"
            fontWeight="600"
            fill="#a16207"
          >
            {r}
          </text>
        ))}
        {["f", "g", "h", "i", "j"].map((r, i) => (
          <text
            key={`row-l-dn-${r}`}
            x="40"
            y={LOWER_ROWS_Y[i]! + 4}
            textAnchor="end"
            fontSize="9"
            fontWeight="600"
            fill="#a16207"
          >
            {r}
          </text>
        ))}

        {/* Spalten-Labels oben */}
        {COL_LABELS.map((c, i) => (
          <text
            key={`col-${c}`}
            x={colX(i)}
            y="100"
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#a16207"
          >
            {c}
          </text>
        ))}

        {/* Pin-Grid (5×2 Hälften) */}
        {Array.from({ length: NUM_COLS }).map((_, col) => (
          <g key={`grid-${col}`}>
            {UPPER_ROWS_Y.map((y) => (
              <circle key={`u-${col}-${y}`} cx={colX(col)} cy={y} r="3.5" fill="#9ca3af" />
            ))}
            {LOWER_ROWS_Y.map((y) => (
              <circle key={`d-${col}-${y}`} cx={colX(col)} cy={y} r="3.5" fill="#9ca3af" />
            ))}
          </g>
        ))}

        {/* ESP32-Block (Breadboard-vereinfacht links) — mit Pin-Labels */}
        <g>
          <rect x="14" y="105" width="0" height="0" />
          {/* (Optional: kein zweites Board hier — der ESP32 wird per Pin-Visualisierung separat erklärt.
             Wir zeigen nur die ESP32-Pin-Stummel von links, damit die Verkabelung erklärt werden kann.) */}
        </g>

        {/* ESP32 (dunkles Modul links) */}
        <rect x="14" y="105" width="40" height="160" rx="3" fill="#0b0f19" stroke="#1f2937" strokeWidth="1" />
        <text x="34" y="180" textAnchor="middle" fontSize="9" fontWeight="700" fill="#cbd5e1">
          ESP32
        </text>
        <text x="34" y="195" textAnchor="middle" fontSize="6" fill="#94a3b8">
          DevKit
        </text>
        {/* Pin-Labels am ESP32-Block (rechte Kante) */}
        <text x="50" y={UPPER_ROWS_Y[2]! + 3} textAnchor="end" fontSize="8" fontWeight="700" fill="#86efac">
          GPIO2
        </text>
        <text x="50" y={LOWER_ROWS_Y[3]! + 3} textAnchor="end" fontSize="8" fontWeight="700" fill="#93c5fd">
          GND
        </text>
        <text x="50" y={UPPER_ROWS_Y[0]! + 3} textAnchor="end" fontSize="8" fontWeight="700" fill="#fca5a5">
          3V3
        </text>

        {/* Signal-Kabel: GPIO2 → Loch (Spalte resLeftCol, Reihe c) */}
        <path
          d={`M 54 ${UPPER_ROWS_Y[2]} Q ${colX(2)} ${UPPER_ROWS_Y[2]! - 6} ${colX(resLeftCol)} ${UPPER_ROWS_Y[2]}`}
          fill="none"
          stroke={highlightWires.includes("signal") || isActive(vis.wireSignal) ? "#22c55e" : "#16a34a"}
          strokeWidth={highlightWires.includes("signal") || isActive(vis.wireSignal) ? "3.5" : "2.4"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireSignal)}
        />
        {explainerMode === false && isActive(vis.wireSignal) && (
          <text x={colX(2)} y={UPPER_ROWS_Y[2]! - 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="#15803d">
            grünes Kabel
          </text>
        )}

        {/* Widerstand 220Ω — waagerecht über die Mitte */}
        <g
          transform={`translate(${(colX(resLeftCol) + colX(resRightCol)) / 2}, ${UPPER_ROWS_Y[2]})`}
          opacity={dimOpacity(vis.resistor)}
        >
          {isActive(vis.resistor) && (
            <rect
              x="-44"
              y="-22"
              width="88"
              height="42"
              rx="6"
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
            </rect>
          )}
          {/* Beinchen */}
          <line x1="-34" y1="0" x2="-22" y2="0" stroke="#9ca3af" strokeWidth="1.6" />
          <line x1="22" y1="0" x2="34" y2="0" stroke="#9ca3af" strokeWidth="1.6" />
          {/* Körper */}
          <rect x="-22" y="-6" width="44" height="12" rx="2" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
          <rect x="-14" y="-6" width="3" height="12" fill="#dc2626" />
          <rect x="-8" y="-6" width="3" height="12" fill="#dc2626" />
          <rect x="-2" y="-6" width="3" height="12" fill="#a16207" />
          <text x="0" y="-12" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7c2d12">
            220 Ω
          </text>
        </g>

        {/* LED rechts vom Widerstand — Anode in derselben Reihe wie rechtes Widerstands-Bein,
            Kathode in Spalte ledCathodeCol (Reihe a oben), GND-Kabel von dort runter */}
        <g
          transform={`translate(${(colX(ledAnodeCol) + colX(ledCathodeCol)) / 2}, ${UPPER_ROWS_Y[2]! - 26})`}
          opacity={dimOpacity(vis.led)}
        >
          {isActive(vis.led) && (
            <rect
              x="-28"
              y="-10"
              width="56"
              height="50"
              rx="6"
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
            </rect>
          )}
          {/* Glow */}
          <circle cx="0" cy="10" r="22" fill="url(#ledGlow)" />
          {/* Kuppe */}
          <circle
            cx="0"
            cy="10"
            r="8"
            fill={isOn ? led.core : "#cbd5e1"}
            stroke="#1f2937"
            strokeWidth="1"
            style={
              ledAnimation === "blink"
                ? { animation: "blink 1s infinite", transformOrigin: "center" }
                : ledAnimation === "fade"
                  ? { animation: "fade 2s infinite", transformOrigin: "center" }
                  : ledAnimation === "pulse"
                    ? { animation: "pulse 1.2s infinite ease-in-out", transformOrigin: "center" }
                    : undefined
            }
          />
          {/* Beinchen — länger = + (Anode), kürzer = − (Kathode) */}
          <line x1="-3" y1="18" x2="-3" y2="34" stroke="#9ca3af" strokeWidth="1.6" />
          <line x1="3" y1="18" x2="3" y2="30" stroke="#9ca3af" strokeWidth="1.6" />
          {/* Plus/Minus-Marker */}
          <text x="-12" y="34" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f766e">
            +
          </text>
          <text x="12" y="34" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7f1d1d">
            −
          </text>
          <text x="0" y="-4" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1f2937">
            LED
          </text>
        </g>

        {/* GND-Kabel: von Kathoden-Loch (Spalte ledCathodeCol, Reihe a) runter in Minus-Schiene unten,
            zurück bis zum ESP32 GND-Pin */}
        <path
          d={`M ${colX(ledCathodeCol)} ${UPPER_ROWS_Y[0]}
              L ${colX(ledCathodeCol)} ${285}
              L 54 ${285}
              L 54 ${LOWER_ROWS_Y[3]}`}
          fill="none"
          stroke={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "#3b82f6" : "#2563eb"}
          strokeWidth={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "3.5" : "2.4"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireGnd)}
        />
        {isActive(vis.wireGnd) && (
          <text x={colX(ledCathodeCol) + 12} y={UPPER_ROWS_Y[0]! + 6} textAnchor="start" fontSize="9" fontWeight="700" fill="#1d4ed8">
            blaues Kabel
          </text>
        )}

        {/* Zielloch-Highlight in BUILD-Stufe 1: linkes Widerstands-Bein */}
        {isActive(vis.resistor) && (
          <>
            <circle cx={colX(resLeftCol)} cy={UPPER_ROWS_Y[2]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={colX(resLeftCol)} y={UPPER_ROWS_Y[2]! + 38} textAnchor="middle" fontSize="9" fontWeight="800" fill="#b45309">
              Reihe c · Spalte {COL_LABELS[resLeftCol]}
            </text>
          </>
        )}
        {/* Zielloch-Highlight in BUILD-Stufe 2: LED-Anode */}
        {isActive(vis.led) && (
          <>
            <circle cx={colX(ledAnodeCol)} cy={UPPER_ROWS_Y[2]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={colX(ledCathodeCol)} cy={UPPER_ROWS_Y[0]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        {/* Zielloch-Highlight in BUILD-Stufe 3: GND-Kabel auf Minus-Schiene */}
        {isActive(vis.wireGnd) && (
          <>
            <circle cx={colX(ledCathodeCol)} cy={285} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}
