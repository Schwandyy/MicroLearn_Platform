"use client";

/**
 * Wire — rendert einen Jumper-Wire-Pfad mit Schatten, dunklem Rand, hellem
 * Kern und optionalem Strom-Flow. Stelle den `path` als SVG-Path-d-String.
 *
 * Geteilt zwischen allen Lesson-Schaltbildern (blink, button, pwm, …) damit
 * Kabel überall identisch aussehen.
 */
export function Wire({
  color,
  darkColor,
  path,
  animated,
}: {
  color: string;
  darkColor: string;
  path: string;
  animated?: boolean;
}) {
  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.18"
        transform="translate(0, 1.5)"
      />
      <path
        d={path}
        fill="none"
        stroke={darkColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {animated && (
        <path
          d={path}
          fill="none"
          stroke="#fff7d6"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.85"
          className="current-flow"
        />
      )}
    </g>
  );
}

// Vordefinierte Wire-Farben — pro Funktion, damit Lessons konsistent kodieren.
export const WIRE_COLORS = {
  signalGreen: { color: "#22c55e", darkColor: "#15803d" },
  signalYellow: { color: "#facc15", darkColor: "#a16207" },
  signalOrange: { color: "#fb923c", darkColor: "#c2410c" },
  signalPurple: { color: "#a855f7", darkColor: "#7c3aed" },
  power3v3:    { color: "#f87171", darkColor: "#dc2626" }, // rot — 3V3
  powerVin:    { color: "#fb923c", darkColor: "#ea580c" }, // orange — VIN
  ground:      { color: "#3b82f6", darkColor: "#1d4ed8" }, // blau — GND
  data:        { color: "#22c55e", darkColor: "#15803d" }, // grün — Daten / SIG
} as const;
