"use client";

import { cn } from "@/lib/utils";

interface Esp32PinVisualProps {
  highlightPin?: "GPIO2" | "GND" | "3V3";
  className?: string;
}

// 38-Pin AZ-Delivery ESP32 NodeMCU DevKit V1 — vertikales Pinout-Diagramm
// mit USB OBEN. Pin-Belegung exakt nach offiziellem AZ-Delivery-Pinout-PDF
// (ESP-32_NodeMCU_Developmentboard_Pinout.pdf), gleiche Reihenfolge wie
// PIN_NORTH_LABELS/PIN_SOUTH_LABELS in wiring/geometry.ts — nur hier in
// USB-OBEN-Orientation rotiert.
const LEFT_PINS: { code: string; gpio?: number }[] = [
  { code: "3V3" },
  { code: "EN" },
  { code: "VP", gpio: 36 },
  { code: "VN", gpio: 39 },
  { code: "D34", gpio: 34 },
  { code: "D35", gpio: 35 },
  { code: "D32", gpio: 32 },
  { code: "D33", gpio: 33 },
  { code: "D25", gpio: 25 },
  { code: "D26", gpio: 26 },
  { code: "D27", gpio: 27 },
  { code: "D14", gpio: 14 },
  { code: "D12", gpio: 12 },
  { code: "GND" },
  { code: "D13", gpio: 13 },
  { code: "SD2", gpio: 9 },
  { code: "SD3", gpio: 10 },
  { code: "CMD", gpio: 11 },
  { code: "5V" },
];
const RIGHT_PINS: { code: string; gpio?: number }[] = [
  { code: "GND" },
  { code: "D23", gpio: 23 },
  { code: "D22", gpio: 22 },
  { code: "TX0", gpio: 1 },
  { code: "RX0", gpio: 3 },
  { code: "D21", gpio: 21 },
  { code: "D19", gpio: 19 },
  { code: "D18", gpio: 18 },
  { code: "D5", gpio: 5 },
  { code: "TX2", gpio: 17 },
  { code: "RX2", gpio: 16 },
  { code: "D4", gpio: 4 },
  { code: "D2", gpio: 2 },
  { code: "D15", gpio: 15 },
  { code: "GND" },
  { code: "CLK", gpio: 6 },
  { code: "SD0", gpio: 7 },
  { code: "SD1", gpio: 8 },
  { code: "3V3" },
];

const TOP_Y = 70;
const PIN_DY = 22;
const PCB_HEIGHT = TOP_Y + LEFT_PINS.length * PIN_DY + 30;

/**
 * Vertikales ESP32-Pinout-Diagramm (USB oben) für den EXPLAIN-Step
 * „Was ist ein GPIO?". 38-Pin DevKit V1 — 19 Pins pro Seite.
 */
