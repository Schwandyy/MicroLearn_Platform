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
        viewBox="0 0 320 260"
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label="ESP32 Board mit beschrifteten Pins"
      >
        {/* Board */}
        <rect
          x="60"
          y="20"
          width="200"
          height="220"
          rx="8"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="2"
        />
        {/* USB-Anschluss oben */}
        <rect x="135" y="10" width="50" height="20" rx="2" fill="#475569" />
        <text
          x="160"
          y="24"
          textAnchor="middle"
          fontSize="8"
          fill="#cbd5e1"
          fontWeight="600"
        >
          USB
        </text>

        {/* ESP32-Chip */}
        <rect x="125" y="80" width="70" height="80" rx="4" fill="#1e293b" stroke="#64748b" />
        <text
          x="160"
          y="125"
          textAnchor="middle"
          fontSize="11"
          fill="#94a3b8"
          fontWeight="700"
        >
          ESP32
        </text>

        {/* Pins links */}
        {leftPins.map((pin, i) => {
          const y = 50 + i * 22;
          const hl = isHighlighted(pin);
          return (
            <g key={`l-${pin}`}>
              {/* Header-Pin (Stift) */}
              <rect
                x="50"
                y={y - 4}
                width="14"
                height="8"
                rx="1"
                fill={hl ? "#fbbf24" : "#94a3b8"}
              />
              {/* Label */}
              <text
                x="44"
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fontWeight={hl ? "700" : "500"}
                fill={hl ? "#b45309" : "#475569"}
              >
                {pin}
              </text>
              {hl && (
                <>
                  {/* Glow um den Pin */}
                  <circle cx="57" cy={y} r="14" fill="#fbbf24" fillOpacity="0.25">
                    <animate
                      attributeName="r"
                      values="10;16;10"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="fill-opacity"
                      values="0.4;0.05;0.4"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Pfeil von außen */}
                  <g transform={`translate(8, ${y})`}>
                    <text
                      x="0"
                      y="4"
                      fontSize="12"
                      fill="#b45309"
                      fontWeight="700"
                    >
                      →
                    </text>
                    <text x="-2" y="-8" fontSize="9" fill="#b45309" fontWeight="700">
                      hier!
                    </text>
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Pins rechts */}
        {rightPins.map((pin, i) => {
          const y = 50 + i * 22;
          const hl = isHighlighted(pin);
          return (
            <g key={`r-${pin}`}>
              <rect
                x="256"
                y={y - 4}
                width="14"
                height="8"
                rx="1"
                fill={hl ? "#fbbf24" : "#94a3b8"}
              />
              <text
                x="276"
                y={y + 3}
                textAnchor="start"
                fontSize="10"
                fontWeight={hl ? "700" : "500"}
                fill={hl ? "#b45309" : "#475569"}
              >
                {pin}
              </text>
              {hl && (
                <circle cx="263" cy={y} r="14" fill="#fbbf24" fillOpacity="0.25">
                  <animate
                    attributeName="r"
                    values="10;16;10"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
