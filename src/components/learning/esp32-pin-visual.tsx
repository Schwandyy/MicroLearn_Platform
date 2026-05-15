"use client";

import { cn } from "@/lib/utils";

interface Esp32PinVisualProps {
  highlightPin?: "GPIO2" | "GND" | "3V3";
  className?: string;
}

/**
 * Vereinfachtes ESP32-DevKit-Board mit beschrifteten Pins links und rechts.
 * Hebt einen einzelnen Pin hervor, damit Anfänger sehen, wo zum Beispiel
 * „GPIO 2" auf dem echten Board zu finden ist.
 */
export function Esp32PinVisual({ highlightPin, className }: Esp32PinVisualProps) {
  // Pin-Layout (vereinfacht, didaktisch — nicht 1:1 das DevKit-V1)
  const leftPins = ["3V3", "GND", "D15", "D2", "D4", "D5", "D18", "D19"];
  const rightPins = ["GND", "5V", "D21", "D22", "D23", "D13", "D12", "D14"];

  const isHighlighted = (pin: string): boolean => {
    if (!highlightPin) return false;
    if (highlightPin === "GPIO2") return pin === "D2";
    return pin === highlightPin;
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      <svg
        viewBox="0 0 320 280"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="ESP32 DevKit V1 Board mit beschrifteten Pins"
      >
        {/* PCB */}
        <rect
          x="60"
          y="20"
          width="200"
          height="240"
          rx="6"
          fill="#0b0f19"
          stroke="#1f2937"
          strokeWidth="1.5"
        />
        {/* Befestigungslöcher (4 Ecken) */}
        <circle cx="72" cy="32" r="3" fill="#0b0f19" stroke="#374151" strokeWidth="1" />
        <circle cx="248" cy="32" r="3" fill="#0b0f19" stroke="#374151" strokeWidth="1" />
        <circle cx="72" cy="248" r="3" fill="#0b0f19" stroke="#374151" strokeWidth="1" />
        <circle cx="248" cy="248" r="3" fill="#0b0f19" stroke="#374151" strokeWidth="1" />

        {/* Goldene Pin-Header beidseitig — zeigen, dass es ein DevKit-Board ist */}
        {leftPins.map((_, i) => (
          <rect
            key={`hp-l-${i}`}
            x="48"
            y={50 + i * 24 - 5}
            width="14"
            height="10"
            rx="1"
            fill="#facc15"
            stroke="#b45309"
            strokeWidth="0.8"
          />
        ))}
        {rightPins.map((_, i) => (
          <rect
            key={`hp-r-${i}`}
            x="258"
            y={50 + i * 24 - 5}
            width="14"
            height="10"
            rx="1"
            fill="#facc15"
            stroke="#b45309"
            strokeWidth="0.8"
          />
        ))}

        {/* USB-Mikro-Port oben */}
        <rect x="138" y="12" width="44" height="20" rx="2" fill="#9ca3af" stroke="#4b5563" strokeWidth="1" />
        <rect x="146" y="16" width="28" height="12" rx="1" fill="#1f2937" />
        <text x="160" y="42" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
          USB
        </text>

        {/* ESP-WROOM-32-Modul (silberner Block + Antennen-Mäander) */}
        <rect x="105" y="80" width="110" height="78" rx="3" fill="#d1d5db" stroke="#6b7280" strokeWidth="1.2" />
        {/* PCB-Antenne (Mäander) */}
        <path
          d="M 115 88 L 205 88 L 205 94 L 115 94 L 115 100 L 205 100"
          fill="none"
          stroke="#374151"
          strokeWidth="1.6"
          strokeLinejoin="miter"
        />
        <text x="160" y="123" textAnchor="middle" fontSize="11" fill="#0b0f19" fontWeight="800" letterSpacing="1">
          A-Delivery
        </text>
        <text x="160" y="138" textAnchor="middle" fontSize="8" fill="#374151" fontFamily="ui-monospace,monospace">
          ESP32-WROOM-32
        </text>
        <text x="200" y="152" textAnchor="end" fontSize="6" fill="#4b5563" fontFamily="ui-monospace,monospace">
          CE
        </text>

        {/* USB-Serial-IC */}
        <rect x="112" y="170" width="22" height="14" rx="1" fill="#1f2937" stroke="#000" strokeWidth="0.4" />
        <text x="123" y="180" textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="ui-monospace,monospace">
          CP2102
        </text>
        {/* Spannungsregler */}
        <rect x="186" y="170" width="22" height="14" rx="1" fill="#1f2937" />
        <text x="197" y="180" textAnchor="middle" fontSize="6" fill="#9ca3af" fontFamily="ui-monospace,monospace">
          AMS1117
        </text>

        {/* Buttons EN + BOOT */}
        <g>
          <rect x="108" y="200" width="18" height="18" rx="2" fill="#4b5563" stroke="#1f2937" strokeWidth="0.8" />
          <text x="117" y="230" textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="600">EN</text>
          <rect x="194" y="200" width="18" height="18" rx="2" fill="#4b5563" stroke="#1f2937" strokeWidth="0.8" />
          <text x="203" y="230" textAnchor="middle" fontSize="9" fill="#cbd5e1" fontWeight="600">BOOT</text>
        </g>

        {/* Status-LEDs */}
        <circle cx="142" cy="208" r="3" fill="#dc2626" />
        <text x="142" y="226" textAnchor="middle" fontSize="6" fill="#9ca3af">PWR</text>
        <circle cx="178" cy="208" r="3" fill="#2563eb" />
        <text x="178" y="226" textAnchor="middle" fontSize="6" fill="#9ca3af">D2</text>

        {/* Pins links — Labels */}
        {leftPins.map((pin, i) => {
          const y = 50 + i * 24;
          const hl = isHighlighted(pin);
          return (
            <g key={`l-${pin}`}>
              {/* Highlight des Pin-Stifts */}
              {hl && (
                <rect
                  x="48"
                  y={y - 5}
                  width="14"
                  height="10"
                  rx="1"
                  fill="#fbbf24"
                  stroke="#b45309"
                  strokeWidth="1.4"
                />
              )}
              {/* Label */}
              <text
                x="42"
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fontWeight={hl ? "800" : "600"}
                fill={hl ? "#b45309" : "#cbd5e1"}
              >
                {pin}
              </text>
              {hl && (
                <>
                  <circle cx="55" cy={y} r="14" fill="#fbbf24" fillOpacity="0.25">
                    <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
                    <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                  <g transform={`translate(4, ${y})`}>
                    <text x="0" y="4" fontSize="13" fill="#b45309" fontWeight="800">→</text>
                    <text x="0" y="-10" fontSize="10" fill="#b45309" fontWeight="800">hier!</text>
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Pins rechts */}
        {rightPins.map((pin, i) => {
          const y = 50 + i * 24;
          const hl = isHighlighted(pin);
          return (
            <g key={`r-${pin}`}>
              {hl && (
                <rect
                  x="258"
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
                x="278"
                y={y + 4}
                textAnchor="start"
                fontSize="11"
                fontWeight={hl ? "800" : "600"}
                fill={hl ? "#b45309" : "#cbd5e1"}
              >
                {pin}
              </text>
              {hl && (
                <circle cx="265" cy={y} r="14" fill="#fbbf24" fillOpacity="0.25">
                  <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