export function Esp32PinVisual({ highlightPin, className }: Esp32PinVisualProps) {
  const isHighlighted = (pin: { code: string; gpio?: number }): boolean => {
    if (!highlightPin) return false;
    if (pin.code === highlightPin) return true;
    // Aliases — payload sagt "GPIO2", aber das Silkscreen-Label heißt "D2".
    if (highlightPin === "GPIO2" && pin.gpio === 2) return true;
    return false;
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      <svg
        viewBox={`0 0 360 ${PCB_HEIGHT + 20}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="ESP32-WROOM-32 DevKit (38-Pin) — GPIO-Beschriftung"
      >
        {/* PCB-Korpus */}
        <rect
          x="80"
          y="40"
          width="200"
          height={PCB_HEIGHT - 60}
          rx="4"
          fill="#0b0f19"
          stroke="#1f2937"
          strokeWidth="1.5"
        />
        {/* Befestigungslöcher */}
        <circle cx="92" cy="52" r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <circle cx="268" cy="52" r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <circle cx="92" cy={PCB_HEIGHT - 32} r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <circle cx="268" cy={PCB_HEIGHT - 32} r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />

        {/* USB-Mikro-Port oben */}
        <rect x="158" y="20" width="44" height="22" rx="3" fill="#9ca3af" stroke="#4b5563" strokeWidth="1" />
        <rect x="166" y="25" width="28" height="12" rx="1" fill="#1f2937" />
        <text x="180" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">
          MICRO-USB
        </text>

        {/* Pin-Header (Stifte) links + rechts — 19 pro Seite */}
        {LEFT_PINS.map((_, i) => (
          <rect
            key={`hp-l-${i}`}
            x="68"
            y={TOP_Y + i * PIN_DY - 5}
            width="14"
            height="10"
            rx="1"
            fill="#facc15"
            stroke="#b45309"
            strokeWidth="0.6"
          />
        ))}
        {RIGHT_PINS.map((_, i) => (
          <rect
            key={`hp-r-${i}`}
            x="278"
            y={TOP_Y + i * PIN_DY - 5}
            width="14"
            height="10"
            rx="1"
            fill="#facc15"
            stroke="#b45309"
            strokeWidth="0.6"
          />
        ))}

        {/* ESP-WROOM-32-Modul — in der Mitte des PCBs (auf 38-Pin DevKit
            sitzt es weiter unten als bei 30-Pin, weil mehr Pins oben) */}
        <rect x="105" y={TOP_Y + 130} width="150" height="200" rx="4" fill="#d1d5db" stroke="#6b7280" strokeWidth="1.2" />
        {/* PCB-Antenne (Mäander am Modul-Ende) */}
        <path
          d={`M 115 ${TOP_Y + 318} L 245 ${TOP_Y + 318} L 245 ${TOP_Y + 312} L 115 ${TOP_Y + 312} L 115 ${TOP_Y + 306} L 245 ${TOP_Y + 306}`}
          fill="none"
          stroke="#374151"
          strokeWidth="1.6"
          strokeLinejoin="miter"
        />
        <text x="180" y={TOP_Y + 215} textAnchor="middle" fontSize="11" fill="#0b0f19" fontWeight="800" letterSpacing="1" fontFamily="ui-monospace,monospace">
          ESP32-WROOM-32
        </text>
        <text x="180" y={TOP_Y + 230} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="ui-monospace,monospace">
          38-pin DevKit V1
        </text>
        <text x="248" y={TOP_Y + 285} textAnchor="end" fontSize="6" fill="#4b5563" fontFamily="ui-monospace,monospace">
          CE  FCC
        </text>

        {/* Pin-Labels links */}
        {LEFT_PINS.map((pin, i) => {
          const { code } = pin;
          const y = TOP_Y + i * PIN_DY;
          const hl = isHighlighted(pin);
          return (
            <g key={`l-${i}-${code}`}>
              {hl && (
                <rect
                  x="68"
                  y={y - 5}
                  width="14"
                  height="10"
                  rx="1"
                  fill="#fbbf24"
                  stroke="#b45309"
                  strokeWidth="1.4"
                />
              )}
              <text
                x="62"
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fontWeight={hl ? "800" : "600"}
                fill={hl ? "#b45309" : "#cbd5e1"}
                fontFamily="ui-monospace,monospace"
              >
                {code}
              </text>
              {hl && (
                <circle cx="75" cy={y} r="14" fill="#fbbf24" fillOpacity="0.25">
                  <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}

        {/* Pin-Labels rechts */}
        {RIGHT_PINS.map((pin, i) => {
          const { code } = pin;
          const y = TOP_Y + i * PIN_DY;
          const hl = isHighlighted(pin);
          return (
            <g key={`r-${i}-${code}`}>
              {hl && (
                <rect
                  x="278"
                  y={y - 5}
                  width="14"
                  height="10"
                  rx="1"
                  fill="#fbbf24"
                  stroke="#b45309"
                  strokeWidth="1.4"
                />
              )}
              <text
                x="298"
                y={y + 3}
                textAnchor="start"
                fontSize="9"
                fontWeight={hl ? "800" : "600"}
                fill={hl ? "#b45309" : "#cbd5e1"}
                fontFamily="ui-monospace,monospace"
              >
                {code}
              </text>
              {hl && (
                <>
                  <circle cx="285" cy={y} r="14" fill="#fbbf24" fillOpacity="0.25">
                    <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                  <g transform={`translate(330, ${y})`}>
                    <text x="0" y="4" fontSize="13" fill="#b45309" fontWeight="800">←</text>
                    <text x="0" y="-10" fontSize="10" fill="#b45309" fontWeight="800">hier!</text>
                  </g>
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
