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
  /**
   * `false` = ESP32 wird NICHT gerendert (leeres Brett). Default `true`.
   * Wird im EXPLAIN-Step „Was ist das Steckbrett?" auf false gesetzt,
   * damit der Schüler erst das Brett alleine sieht.
   */
  showEsp?: boolean;
  /**
   * `true` = zeigt den ESP32 NICHT eingesteckt, sondern SCHWEBEND über dem
   * Brett mit Pfeil nach unten — illustriert „so steckst du ihn rein".
   * Aktiviert automatisch `showEsp` (ESP wird gerendert) und das Brett ohne Schaltung.
   */
  showInsertHint?: boolean;
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
// Pin-Positionen wie auf einem echten ESP32-DevKit-V1 (USB nach links):
//   BOTTOM-Pinreihe (auf Brett-Reihe e):
//     3V3(1), GND(2), D15(3), D2(4), D4(5), RX2(6), TX2(7), D5(8),
//     D18(9), D19(10), D21(11), RX0(12), TX0(13), D22(14), D23(15)
//   TOP-Pinreihe (auf Brett-Reihe f):
//     VIN(1), GND(2), D13(3), D12(4), D14(5), D27(6), D26(7), D25(8),
//     D33(9), D32(10), D35(11), D34(12), VN(13), VP(14), EN(15)
// Für die Blink-Lesson nutzen wir 3V3-Pin (BOTTOM Spalte 1) und GPIO 2 = D2
// (BOTTOM Spalte 4). GND nehmen wir vom TOP-GND-Pin (TOP Spalte 2 = Brett-
// Reihe f Spalte 2) — kürzester Weg zur Minus-Schiene unten.
const PIN_3V3_COL = 0;   // Spalte 1, BOTTOM-Reihe (Brett Reihe e)
const PIN_GPIO2_COL = 3; // Spalte 4, BOTTOM-Reihe (Brett Reihe e)
const PIN_GND_COL = 1;   // Spalte 2, TOP-Reihe (Brett Reihe f)

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
  showEsp = true,
  showInsertHint = false,
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
  // Im Explainer-Mode reservieren wir oben + unten extra Platz, damit
  // Pin-Position-Callouts (3V3, GPIO 2 oben, GND unten) AUSSERHALB des
  // Brett-Korpus liegen und keine Reihen überdecken. Im Insert-Hint-Modus
  // brauchen wir oben noch mehr Platz für den schwebenden ESP.
  const padTop = showInsertHint ? 140 : explainerMode ? 70 : 0;
  const padBottom = explainerMode ? 70 : 0;
  const totalHeight = 290 + padTop + padBottom;

  return (
    <div className={cn("relative mx-auto w-full max-w-3xl", className)}>
      <svg
        viewBox={`0 ${-padTop} ${totalWidth} ${totalHeight}`}
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

        {/* Steckbrett-Korpus — weißes ABS wie ein echtes MB-102 */}
        <rect x="14" y="60" width={totalWidth - 28} height="220" rx="10" fill="#fafafa" stroke="#d1d5db" strokeWidth="1.5" />
        {/* Subtile Plastik-Textur */}
        <rect x="16" y="62" width={totalWidth - 32} height="216" rx="9" fill="none" stroke="#e5e7eb" strokeWidth="0.6" opacity="0.7" />

        {/* Plus-Schiene (rot) — Beschriftung nur an den Rändern, damit
            sie nicht mit den Bauteilen in der Mitte kollidiert. */}
        <rect x="22" y="68" width={totalWidth - 44} height="14" rx="3" fill="#fee2e2" />
        <line x1="22" y1="75" x2={totalWidth - 22} y2="75" stroke="#dc2626" strokeWidth="1.5" />
        <text x="16" y="79" textAnchor="end" fontSize="14" fontWeight="800" fill="#dc2626">+</text>
        <text x={totalWidth - 16} y="79" textAnchor="start" fontSize="14" fontWeight="800" fill="#dc2626">+</text>

        {/* Minus-Schiene (blau) */}
        <rect x="22" y="258" width={totalWidth - 44} height="14" rx="3" fill="#dbeafe" />
        <line x1="22" y1="265" x2={totalWidth - 22} y2="265" stroke="#2563eb" strokeWidth="1.5" />
        <text x="16" y="269" textAnchor="end" fontSize="14" fontWeight="800" fill="#2563eb">−</text>
        <text x={totalWidth - 16} y="269" textAnchor="start" fontSize="14" fontWeight="800" fill="#2563eb">−</text>

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

        {/* ====== ESP32 DevKit V1 — realistisch nachempfunden ======
            Im Insert-Hint-Modus zeigen wir den ESP schwebend ÜBER dem Brett
            (transform translate-Y nach oben) mit einem Pfeil nach unten — so
            visualisieren wir „so steckst du ihn rein". */}
        {showEsp && (() => {
          const bodyX = colX(ESP_FIRST_COL) - 10;
          const bodyY = UPPER_ROWS_Y[4]! - 13;
          const bodyW = colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) + 20;
          const bodyH = LOWER_ROWS_Y[0]! - UPPER_ROWS_Y[4]! + 26;
          // Linker Bereich = Spalten 1-6 (Buttons, USB, AMS1117, CP2102)
          // Rechter Bereich = Spalten 7-15 (ESP-WROOM-32 Modul)
          const wroomX = colX(6) - 3;
          const wroomY = bodyY + 5;
          const wroomW = colX(ESP_LAST_COL) - colX(6) + 6;
          const wroomH = bodyH - 10;
          const insertOffset = showInsertHint ? -110 : 0;
          return (
            <g transform={`translate(0, ${insertOffset})`} opacity={showInsertHint ? 0.92 : 1}>
              {/* PCB-Korpus — mattschwarz mit Silkscreen-Rand */}
              <rect
                x={bodyX}
                y={bodyY}
                width={bodyW}
                height={bodyH}
                rx="3"
                fill="#0a1018"
                stroke="#0f172a"
                strokeWidth="1.2"
              />
              {/* Silkscreen-Innenrand (heller Strich an PCB-Kante) */}
              <rect
                x={bodyX + 2}
                y={bodyY + 2}
                width={bodyW - 4}
                height={bodyH - 4}
                rx="2"
                fill="none"
                stroke="#475569"
                strokeWidth="0.3"
                opacity="0.6"
              />

              {/* USB-Mikro-Stecker — silbern, links außerhalb des PCB */}
              <rect
                x={bodyX - 12}
                y={CHANNEL_Y - 9}
                width="13"
                height="18"
                rx="1.5"
                fill="#9ca3af"
                stroke="#374151"
                strokeWidth="0.8"
              />
              <rect x={bodyX - 10} y={CHANNEL_Y - 6} width="9" height="12" rx="0.8" fill="#1f2937" />

              {/* EN-Button (oben links) und BOOT-Button (unten links) — kleine Tact-Switches */}
              <rect x={bodyX + 3} y={bodyY + 3} width="8" height="8" rx="1.2" fill="#1e293b" stroke="#475569" strokeWidth="0.4" />
              <circle cx={bodyX + 7} cy={bodyY + 7} r="2" fill="#0f172a" />
              <text x={bodyX + 7} y={bodyY + 18} textAnchor="middle" fontSize="3.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">EN</text>

              <rect x={bodyX + 3} y={bodyY + bodyH - 11} width="8" height="8" rx="1.2" fill="#1e293b" stroke="#475569" strokeWidth="0.4" />
              <circle cx={bodyX + 7} cy={bodyY + bodyH - 7} r="2" fill="#0f172a" />
              <text x={bodyX + 7} y={bodyY + bodyH - 14} textAnchor="middle" fontSize="3.5" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">BOOT</text>

              {/* AMS1117 Spannungsregler — kleines Rechteck mit oranger Tab */}
              <rect x={bodyX + 14} y={bodyY + 4} width="14" height="7" rx="0.5" fill="#1e293b" stroke="#374151" strokeWidth="0.3" />
              <rect x={bodyX + 14} y={bodyY + 4} width="14" height="2" fill="#ea580c" opacity="0.85" />
              <text x={bodyX + 21} y={bodyY + 9.5} textAnchor="middle" fontSize="3" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">AMS1117</text>

              {/* CP2102 USB-Serial-IC — kleines schwarzes Quadrat */}
              <rect x={bodyX + 14} y={bodyY + bodyH - 11} width="10" height="7" rx="0.5" fill="#0f172a" stroke="#374151" strokeWidth="0.3" />
              <text x={bodyX + 19} y={bodyY + bodyH - 6.5} textAnchor="middle" fontSize="2.8" fontWeight="700" fill="#cbd5e1" fontFamily="ui-monospace,monospace">CP2102</text>

              {/* ESP-WROOM-32 Modul — silbern, rechts auf dem PCB (nicht zentriert) */}
              <rect
                x={wroomX}
                y={wroomY}
                width={wroomW}
                height={wroomH}
                rx="1.5"
                fill="#e2e8f0"
                stroke="#475569"
                strokeWidth="0.6"
              />
              {/* Antennen-Mäander rechts oben am Modul */}
              <path
                d={`M ${wroomX + wroomW - 14} ${wroomY + 4}
                    L ${wroomX + wroomW - 4} ${wroomY + 4}
                    L ${wroomX + wroomW - 4} ${wroomY + 8}
                    L ${wroomX + wroomW - 14} ${wroomY + 8}
                    L ${wroomX + wroomW - 14} ${wroomY + 12}
                    L ${wroomX + wroomW - 4} ${wroomY + 12}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="0.6"
              />
              <text
                x={wroomX + (wroomW - 16) / 2}
                y={wroomY + wroomH / 2 + 3}
                textAnchor="middle"
                fontSize="8"
                fontWeight="800"
                fill="#0f172a"
                fontFamily="ui-monospace,monospace"
                letterSpacing="0.6"
              >
                ESP-WROOM-32
              </text>

              {/* Goldene Pin-Header — SMD-Style Lötauge mit Pin-Spitze, sichtbar
                  AUF dem PCB an den Brett-Loch-Positionen. Rendered NACH dem PCB-
                  Body, sodass die Pins sichtbar bleiben. */}
              {Array.from({ length: 15 }).map((_, i) => {
                const isActiveTop = i === PIN_3V3_COL || i === PIN_GPIO2_COL;
                const isActiveBottom = i === PIN_GND_COL;
                const topStroke = i === PIN_3V3_COL ? "#b91c1c" : i === PIN_GPIO2_COL ? "#15803d" : "#92400e";
                return (
                  <g key={`esp-pin-${i}`}>
                    {/* Pin-Sockel oben (Reihe e) — schwarzer Plastikrahmen + Pin-Spitze */}
                    <rect
                      x={colX(i) - 3.6}
                      y={UPPER_ROWS_Y[4]! - 3.6}
                      width="7.2"
                      height="7.2"
                      rx="0.8"
                      fill="#1a1a1a"
                      stroke={isActiveTop ? topStroke : "#374151"}
                      strokeWidth={isActiveTop ? "1.4" : "0.5"}
                    />
                    <rect
                      x={colX(i) - 2}
                      y={UPPER_ROWS_Y[4]! - 2}
                      width="4"
                      height="4"
                      rx="0.4"
                      fill="#facc15"
                    />
                    {/* Pin-Sockel unten (Reihe f) */}
                    <rect
                      x={colX(i) - 3.6}
                      y={LOWER_ROWS_Y[0]! - 3.6}
                      width="7.2"
                      height="7.2"
                      rx="0.8"
                      fill="#1a1a1a"
                      stroke={isActiveBottom ? "#1d4ed8" : "#374151"}
                      strokeWidth={isActiveBottom ? "1.4" : "0.5"}
                    />
                    <rect
                      x={colX(i) - 2}
                      y={LOWER_ROWS_Y[0]! - 2}
                      width="4"
                      height="4"
                      rx="0.4"
                      fill="#facc15"
                    />
                  </g>
                );
              })}

              {/* Wir verzichten bewusst auf Mini-Pin-Labels neben jedem Pin —
                  bei 26px Spaltenabstand wird die Schrift zu klein, um lesbar
                  zu sein. Die WICHTIGEN Pins (3V3, GPIO 2, GND) sind durch die
                  Floating-Callouts oberhalb/unterhalb des Bretts beschriftet —
                  das reicht didaktisch und vermeidet Info-Overload. */}
            </g>
          );
        })()}

        {/* Insert-Hint-Pfeile — drei dicke Pfeile zwischen ESP (schwebend) und
            Brett, damit klar ist: ESP wird von oben in beide Pin-Reihen gedrückt. */}
        {showInsertHint && (
          <g>
            {[2, 7, 12].map((col) => (
              <g key={`insert-arrow-${col}`}>
                <line
                  x1={colX(col)}
                  y1={UPPER_ROWS_Y[4]! - 50}
                  x2={colX(col)}
                  y2={LOWER_ROWS_Y[0]! - 8}
                  stroke="#0ea5e9"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                >
                  <animate attributeName="stroke-dashoffset" values="0;-20" dur="0.9s" repeatCount="indefinite" />
                </line>
                <polygon
                  points={`${colX(col) - 6},${LOWER_ROWS_Y[0]! - 8} ${colX(col) + 6},${LOWER_ROWS_Y[0]! - 8} ${colX(col)},${LOWER_ROWS_Y[0]! + 4}`}
                  fill="#0ea5e9"
                />
              </g>
            ))}
            {/* Hinweis-Banner unter dem schwebenden ESP */}
            <rect
              x={totalWidth / 2 - 90}
              y={UPPER_ROWS_Y[4]! - 38}
              width="180"
              height="20"
              rx="10"
              fill="#e0f2fe"
              stroke="#0ea5e9"
              strokeWidth="1.2"
            />
            <text
              x={totalWidth / 2}
              y={UPPER_ROWS_Y[4]! - 24}
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#075985"
              fontFamily="ui-monospace,monospace"
            >
              Mittig drücken — beide Pin-Reihen rein
            </text>
          </g>
        )}

        {/* Pin-Position-Callouts — AUSSERHALB des Bretts. Pin-Labels machen
            nur Sinn wenn der ESP da ist (sie zeigen auf ESP-Pins); ohne ESP
            sind sie irreführend. Im Insert-Hint-Modus auch weglassen. */}
        {explainerMode && !showInsertHint && showEsp && (
          <g>
            {/* 3V3 Callout — oben, Spalte 1 */}
            <line
              x1={colX(PIN_3V3_COL)}
              y1={-padTop + 44}
              x2={colX(PIN_3V3_COL)}
              y2={50}
              stroke="#dc2626"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
            <polygon
              points={`${colX(PIN_3V3_COL) - 4},${50} ${colX(PIN_3V3_COL) + 4},${50} ${colX(PIN_3V3_COL)},${60}`}
              fill="#dc2626"
            />
            <rect
              x={colX(PIN_3V3_COL) - 22}
              y={-padTop + 18}
              width="44"
              height="26"
              rx="6"
              fill="#fef2f2"
              stroke="#dc2626"
              strokeWidth="1.2"
            />
            <text
              x={colX(PIN_3V3_COL)}
              y={-padTop + 35}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#b91c1c"
              fontFamily="ui-monospace,monospace"
            >
              3V3
            </text>

            {/* GPIO 2 Callout — oben, Spalte 4 */}
            <line
              x1={colX(PIN_GPIO2_COL)}
              y1={-padTop + 44}
              x2={colX(PIN_GPIO2_COL)}
              y2={50}
              stroke="#15803d"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
            <polygon
              points={`${colX(PIN_GPIO2_COL) - 4},${50} ${colX(PIN_GPIO2_COL) + 4},${50} ${colX(PIN_GPIO2_COL)},${60}`}
              fill="#15803d"
            />
            <rect
              x={colX(PIN_GPIO2_COL) - 30}
              y={-padTop + 18}
              width="60"
              height="26"
              rx="6"
              fill="#f0fdf4"
              stroke="#15803d"
              strokeWidth="1.2"
            />
            <text
              x={colX(PIN_GPIO2_COL)}
              y={-padTop + 35}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#15803d"
              fontFamily="ui-monospace,monospace"
            >
              GPIO 2
            </text>

            {/* GND Callout — unten, Spalte 14 */}
            <line
              x1={colX(PIN_GND_COL)}
              y1={290}
              x2={colX(PIN_GND_COL)}
              y2={290 + padBottom - 46}
              stroke="#1d4ed8"
              strokeWidth="1.4"
              strokeDasharray="3 3"
            />
            <polygon
              points={`${colX(PIN_GND_COL) - 4},${290} ${colX(PIN_GND_COL) + 4},${290} ${colX(PIN_GND_COL)},${280}`}
              fill="#1d4ed8"
            />
            <rect
              x={colX(PIN_GND_COL) - 22}
              y={290 + padBottom - 44}
              width="44"
              height="26"
              rx="6"
              fill="#eff6ff"
              stroke="#1d4ed8"
              strokeWidth="1.2"
            />
            <text
              x={colX(PIN_GND_COL)}
              y={290 + padBottom - 27}
              textAnchor="middle"
              fontSize="11"
              fontWeight="800"
              fill="#1d4ed8"
              fontFamily="ui-monospace,monospace"
            >
              GND
            </text>
          </g>
        )}

        {/* Erklär-Modus: eine kurze 5-Loch-Spalte visuell hervorheben.
            Wir markieren die obere Hälfte (Reihen a–e) in Spalte 3, damit
            klar wird: alle 5 Löcher dieser kurzen Spalte sind elektrisch
            verbunden. Erläuterungstext steht im Body unter dem Bild.
            Im Insert-Hint-Modus weglassen. */}
        {explainerMode && !showInsertHint && (
          <g>
            <rect
              x={colX(2) - 9}
              y={UPPER_ROWS_Y[0]! - 7}
              width="18"
              height={UPPER_ROWS_Y[4]! - UPPER_ROWS_Y[0]! + 14}
              rx="4"
              fill="#fde68a"
              fillOpacity="0.55"
              stroke="#f59e0b"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            >
              <animate attributeName="stroke-opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
            </rect>
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
