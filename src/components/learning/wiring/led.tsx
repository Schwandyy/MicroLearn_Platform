"use client";

import { colX, ROW_Y_UPPER } from "./geometry";

type LedColor = "red" | "yellow" | "green" | "blue" | "white";

const LED_PALETTE: Record<LedColor, { dome: string; bright: string; mid: string; dark: string; glow: string }> = {
  red:    { dome: "url(#led-dome-red)",    bright: "#fca5a5", mid: "#dc2626", dark: "#7f1d1d", glow: "#fca5a5" },
  yellow: { dome: "url(#led-dome-yellow)", bright: "#fef08a", mid: "#eab308", dark: "#854d0e", glow: "#fef08a" },
  green:  { dome: "url(#led-dome-green)",  bright: "#86efac", mid: "#16a34a", dark: "#14532d", glow: "#86efac" },
  blue:   { dome: "url(#led-dome-blue)",   bright: "#bfdbfe", mid: "#2563eb", dark: "#1e3a8a", glow: "#bfdbfe" },
  white:  { dome: "url(#led-dome-white)",  bright: "#f8fafc", mid: "#cbd5e1", dark: "#64748b", glow: "#fefce8" },
};

/**
 * 5mm Through-Hole-LED mit langem Anoden-Bein (links) und kurzem
 * Kathoden-Bein (rechts). Sitzt zwischen zwei Brett-Löchern (anodeCol → cathodeCol).
 *
 * <Led anodeCol={20} cathodeCol={21} color="red" on animation="blink" />
 *
 * WICHTIG: Wenn `animation === "blink"` darf der Wrapper-Canvas die
 * `@keyframes led-pulse` + `@keyframes glow-pulse` definieren (siehe extraDefs).
 */
export function Led({
  anodeCol,
  cathodeCol,
  color = "red",
  on = false,
  animation = "off",
  row,
}: {
  anodeCol: number;
  cathodeCol: number;
  color?: LedColor;
  on?: boolean;
  animation?: "off" | "solid" | "blink";
  /** Y-Koordinate der beiden Brett-Löcher. Default ROW_Y_UPPER[0] (Reihe a). */
  row?: number;
}) {
  const y = row ?? ROW_Y_UPPER[0];
  const cx = (colX(anodeCol) + colX(cathodeCol)) / 2;
  const cy = y - 36;
  const palette = LED_PALETTE[color];
  const isAnimated = animation === "blink";
  const isOn = on && animation !== "off";
  return (
    <g filter="url(#cmp-shadow)">
      <defs>
        {/* Dome-Gradient */}
        <radialGradient id={`led-dome-${color}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor={palette.bright} />
          <stop offset="60%" stopColor={palette.mid} />
          <stop offset="100%" stopColor={palette.dark} />
        </radialGradient>
        {/* Glow */}
        <radialGradient id={`led-glow-${color}-${anodeCol}-${cathodeCol}`}>
          <stop offset="0%" stopColor={palette.bright} stopOpacity={isOn ? 0.95 : 0} />
          <stop offset="40%" stopColor={palette.mid} stopOpacity={isOn ? 0.5 : 0} />
          <stop offset="100%" stopColor={palette.mid} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* Glow-Halo */}
      {isOn && (
        <circle
          cx={cx}
          cy={cy}
          r="48"
          fill={`url(#led-glow-${color}-${anodeCol}-${cathodeCol})`}
          className={isAnimated ? "glow-on" : undefined}
        />
      )}
      {/* Beinchen */}
      <line x1={colX(anodeCol)} y1={y} x2={colX(anodeCol)} y2={y - 28} stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
      <line x1={colX(cathodeCol)} y1={y} x2={colX(cathodeCol)} y2={y - 22} stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx={colX(anodeCol)} cy={y} r="3.4" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
      <circle cx={colX(cathodeCol)} cy={y} r="3.4" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
      {/* Basis-Flansch */}
      <ellipse cx={cx} cy={cy + 12} rx="20" ry="5" fill="#1f2937" />
      {/* Halbkugel */}
      <circle
        cx={cx}
        cy={cy}
        r="18"
        fill={isOn ? palette.dome : "#e2e8f0"}
        stroke={palette.dark}
        strokeWidth="1.4"
        className={isOn && isAnimated ? "led-on" : undefined}
      />
      {/* Reflexion */}
      <ellipse cx={cx - 6} cy={cy - 7} rx="4" ry="6.5" fill={palette.bright} opacity={isOn ? 0.85 : 0.55} />
      {/* Polarität */}
      <text x={colX(cathodeCol) + 10} y={y - 40} textAnchor="start" fontSize="11" fontWeight="900" fill={palette.dark}>−</text>
      <text x={colX(anodeCol) - 10} y={y - 40} textAnchor="end" fontSize="11" fontWeight="900" fill="#15803d">+</text>
      <text x={cx} y={cy + 24} textAnchor="middle" fontSize="9" fontWeight="700" fill={palette.dark} fontFamily="ui-monospace,monospace">LED</text>
    </g>
  );
}

/**
 * Lokales CSS für die LED-Blink-Animation. Wird vom Canvas als `extraDefs`
 * eingebettet. Separat, damit Lessons ohne Blink-LED keinen unbenutzten CSS
 * Block tragen.
 */
export const LED_BLINK_CSS = `
  .led-on { animation: led-pulse 1s infinite; transform-origin: center; }
  @keyframes led-pulse {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0.15; }
  }
  .glow-on { animation: glow-pulse 1s infinite; }
  @keyframes glow-pulse {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
`;
