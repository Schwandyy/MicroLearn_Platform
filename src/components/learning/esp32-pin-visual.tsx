"use client";

import { cn } from "@/lib/utils";

interface Esp32PinVisualProps {
  highlightPin?: "GPIO2" | "GND" | "3V3";
  className?: string;
}

// Standard 30-Pin-ESP32-WROOM-32 DevKit (gleicher Footprint wie das, was
// Reichelt/AZ/Mouser verkaufen). Reihenfolge von oben (USB-Seite) nach
// unten. Quelle: Espressif Hardware Design Guidelines + Standard-Pinout-Diagramme.
// Linke Seite und rechte Seite — jeweils 15 Pins.
const LEFT_PINS: { code: string; gpio?: number }[] = [
  { code: "EN" },
  { code: "GPIO36", gpio: 36 },
  { code: "GPIO39", gpio: 39 },
  { code: "GPIO34", gpio: 34 },
  { code: "GPIO35", gpio: 35 },
  { code: "GPIO32", gpio: 32 },
  { code: "GPIO33", gpio: 33 },
  { code: "GPIO25", gpio: 25 },
  { code: "GPIO26", gpio: 26 },
  { code: "GPIO27", gpio: 27 },
  { code: "GPIO14", gpio: 14 },
  { code: "GPIO12", gpio: 12 },
  { code: "GND" },
  { code: "GPIO13", gpio: 13 },
  { code: "VIN" },
];
const RIGHT_PINS: { code: string; gpio?: number }[] = [
  { code: "3V3" },
  { code: "GND" },
  { code: "GPIO15", gpio: 15 },
  { code: "GPIO2", gpio: 2 },
  { code: "GPIO4", gpio: 4 },
  { code: "GPIO16", gpio: 16 },
  { code: "GPIO17", gpio: 17 },
  { code: "GPIO5", gpio: 5 },
  { code: "GPIO18", gpio: 18 },
  { code: "GPIO19", gpio: 19 },
  { code: "GPIO21", gpio: 21 },
  { code: "GPIO3", gpio: 3 },
  { code: "GPIO1", gpio: 1 },
  { code: "GPIO22", gpio: 22 },
  { code: "GPIO23", gpio: 23 },
];

const TOP_Y = 70;
const PIN_DY = 22;
const PCB_HEIGHT = TOP_Y + LEFT_PINS.length * PIN_DY + 30;

/**
 * ESP32-WROOM-32 DevKit (30-Pin), beschriftet mit korrekten GPIO-Nummern.
 * Vereinfachte, generische Darstellung — kein Markenname auf dem PCB.
 */
export function Esp32PinVisual({ highlightPin, className }: Esp32PinVisualProps) {
  const isHighlighted = (code: string): boolean => {
    if (!highlightPin) return false;
    return code === highlightPin;
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      <svg
        viewBox={`0 0 360 ${PCB_HEIGHT + 20}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="ESP32-WROOM-32 DevKit (30-Pin) — GPIO-Beschriftung"
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

        {/* Pin-Header (Stifte) links + rechts */}
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

        {/* ESP-WROOM-32-Modul (silberner Block + Antennen-Mäander oben) */}
        <rect x="105" y={TOP_Y + 30} width="150" height="110" rx="4" fill="#d1d5db" stroke="#6b7280" strokeWidth="1.2" />
        {/* PCB-Antenne (Mäander oben) */}
        <path
          d="M 115 110 L 245 110 L 245 116 L 115 116 L 115 122 L 245 122"
          fill="none"
          stroke="#374151"
          strokeWidth="1.6"
          strokeLinejoin="miter"
        />
        <text x="180" y={TOP_Y + 80} textAnchor="middle" fontSize="11" fill="#0b0f19" fontWeight="800" letterSpacing="1" fontFamily="ui-monospace,monospace">
          ESP32-WROOM-32
        </text>
        <text x="180" y={TOP_Y + 95} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="ui-monospace,monospace">
          30-pin DevKit
        </text>
        <text x="248" y={TOP_Y + 110} textAnchor="end" fontSize="6" fill="#4b5563" fontFamily="ui-monospace,monospace">
          CE  FCC
        </text>

        {/* USB-Serial-IC */}
        <rect x="125" y={PCB_HEIGHT - 70} width="22" height="14" rx="1" fill="#1f2937" stroke="#000" strokeWidth="0.4" />
        <text x="136" y={PCB_HEIGHT - 60} textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="ui-monospace,monospace">
          CP2102
        </text>
        {/* Spannungsregler */}
        <rect x="206" y={PCB_HEIGHT - 70} width="22" height="14" rx="1" fill="#1f2937" />
        <text x="217" y={PCB_HEIGHT - 60} textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="ui-monospace,monospace">
          AMS1117
        </text>

        {/* Buttons EN + BOOT unten */}
        <g>
          <rect x="125" y={PCB_HEIGHT - 50} width="18" height="18" rx="2" fill="#4b5563" stroke="#1f2937" strokeWidth="0.8" />
          <text x="134" y={PCB_HEIGHT - 18} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="600">EN</text>
          <rect x="210" y={PCB_HEIGHT - 50} width="18" height="18" rx="2" fill="#4b5563" stroke="#1f2937" strokeWidth="0.8" />
          <text x="219" y={PCB_HEIGHT - 18} textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="600">BOOT</text>
        </g>

        {/* Status-LEDs */}
        <circle cx="160" cy={PCB_HEIGHT - 41} r="3" fill="#dc2626" />
        <text x="160" y={PCB_HEIGHT - 22} textAnchor="middle" fontSize="6" fill="#9ca3af">PWR</text>
        <circle cx="196" cy={PCB_HEIGHT - 41} r="3" fill="#2563eb" />
        <text x="196" y={PCB_HEIGHT - 22} textAnchor="middle" fontSize="6" fill="#9ca3af">USR</text>

        {/* Pin-Labels links */}
        {LEFT_PINS.map(({ code }, i) => {
          const y = TOP_Y + i * PIN_DY;
          const hl = isHighlighted(code);
          return (
            <g key={`l-${code}`}>
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
        {RIGHT_PINS.map(({ code }, i) => {
          const y = TOP_Y + i * PIN_DY;
          const hl = isHighlighted(code);
          return (
            <g key={`r-${code}`}>
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
