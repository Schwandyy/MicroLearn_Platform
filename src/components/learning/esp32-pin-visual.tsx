"use client";

import { cn } from "@/lib/utils";
import { useBoardVariant } from "./board-variant-context";
import { getGpioForLabel } from "./wiring";

interface Esp32PinVisualProps {
  highlightPin?: "GPIO2" | "GND" | "3V3";
  className?: string;
}

const TOP_Y = 70;
const PIN_DY = 22;

/**
 * Vertikales ESP32-Pinout-Diagramm (USB oben). Pin-Belegung kommt aus dem
 * BoardVariant-Context — der Renderer wechselt automatisch zwischen 30-Pin
 * und 38-Pin Layout, sobald der User im BoardPicker umstellt.
 *
 * Pin-Mapping in USB-OBEN-Sicht (vertikales Diagramm):
 *   • LEFT-Spalte (oben→unten) = variant.southLabels
 *     (südliche Brett-Seite = ESP-Seite weg vom USB-Anschluss)
 *   • RIGHT-Spalte (oben→unten) = variant.northLabels
 *
 * Beide Reihenfolgen kommen aus der USB-LINKS-Renderer-Sicht — bei 90°-
 * Rotation in USB-OBEN-Sicht entspricht:
 *   USB-LINKS-NORTH  →  USB-OBEN-RIGHT (links→rechts in NORTH = oben→unten in RIGHT)
 *   USB-LINKS-SOUTH  →  USB-OBEN-LEFT
 */
export function Esp32PinVisual({ highlightPin, className }: Esp32PinVisualProps) {
  const { variant } = useBoardVariant();
  const leftPins = variant.southLabels;
  const rightPins = variant.northLabels;
  const pcbHeight = TOP_Y + variant.pinCount * PIN_DY + 30;

  const isHighlighted = (label: string): boolean => {
    if (!highlightPin) return false;
    if (label === highlightPin) return true;
    if (highlightPin === "GPIO2" && getGpioForLabel(label) === 2) return true;
    return false;
  };

  return (
    <div className={cn("relative mx-auto w-full max-w-md", className)}>
      <svg
        viewBox={`0 0 360 ${pcbHeight + 20}`}
        xmlns="http://www.w3.org/2000/svg"
        className="block w-full"
        role="img"
        aria-label={`ESP32-WROOM-32 ${variant.shortLabel} — GPIO-Beschriftung`}
      >
        {/* PCB-Korpus */}
        <rect
          x="80"
          y="40"
          width="200"
          height={pcbHeight - 60}
          rx="4"
          fill="#0b0f19"
          stroke="#1f2937"
          strokeWidth="1.5"
        />
        {/* Befestigungslöcher */}
        <circle cx="92" cy="52" r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <circle cx="268" cy="52" r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <circle cx="92" cy={pcbHeight - 32} r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />
        <circle cx="268" cy={pcbHeight - 32} r="3" fill="#1f2937" stroke="#374151" strokeWidth="1" />

        {/* USB-Mikro-Port oben */}
        <rect x="158" y="20" width="44" height="22" rx="3" fill="#9ca3af" stroke="#4b5563" strokeWidth="1" />
        <rect x="166" y="25" width="28" height="12" rx="1" fill="#1f2937" />
        <text x="180" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">
          MICRO-USB
        </text>

        {/* Pin-Header (Stifte) links + rechts — Anzahl aus Variante */}
        {leftPins.map((_, i) => (
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
        {rightPins.map((_, i) => (
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

        {/* ESP-WROOM-32-Modul — Höhe skaliert mit Pin-Anzahl */}
        {(() => {
          const wroomH = Math.min(200, variant.pinCount * 11);
          const wroomY = TOP_Y + (variant.pinCount * PIN_DY - wroomH) / 2;
          return (
            <g>
              <rect x="105" y={wroomY} width="150" height={wroomH} rx="4" fill="#d1d5db" stroke="#6b7280" strokeWidth="1.2" />
              <path
                d={`M 115 ${wroomY + wroomH - 12} L 245 ${wroomY + wroomH - 12} L 245 ${wroomY + wroomH - 18} L 115 ${wroomY + wroomH - 18} L 115 ${wroomY + wroomH - 24} L 245 ${wroomY + wroomH - 24}`}
                fill="none"
                stroke="#374151"
                strokeWidth="1.6"
                strokeLinejoin="miter"
              />
              <text x="180" y={wroomY + wroomH / 2 - 8} textAnchor="middle" fontSize="11" fill="#0b0f19" fontWeight="800" letterSpacing="1" fontFamily="ui-monospace,monospace">
                ESP32-WROOM-32
              </text>
              <text x="180" y={wroomY + wroomH / 2 + 8} textAnchor="middle" fontSize="7" fill="#374151" fontFamily="ui-monospace,monospace">
                {variant.shortLabel} DevKit V1
              </text>
              <text x="248" y={wroomY + wroomH - 38} textAnchor="end" fontSize="6" fill="#4b5563" fontFamily="ui-monospace,monospace">
                CE  FCC
              </text>
            </g>
          );
        })()}

        {/* Pin-Labels links — Index aus variant.southLabels */}
        {leftPins.map((label, i) => {
          const y = TOP_Y + i * PIN_DY;
          const hl = isHighlighted(label);
          return (
            <g key={`l-${i}-${label}`}>
              {hl && (
                <rect x="68" y={y - 5} width="14" height="10" rx="1" fill="#fbbf24" stroke="#b45309" strokeWidth="1.4" />
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
                {label}
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

        {/* Pin-Labels rechts — Index aus variant.northLabels */}
        {rightPins.map((label, i) => {
          const y = TOP_Y + i * PIN_DY;
          const hl = isHighlighted(label);
          return (
            <g key={`r-${i}-${label}`}>
              {hl && (
                <rect x="278" y={y - 5} width="14" height="10" rx="1" fill="#fbbf24" stroke="#b45309" strokeWidth="1.4" />
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
                {label}
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
