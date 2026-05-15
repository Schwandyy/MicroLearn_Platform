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
  className?: string;
}

const COLOR_MAP: Record<string, { core: string; glow: string }> = {
  red: { core: "#ef4444", glow: "#fca5a5" },
  green: { core: "#10b981", glow: "#6ee7b7" },
  yellow: { core: "#eab308", glow: "#fde68a" },
  blue: { core: "#3b82f6", glow: "#93c5fd" },
};

/**
 * Eigene Steckbrett-Visualisierung — KEIN externes Embed.
 * Statische SVG mit optionaler LED-Animation für die "Simulation".
 */
export function Breadboard({
  ledOn = false,
  ledColor = "red",
  ledAnimation = "off",
  highlightWires = [],
  buildStage = "all",
  className,
}: BreadboardProps) {
  const led = COLOR_MAP[ledColor]!;
  const isOn = ledOn && ledAnimation !== "off";

  // Sichtbarkeit pro Element je nach Build-Stufe.
  // active = neu/hervorgehoben, dim = noch nicht da (ausgegraut), full = sichtbar
  type Vis = "active" | "dim" | "full";
  const vis: { resistor: Vis; led: Vis; wireGnd: Vis; wireSignal: Vis } =
    buildStage === "all"
      ? { resistor: "full", led: "full", wireGnd: "full", wireSignal: "full" }
      : buildStage === 1
        ? { resistor: "active", led: "dim", wireGnd: "dim", wireSignal: "active" }
        : buildStage === 2
          ? { resistor: "full", led: "active", wireGnd: "dim", wireSignal: "full" }
          : { resistor: "full", led: "full", wireGnd: "active", wireSignal: "full" };

  const dimOpacity = (v: Vis): number => (v === "dim" ? 0.18 : 1);
  const isActive = (v: Vis): boolean => v === "active";

  return (
    <div className={cn("relative mx-auto w-full max-w-xl", className)}>
      <svg
        viewBox="0 0 400 280"
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
            <style>
              {`@keyframes blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }`}
            </style>
          )}
          {ledAnimation === "fade" && (
            <style>
              {`@keyframes fade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }`}
            </style>
          )}
          {ledAnimation === "pulse" && (
            <style>
              {`@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1); } }`}
            </style>
          )}
        </defs>

        {/* Steckbrett-Untergrund */}
        <rect x="10" y="20" width="380" height="240" rx="12" fill="#fef9e7" stroke="#facc15" strokeWidth="1.5" />

        {/* Power-Rails (rot + blau) */}
        <line x1="20" y1="40" x2="380" y2="40" stroke="#ef4444" strokeWidth="1.5" />
        <line x1="20" y1="240" x2="380" y2="240" stroke="#3b82f6" strokeWidth="1.5" />

        {/* Steckbrett-Pin-Grid (10 Säulen × 5 Reihen, zwei Hälften) */}
        {Array.from({ length: 14 }).map((_, col) => (
          <g key={`col-${col}`}>
            {[80, 95, 110, 125, 140].map((y) => (
              <circle key={`up-${col}-${y}`} cx={40 + col * 24} cy={y} r="3.5" fill="#d1d5db" />
            ))}
            {[170, 185, 200, 215, 230].map((y) => (
              <circle key={`dn-${col}-${y}`} cx={40 + col * 24} cy={y} r="3.5" fill="#d1d5db" />
            ))}
          </g>
        ))}

        {/* ESP32-Board (vereinfachtes Rechteck links) */}
        <g>
          <rect x="20" y="65" width="50" height="170" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <text x="45" y="155" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">ESP32</text>
          {/* Pin-Labels */}
          <text x="65" y="80" textAnchor="end" fill="#fca5a5" fontSize="7">3V3</text>
          <text x="65" y="100" textAnchor="end" fill="#86efac" fontSize="7">GPIO2</text>
          <text x="65" y="220" textAnchor="end" fill="#93c5fd" fontSize="7">GND</text>
        </g>

        {/* Widerstand 220Ω (waagerecht) */}
        <g transform="translate(155, 95)" opacity={dimOpacity(vis.resistor)}>
          {isActive(vis.resistor) && (
            <rect
              x="-20"
              y="-22"
              width="80"
              height="44"
              rx="6"
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            >
              <animate
                attributeName="stroke-opacity"
                values="1;0.3;1"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </rect>
          )}
          <rect x="0" y="-6" width="40" height="12" rx="2" fill="#fde68a" stroke="#a16207" strokeWidth="1" />
          <line x1="-15" y1="0" x2="0" y2="0" stroke="#9ca3af" strokeWidth="1.5" />
          <line x1="40" y1="0" x2="55" y2="0" stroke="#9ca3af" strokeWidth="1.5" />
          {/* Farbringe */}
          <rect x="6" y="-6" width="3" height="12" fill="#dc2626" />
          <rect x="12" y="-6" width="3" height="12" fill="#dc2626" />
          <rect x="18" y="-6" width="3" height="12" fill="#a16207" />
          <text x="20" y="-12" textAnchor="middle" fontSize="8" fill="#7c2d12">220 Ω</text>
        </g>

        {/* LED (rechts vom Widerstand) */}
        <g transform="translate(280, 95)" opacity={dimOpacity(vis.led)}>
          {isActive(vis.led) && (
            <rect
              x="-20"
              y="-22"
              width="40"
              height="60"
              rx="6"
              fill="#fef3c7"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 3"
            >
              <animate
                attributeName="stroke-opacity"
                values="1;0.3;1"
                dur="1.6s"
                repeatCount="indefinite"
              />
            </rect>
          )}
          {/* Glow */}
          <circle cx="0" cy="0" r="32" fill="url(#ledGlow)" />
          {/* Kuppe */}
          <circle
            cx="0"
            cy="0"
            r="10"
            fill={isOn ? led.core : "#9ca3af"}
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
          {/* Beine */}
          <line x1="-3" y1="10" x2="-3" y2="30" stroke="#9ca3af" strokeWidth="1.5" />
          <line x1="3" y1="10" x2="3" y2="30" stroke="#9ca3af" strokeWidth="1.5" />
          <text x="0" y="-15" textAnchor="middle" fontSize="9" fill="#1f2937">LED</text>
        </g>

        {/* Verkabelung */}
        {/* GPIO2 → Widerstand */}
        <path
          d="M 70 100 Q 110 100 140 95"
          fill="none"
          stroke={highlightWires.includes("signal") || isActive(vis.wireSignal) ? "#22c55e" : "#16a34a"}
          strokeWidth={highlightWires.includes("signal") || isActive(vis.wireSignal) ? "3" : "2"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireSignal)}
        />
        {/* Widerstand-Ende → LED Anode */}
        <line
          x1="210"
          y1="95"
          x2="277"
          y2="92"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
          opacity={vis.led === "dim" ? 0.18 : 1}
        />
        {/* LED Cathode → GND */}
        <path
          d="M 283 125 Q 283 200 50 220"
          fill="none"
          stroke={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "#3b82f6" : "#2563eb"}
          strokeWidth={highlightWires.includes("gnd") || isActive(vis.wireGnd) ? "3" : "2"}
          strokeLinecap="round"
          opacity={dimOpacity(vis.wireGnd)}
        />
      </svg>
    </div>
  );
}
