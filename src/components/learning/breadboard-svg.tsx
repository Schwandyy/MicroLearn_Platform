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
   * Erklär-Modus: markiert eine kurze Spalte als „verbunden", zeigt
   * Pin-Position-Labels (3V3, GPIO 2, GND) und blendet die Schaltung
   * (Widerstand/LED/Kabel) AUS — der Schüler soll erst die Brett-Logik
   * verstehen, bevor Bauteile dazukommen.
   */
  explainerMode?: boolean;
  /**
   * `false` = Schaltbestandteile (Widerstand, LED, Kabel) werden NICHT
   * gerendert. Default `true`. EXPLAIN-Steps setzen das auf false.
   */
  showCircuit?: boolean;
  className?: string;
}

const COLOR_MAP: Record<string, { core: string; glow: string }> = {
  red: { core: "#ef4444", glow: "#fca5a5" },
  green: { core: "#10b981", glow: "#6ee7b7" },
  yellow: { core: "#eab308", glow: "#fde68a" },
  blue: { core: "#3b82f6", glow: "#93c5fd" },
};

// 16 sichtbare Spalten — genug Platz, um den 30-Pin-ESP32 (15 Pins lang) +
// Widerstand + LED nebeneinander zu zeigen.
const NUM_COLS = 16;
const COL_X0 = 60;
const COL_DX = 26;
// 5 obere Reihen (a..e) und 5 untere (f..j), dazwischen die Mittelrille.
// Der ESP32 sitzt mit seinen 2 Pin-Reihen genau auf Reihe e (linke Seite)
// und Reihe f (rechte Seite) und überspannt die Mittelrille.
const UPPER_ROWS_Y = [105, 119, 133, 147, 161]; // a, b, c, d, e
const LOWER_ROWS_Y = [193, 207, 221, 235, 249]; // f, g, h, i, j
const CHANNEL_Y = 177;
const ROW_LETTERS_UPPER = ["a", "b", "c", "d", "e"];
const ROW_LETTERS_LOWER = ["f", "g", "h", "i", "j"];
const COL_LABELS = Array.from({ length: NUM_COLS }, (_, i) => String(i + 1));

// ESP32 belegt Spalten 1–15 (Index 0–14). USB-Seite oben (Spalte 1).
const ESP_FIRST_COL = 0;
const ESP_LAST_COL = 14;
// Pins, die wir für die Blink-Lesson brauchen — Position auf der ESP32-Karte:
// Linke Seite (Reihe e, also obere Hälfte): 3V3 in Spalte 1, GND in Spalte 14, GPIO 2 in Spalte 4
// (vereinfacht — auf echten Boards liegt GPIO 2 typischerweise rechts; didaktisch
// sortieren wir die wichtigen Pins so, dass die Verkabelung kreuzungsfrei bleibt).
const PIN_3V3_COL = 0;   // -> Label "1"
const PIN_GPIO2_COL = 3; // -> Label "4"
const PIN_GND_COL = 13;  // -> Label "14"

/**
 * Steckbrett-Visualisierung — ESP32 sitzt MIT seinen Pins IN der Breadboard-
 * Mittelrille, wie es ein echtes Tutorial zeigt. So sind alle Verbindungen
 * standardmäßig M2M (Stecker-Stecker) — keine M2F-Kabel nötig.
 */
