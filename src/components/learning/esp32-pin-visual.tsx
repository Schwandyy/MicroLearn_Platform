"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { getPinCategory, isSelectablePin, PIN_CATEGORY_INFO, useBoardVariant } from "./board-variant-context";

interface Esp32PinVisualProps {
  highlightPin?: "GPIO2" | "GND" | "3V3";
  className?: string;
}

const TOP_Y = 70;
const PIN_DY = 22;

/**
 * Vertikales ESP32-Pinout-Diagramm (USB oben). Pins sind KLICKBAR — User
 * wählt den Signal-Pin für die Lesson (default D2). Selected Pin wird in
 * Context + LocalStorage gespeichert; BlinkSchematic + Step-Texte
 * adaptieren sich live.
 */
export function Esp32PinVisual({ highlightPin, className }: Esp32PinVisualProps) {
  const { variant, signalPinLabel, setSignalPinLabel } = useBoardVariant();
  const [infoLabel, setInfoLabel] = useState<string | null>(null);
  const leftPins = variant.southLabels;
  const rightPins = variant.northLabels;
  const pcbHeight = TOP_Y + variant.pinCount * PIN_DY + 30;

  // Wenn der highlightPin-Prop "GPIO2" ist, wird der AKTUELL GEWÄHLTE
  // Signal-Pin highlighted (initial D2, aber bei Klick z.B. D4).
  const isHighlighted = (label: string): boolean => {
    if (!highlightPin) return false;
    if (highlightPin === "GPIO2") return label === signalPinLabel;
    if (label === highlightPin) return true;
    return false;
  };

  // Klick auf JEDEN Pin: Output-fähige werden als Signal-Pin gesetzt,
  // andere zeigen nur eine Info-Box (Erklärung warum nicht steuerbar).
  const handleClick = (label: string) => {
    if (isSelectablePin(label)) {
      setSignalPinLabel(label);
      setInfoLabel(label);
    } else {
      setInfoLabel(label);
    }
  };

  const infoCategory = infoLabel ? getPinCategory(infoLabel) : null;
  const infoData = infoCategory ? PIN_CATEGORY_INFO[infoCategory] : null;

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

        {/* Alle Pin-Reihen sind klickbar — Signal-Pins schalten den Lesson-
            Pin um; Power/GND/Flash/Input-only zeigen nur eine Erklärung. */}
        {leftPins.map((label, i) => (
          <PinRow
            key={`l-${i}-${label}`}
            label={label}
            y={TOP_Y + i * PIN_DY}
            side="left"
            highlighted={isHighlighted(label)}
            category={getPinCategory(label)}
            onClick={() => handleClick(label)}
          />
        ))}
        {rightPins.map((label, i) => (
          <PinRow
            key={`r-${i}-${label}`}
            label={label}
            y={TOP_Y + i * PIN_DY}
            side="right"
            highlighted={isHighlighted(label)}
            category={getPinCategory(label)}
            onClick={() => handleClick(label)}
          />
        ))}
      </svg>
      {infoLabel && infoData && (
        <div
          className={cn(
            "mt-3 rounded-md border px-3 py-2 text-sm",
            infoData.canBeSignal
              ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
              : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200",
          )}
        >
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <span className="font-mono font-bold">{infoLabel}</span>{" "}
              <span className="text-xs opacity-70">— {infoData.title}</span>
            </div>
            {infoData.canBeSignal && infoLabel === signalPinLabel && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                aktiv für Lesson
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-snug opacity-90">{infoData.subtitle}</p>
        </div>
      )}
      {highlightPin === "GPIO2" && !infoLabel && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          <span className="font-bold">Tipp:</span>{" "}
          <span className="font-mono font-bold">{signalPinLabel}</span> ist aktuell
          gewählt. Klick auf einen anderen Pin (z.B. D4, D5, D12 oder auch
          3V3/GND), um mehr zu erfahren oder umzuschalten.
        </p>
      )}
    </div>
  );
}

interface PinRowProps {
  label: string;
  y: number;
  side: "left" | "right";
  highlighted: boolean;
  category: ReturnType<typeof getPinCategory>;
  onClick: () => void;
}

const CATEGORY_STROKE: Record<ReturnType<typeof getPinCategory>, string> = {
  signal: "#0ea5e9",     // sky-blue
  power: "#dc2626",      // red — 3V3, 5V, VIN
  ground: "#1d4ed8",     // blue — GND
  "input-only": "#ca8a04",
  flash: "#7c3aed",      // violet
  uart: "#0ea5e9",
  reset: "#9333ea",
};

/**
 * Ein klickbarer Pin (Header + Label + Highlight). ALLE Pins reagieren auf
 * Klick: Signal-Pins werden aktiv für die Lesson, andere zeigen nur eine
 * Erklärungs-Box außerhalb des SVG.
 */
function PinRow({ label, y, side, highlighted, category, onClick }: PinRowProps) {
  const labelX = side === "left" ? 62 : 298;
  const headerX = side === "left" ? 68 : 278;
  const hitX = side === "left" ? 0 : 280;
  const hitW = 80;
  const hoverStroke = CATEGORY_STROKE[category];
  return (
    <g
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Unsichtbare Klick-Hit-Box */}
      <rect x={hitX} y={y - 10} width={hitW} height="20" fill="transparent" />
      {/* Hover-Outline */}
      <rect
        x={headerX - 1}
        y={y - 6}
        width="16"
        height="12"
        rx="1.2"
        fill="none"
        stroke={hoverStroke}
        strokeWidth="0"
        className="transition-[stroke-width] group-hover:[stroke-width:1.5]"
      />
      {/* Highlight-Background hinter dem Header bei selected (orange) */}
      {highlighted && (
        <rect x={headerX} y={y - 5} width="14" height="10" rx="1" fill="#fbbf24" stroke="#b45309" strokeWidth="1.4" />
      )}
      <text
        x={labelX}
        y={y + 3}
        textAnchor={side === "left" ? "end" : "start"}
        fontSize="9"
        fontWeight={highlighted ? "800" : "600"}
        fill={highlighted ? "#b45309" : "#e2e8f0"}
        fontFamily="ui-monospace,monospace"
        className="select-none"
      >
        {label}
      </text>
      {/* Pulsing-Ring nur bei selected */}
      {highlighted && (
        <circle cx={side === "left" ? 75 : 285} cy={y} r="14" fill="#fbbf24" fillOpacity="0.25" pointerEvents="none">
          <animate attributeName="r" values="10;18;10" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="fill-opacity" values="0.4;0.05;0.4" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
      {/* "hier!"-Pfeil nur für selected RIGHT-Pin */}
      {highlighted && side === "right" && (
        <g transform={`translate(330, ${y})`} pointerEvents="none">
          <text x="0" y="4" fontSize="13" fill="#b45309" fontWeight="800">←</text>
          <text x="0" y="-10" fontSize="10" fill="#b45309" fontWeight="800">hier!</text>
        </g>
      )}
    </g>
  );
}
