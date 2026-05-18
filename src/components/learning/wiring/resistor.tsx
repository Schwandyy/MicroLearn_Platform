"use client";

import { colX, ROW_Y_UPPER } from "./geometry";

// Farbringe nach Standardwerten (4-Band, 5% Toleranz = goldener Ring)
const BAND_COLORS_BY_VALUE: Record<string, [string, string, string, string]> = {
  // [Band1, Band2, Band3 (Multiplikator), Band4 (Toleranz)]
  "220":  ["#dc2626", "#dc2626", "#7c2d12", "#eab308"], // rot-rot-braun-gold
  "330":  ["#f97316", "#f97316", "#7c2d12", "#eab308"], // orange-orange-braun-gold
  "470":  ["#facc15", "#7c2d12", "#7c2d12", "#eab308"], // gelb-violett-braun-gold (technisch gelb-lila)
  "1000": ["#7c2d12", "#000000", "#dc2626", "#eab308"], // braun-schwarz-rot-gold
  "10000":["#7c2d12", "#000000", "#f97316", "#eab308"], // braun-schwarz-orange-gold
};

/**
 * 4-Band-Widerstand (Through-Hole) auf dem Breadboard. Sitzt zwischen zwei
 * Lochpositionen (leftCol → rightCol) in einer Brett-Reihe (Default Reihe a).
 *
 * Beispiel: <Resistor leftCol={17} rightCol={20} ohms="220" />
 */
export function Resistor({
  leftCol,
  rightCol,
  ohms = "220",
  row,
  labelAbove = true,
  hideLabel = false,
}: {
  leftCol: number;
  rightCol: number;
  ohms?: keyof typeof BAND_COLORS_BY_VALUE | string;
  /** Y-Koordinate der beiden Brett-Löcher. Default ROW_Y_UPPER[0] (Reihe a). */
  row?: number;
  labelAbove?: boolean;
  hideLabel?: boolean;
}) {
  const y = row ?? ROW_Y_UPPER[0];
  const cx = (colX(leftCol) + colX(rightCol)) / 2;
  const cy = y - 18;
  const bodyW = (colX(rightCol) - colX(leftCol)) * 0.75;
  const bodyH = 24;
  const bodyX = cx - bodyW / 2;
  const bodyY = cy - bodyH / 2;
  const ringW = 5;
  const bands = BAND_COLORS_BY_VALUE[ohms] ?? BAND_COLORS_BY_VALUE["220"]!;
  const formattedOhms = Number(ohms) >= 1000 ? `${Number(ohms) / 1000} kΩ` : `${ohms} Ω`;
  return (
    <g filter="url(#cmp-shadow)">
      <linearGradient id={`res-body-${leftCol}-${rightCol}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="50%" stopColor="#fde68a" />
        <stop offset="100%" stopColor="#d4a437" />
      </linearGradient>
      {/* Beinchen */}
      <line x1={colX(leftCol)} y1={y} x2={colX(leftCol) + 6} y2={y - 14} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <line x1={colX(rightCol)} y1={y} x2={colX(rightCol) - 6} y2={y - 14} stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      <circle cx={colX(leftCol)} cy={y} r="3" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
      <circle cx={colX(rightCol)} cy={y} r="3" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />
      {/* Drahtstummel innen */}
      <line x1={colX(leftCol) + 6} y1={cy} x2={bodyX} y2={cy} stroke="#cbd5e1" strokeWidth="2" />
      <line x1={bodyX + bodyW} y1={cy} x2={colX(rightCol) - 6} y2={cy} stroke="#cbd5e1" strokeWidth="2" />
      {/* Körper */}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={bodyH / 2} fill={`url(#res-body-${leftCol}-${rightCol})`} stroke="#92400e" strokeWidth="0.6" />
      {/* 4 Farbringe */}
      <rect x={bodyX + bodyW * 0.18} y={bodyY} width={ringW} height={bodyH} fill={bands[0]} />
      <rect x={bodyX + bodyW * 0.34} y={bodyY} width={ringW} height={bodyH} fill={bands[1]} />
      <rect x={bodyX + bodyW * 0.50} y={bodyY} width={ringW} height={bodyH} fill={bands[2]} />
      <rect x={bodyX + bodyW * 0.78} y={bodyY} width={ringW} height={bodyH} fill={bands[3]} />
      {/* Label */}
      {!hideLabel && (
        <text x={cx} y={labelAbove ? bodyY - 6 : bodyY + bodyH + 12} textAnchor="middle" fontSize="11" fontWeight="800" fill="#7c2d12" fontFamily="ui-monospace,monospace">
          {formattedOhms}
        </text>
      )}
    </g>
  );
}