export function Breadboard({
  ledOn = false,
  ledColor = "red",
  ledAnimation = "off",
  highlightWires = [],
  buildStage = "all",
  explainerMode = false,
  showCircuit,
  className,
}: BreadboardProps) {
  // EXPLAIN-Modus blendet die Schaltung defaultmäßig aus — User soll erst
  // die Breadboard-Logik verstehen, nicht durch Bauteile abgelenkt werden.
  const renderCircuit = showCircuit ?? !explainerMode;
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

  const colX = (col: number) => COL_X0 + col * COL_DX;

  // Verkabelungs-Positionen (Schaltbild der Blink-Lesson):
  // Widerstand: liegt waagerecht in Reihe a, zwischen Spalte 5 und Spalte 8
  //             (Spaltenindex 4 und 7). Damit ist genug Abstand für die
  //             Widerstands-Beine ohne übermäßiges Biegen, aber kurz genug
  //             dass es noch sauber aussieht.
  // LED:        Anode (langes Bein, +) in Spalte 8 (gleiche Spalte wie rechtes
  //             Widerstandsbein), Kathode (kurz, −) in Spalte 9. LED steht
  //             aufrecht und überspannt eine Spalte.
  // Grünes Kabel: GPIO 2 (Spalte 4) → linkes Widerstandsbein (Spalte 5),
  //               beide in der oberen Hälfte (Reihe a).
  // Blaues Kabel A: LED-Kathode (Spalte 9, Reihe a) → Minus-Schiene unten.
  // Blaues Kabel B: GND-Pin des ESP32 ist Spalte 14 — wir nehmen ein freies
  //                 Loch derselben Spalte in der unteren Hälfte (Reihe j) und
  //                 ziehen daran das Kabel zur Minus-Schiene.
  const resLeftCol = 4; // Label "5"
  const resRightCol = 7; // Label "8"
  const ledAnodeCol = resRightCol; // gleiche Spalte wie rechtes Widerstandsbein
  const ledCathodeCol = 8; // Label "9"

  const totalWidth = COL_X0 + NUM_COLS * COL_DX + 40;
  const totalHeight = 290;

  return (
    <div className={cn("relative mx-auto w-full max-w-3xl", className)}>
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="Schaltung auf dem Steckbrett mit eingestecktem ESP32"
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
        </defs>

        {/* Steckbrett-Korpus */}
        <rect x="14" y="60" width={totalWidth - 28} height="220" rx="10" fill="#fef9e7" stroke="#facc15" strokeWidth="1.5" />

        {/* Plus-Schiene (rot) — Beschriftung nur an den Rändern, damit
            sie nicht mit den Bauteilen in der Mitte kollidiert. */}
        <rect x="22" y="68" width={totalWidth - 44} height="14" rx="3" fill="#fee2e2" />
        <line x1="22" y1="75" x2={totalWidth - 22} y2="75" stroke="#dc2626" strokeWidth="1.5" />
        <text x="16" y="79" textAnchor="end" fontSize="14" fontWeight="800" fill="#dc2626">+</text>
        <text x={totalWidth - 16} y="79" textAnchor="start" fontSize="14" fontWeight="800" fill="#dc2626">+</text>
        {explainerMode && (
          <>
            <text x="48" y="79" textAnchor="start" fontSize="8" fontWeight="700" fill="#dc2626" letterSpacing="0.5">
              Plus
            </text>
            <text x={totalWidth - 48} y="79" textAnchor="end" fontSize="8" fontWeight="700" fill="#dc2626" letterSpacing="0.5">
              Plus
            </text>
          </>
        )}

        {/* Minus-Schiene (blau) */}
        <rect x="22" y="258" width={totalWidth - 44} height="14" rx="3" fill="#dbeafe" />
        <line x1="22" y1="265" x2={totalWidth - 22} y2="265" stroke="#2563eb" strokeWidth="1.5" />
        <text x="16" y="269" textAnchor="end" fontSize="14" fontWeight="800" fill="#2563eb">−</text>
        <text x={totalWidth - 16} y="269" textAnchor="start" fontSize="14" fontWeight="800" fill="#2563eb">−</text>
        {explainerMode && (
          <>
            <text x="48" y="269" textAnchor="start" fontSize="8" fontWeight="700" fill="#2563eb" letterSpacing="0.5">
              Minus
            </text>
            <text x={totalWidth - 48} y="269" textAnchor="end" fontSize="8" fontWeight="700" fill="#2563eb" letterSpacing="0.5">
              Minus
            </text>
          </>
        )}

        {/* Punkte der Plus-/Minus-Schienen */}
        {Array.from({ length: NUM_COLS }).map((_, col) => (
          <g key={`pwr-${col}`}>
            <circle cx={colX(col)} cy={75} r={2.2} fill="#fca5a5" />
            <circle cx={colX(col)} cy={265} r={2.2} fill="#93c5fd" />
          </g>
        ))}

        {/* Mittelrille (Kanal) — die nimmt der ESP32 ein */}
        <line x1="22" y1={CHANNEL_Y} x2={totalWidth - 22} y2={CHANNEL_Y} stroke="#fbbf24" strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Reihen-Labels (a..j) am linken Rand */}
        {ROW_LETTERS_UPPER.map((r, i) => (
          <text
            key={`row-u-${r}`}
            x="40"
            y={UPPER_ROWS_Y[i]! + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="700"
            fill="#a16207"
          >
            {r}
          </text>
        ))}
        {ROW_LETTERS_LOWER.map((r, i) => (
          <text
            key={`row-d-${r}`}
            x="40"
            y={LOWER_ROWS_Y[i]! + 4}
            textAnchor="end"
            fontSize="10"
            fontWeight="700"
            fill="#a16207"
          >
            {r}
          </text>
        ))}

        {/* Spalten-Labels oben (über der oberen Loch-Reihe) */}
        {COL_LABELS.map((c, i) => (
          <text
            key={`col-${c}`}
            x={colX(i)}
            y="96"
            textAnchor="middle"
            fontSize="10"
            fontWeight="700"
            fill="#a16207"
          >
            {c}
          </text>
        ))}

        {/* Loch-Raster (5×2 Hälften) */}
        {Array.from({ length: NUM_COLS }).map((_, col) => (
          <g key={`grid-${col}`}>
            {UPPER_ROWS_Y.map((y, ri) => (
              <circle
                key={`u-${col}-${ri}`}
                cx={colX(col)}
                cy={y}
                r="3.5"
                fill="#9ca3af"
              />
            ))}
            {LOWER_ROWS_Y.map((y, ri) => (
              <circle
                key={`d-${col}-${ri}`}
                cx={colX(col)}
                cy={y}
                r="3.5"
                fill="#9ca3af"
              />
            ))}
          </g>
        ))}

        {/* ====== ESP32 IM Breadboard — über die Mittelrille ====== */}
        {/* Der ESP32-PCB-Korpus liegt OBEN auf den Pins (verdeckt Reihen e + f). */}
        <g>
          {/* USB-Stecker links/oben (am Schmalende) */}
          <rect
            x={colX(ESP_FIRST_COL) - 14}
            y={CHANNEL_Y - 14}
            width="14"
            height="28"
            rx="2"
            fill="#9ca3af"
            stroke="#4b5563"
            strokeWidth="1"
          />
          <text
            x={colX(ESP_FIRST_COL) - 7}
            y={CHANNEL_Y + 24}
            textAnchor="middle"
            fontSize="8"
            fontWeight="700"
            fill="#64748b"
          >
            USB
          </text>

          {/* PCB-Korpus des ESP32 (dunkel) — überspannt Reihen e + f */}
          <rect
            x={colX(ESP_FIRST_COL) - 7}
            y={UPPER_ROWS_Y[4]! - 6}
            width={colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) + 14}
            height={LOWER_ROWS_Y[0]! - UPPER_ROWS_Y[4]! + 12}
            rx="3"
            fill="#0b0f19"
            stroke="#1f2937"
            strokeWidth="1.2"
          />
          {/* Silberner ESP-WROOM-32-Block (Antennen-Mäander angedeutet) */}
          <rect
            x={colX(ESP_FIRST_COL) + 6}
            y={CHANNEL_Y - 10}
            width={colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) - 12}
            height="20"
            rx="2"
            fill="#d1d5db"
            stroke="#6b7280"
            strokeWidth="0.6"
          />
          <text
            x={(colX(ESP_FIRST_COL) + colX(ESP_LAST_COL)) / 2}
            y={CHANNEL_Y + 2}
            textAnchor="middle"
            fontSize="8"
            fontWeight="800"
            fill="#0b0f19"
            fontFamily="ui-monospace,monospace"
            letterSpacing="0.5"
          >
            ESP32-WROOM-32
          </text>
        </g>

        {/* Pin-Position-Hinweise — nur im EXPLAIN-Modus, damit BUILD-Steps
            nicht durch sich überlagernde Beschriftungen unleserlich werden.
            In BUILD/SIMULATE führt der Body-Text + Highlight zu den richtigen
            Spalten; mehr Labels verwirren mehr als sie helfen. */}
        {explainerMode && (
          <g>
            {/* 3V3 — kleines Label unten am ESP32-Body bei Spalte 1 */}
            <g>
              <line
                x1={colX(PIN_3V3_COL)}
                y1={CHANNEL_Y - 6}
                x2={colX(PIN_3V3_COL)}
                y2={CHANNEL_Y + 6}
                stroke="#fca5a5"
                strokeWidth="1.4"
              />
              <text
                x={colX(PIN_3V3_COL)}
                y={LOWER_ROWS_Y[0]! + 18}
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="#dc2626"
                fontFamily="ui-monospace,monospace"
              >
                3V3
              </text>
            </g>
            {/* GPIO 2 — kleines Label unten am ESP32-Body bei Spalte 4 */}
            <g>
              <line
                x1={colX(PIN_GPIO2_COL)}
                y1={CHANNEL_Y - 6}
                x2={colX(PIN_GPIO2_COL)}
                y2={CHANNEL_Y + 6}
                stroke="#86efac"
                strokeWidth="1.4"
              />
              <text
                x={colX(PIN_GPIO2_COL)}
                y={LOWER_ROWS_Y[0]! + 18}
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="#15803d"
                fontFamily="ui-monospace,monospace"
              >
                GPIO 2
              </text>
            </g>
            {/* GND — kleines Label unten am ESP32-Body bei Spalte 14 */}
            <g>
              <line
                x1={colX(PIN_GND_COL)}
                y1={CHANNEL_Y - 6}
                x2={colX(PIN_GND_COL)}
                y2={CHANNEL_Y + 6}
                stroke="#93c5fd"
                strokeWidth="1.4"
              />
              <text
                x={colX(PIN_GND_COL)}
                y={LOWER_ROWS_Y[0]! + 18}
                textAnchor="middle"
                fontSize="9"
                fontWeight="800"
                fill="#1d4ed8"
                fontFamily="ui-monospace,monospace"
              >
                GND
              </text>
            </g>
          </g>
        )}

        {/* Erklär-Modus: eine kurze 5-Loch-Spalte visuell hervorheben */}
        {explainerMode && (
          <g>
            <rect
              x={colX(2) - 9}
              y={UPPER_ROWS_Y[0]! - 6}
              width="18"
              height={UPPER_ROWS_Y[3]! - UPPER_ROWS_Y[0]! + 12}
              rx="3"
              fill="#fde68a"
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
            </rect>
            <text x={colX(2)} y={UPPER_ROWS_Y[0]! - 12} textAnchor="middle" fontSize="9" fontWeight="800" fill="#b45309">
              eine kurze Spalte
            </text>
            <text x={colX(2)} y={UPPER_ROWS_Y[3]! + 16} textAnchor="middle" fontSize="8" fontWeight="600" fill="#b45309">
              4 Löcher sind verbunden
            </text>
          </g>
        )}

        {/* ====== Verkabelung + Bauteile — nur wenn renderCircuit=true ====== */}
        {renderCircuit && (
          <>

        {/* Grünes Signal-Kabel: Spalte 4 Reihe a (= GPIO 2) → Spalte 5 Reihe a (linkes Widerstandsbein) */}
        <path
          d={`M ${colX(PIN_GPIO2_COL)} ${UPPER_ROWS_Y[0]} Q ${(colX(PIN_GPIO2_COL) + colX(resLeftCol)) / 2} ${UPPER_ROWS_Y[0]! - 14} ${colX(resLeftCol)} ${UPPER_ROWS_Y[0]}`}
          fill="none"
          stroke={highlightWires.includes("signal") || isActive(vis.wireSignal) ? "#22c55e" : "#16a34a"}
          strokeWidth={highlightWires.includes("signal") || isActive(vis.wireSignal) ? "3.5" : "2.6"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireSignal)}
        />
        {isActive(vis.wireSignal) && (
          <text
            x={(colX(PIN_GPIO2_COL) + colX(resLeftCol)) / 2}
            y={UPPER_ROWS_Y[0]! - 20}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill="#15803d"
          >
            grünes M2M-Kabel
          </text>
        )}

        {/* Widerstand 220 Ω — waagerecht in Reihe a, Spalte 5 → 8 */}
        <g
          transform={`translate(${(colX(resLeftCol) + colX(resRightCol)) / 2}, ${UPPER_ROWS_Y[0]})`}
          opacity={dimOpacity(vis.resistor)}
        >
          {isActive(vis.resistor) && (
            <rect
              x="-46"
              y="-22"
              width="92"
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
          {/* Beinchen (Drähte) — sichtbar gebogen */}
          <path d="M -38 0 L -28 -3 L -22 -3" fill="none" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M 38 0 L 28 -3 L 22 -3" fill="none" stroke="#9ca3af" strokeWidth="1.6" strokeLinecap="round" />
          {/* Körper */}
          <rect x="-22" y="-9" width="44" height="12" rx="2" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
          {/* Farbringe — 220 Ω = rot-rot-braun */}
          <rect x="-15" y="-9" width="3" height="12" fill="#dc2626" />
          <rect x="-9" y="-9" width="3" height="12" fill="#dc2626" />
          <rect x="-3" y="-9" width="3" height="12" fill="#a16207" />
          <text x="0" y="-15" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7c2d12">
            220 Ω
          </text>
        </g>

        {/* LED — Anode (Spalte 8, gleich wie rechtes Widerstandsbein), Kathode (Spalte 9) */}
        <g
          transform={`translate(${(colX(ledAnodeCol) + colX(ledCathodeCol)) / 2}, ${UPPER_ROWS_Y[0]! - 22})`}
          opacity={dimOpacity(vis.led)}
        >
          {isActive(vis.led) && (
            <rect
              x="-22"
              y="-12"
              width="44"
              height="48"
              rx="6"
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
            </rect>
          )}
          <circle cx="0" cy="10" r="22" fill="url(#ledGlow)" />
          <circle
            cx="0"
            cy="10"
            r="9"
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
          {/* Beinchen — langes (links, Anode/+) und kurzes (rechts, Kathode/−) */}
          <line x1="-6" y1="18" x2="-6" y2="36" stroke="#9ca3af" strokeWidth="1.6" />
          <line x1="6" y1="18" x2="6" y2="32" stroke="#9ca3af" strokeWidth="1.6" />
          <text x="-13" y="38" textAnchor="middle" fontSize="9" fontWeight="800" fill="#0f766e">+</text>
          <text x="13" y="38" textAnchor="middle" fontSize="9" fontWeight="800" fill="#7f1d1d">−</text>
          <text x="0" y="-5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1f2937">LED</text>
        </g>

        {/* Blaues Kabel A: LED-Kathode (Spalte 9, Reihe a) → Minus-Schiene (unten) */}
        <path
          d={`M ${colX(ledCathodeCol)} ${UPPER_ROWS_Y[0]}
              L ${colX(ledCathodeCol)} 265`}
          fill="none"
          stroke={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "#3b82f6" : "#2563eb"}
          strokeWidth={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "3.5" : "2.6"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireGnd)}
        />
        {/* Blaues Kabel B: GND-Spalte (14) untere Hälfte Reihe j → Minus-Schiene */}
        <path
          d={`M ${colX(PIN_GND_COL)} ${LOWER_ROWS_Y[4]}
              L ${colX(PIN_GND_COL)} 265`}
          fill="none"
          stroke={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "#3b82f6" : "#2563eb"}
          strokeWidth={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "3.5" : "2.6"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireGnd)}
        />
        {isActive(vis.wireGnd) && (
          <>
            <text
              x={colX(ledCathodeCol) + 14}
              y={(UPPER_ROWS_Y[0]! + 265) / 2}
              textAnchor="start"
              fontSize="9"
              fontWeight="700"
              fill="#1d4ed8"
            >
              Kabel A (blau)
            </text>
            <text
              x={colX(PIN_GND_COL) - 14}
              y={(LOWER_ROWS_Y[4]! + 265) / 2 + 4}
              textAnchor="end"
              fontSize="9"
              fontWeight="700"
              fill="#1d4ed8"
            >
              Kabel B (blau)
            </text>
          </>
        )}

        {/* Pulsierender Highlight an „aktiven" Ziellöchern für jeden Build-Schritt */}
        {isActive(vis.resistor) && (
          <>
            <circle cx={colX(resLeftCol)} cy={UPPER_ROWS_Y[0]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={colX(resRightCol)} cy={UPPER_ROWS_Y[0]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <text x={(colX(resLeftCol) + colX(resRightCol)) / 2} y={UPPER_ROWS_Y[0]! + 36} textAnchor="middle" fontSize="10" fontWeight="800" fill="#b45309">
              Reihe a · Spalte {COL_LABELS[resLeftCol]} → Spalte {COL_LABELS[resRightCol]}
            </text>
          </>
        )}
        {isActive(vis.led) && (
          <>
            <circle cx={colX(ledAnodeCol)} cy={UPPER_ROWS_Y[0]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={colX(ledCathodeCol)} cy={UPPER_ROWS_Y[0]} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </>
        )}
        {isActive(vis.wireGnd) && (
          <>
            <circle cx={colX(ledCathodeCol)} cy={265} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={colX(PIN_GND_COL)} cy={265} r="8" fill="#fbbf24" fillOpacity="0.45">
              <animate attributeName="r" values="6;11;6" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </>
        )}
          </>
        )}
      </svg>
    </div>
  );
}
