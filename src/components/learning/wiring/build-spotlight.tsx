"use client";

import { BB_COL_X0, BB_COL_DX, BB_Y, ROW_Y_UPPER, MINUS_RAIL_Y, BB_H } from "./geometry";

/**
 * BUILD-Step-Spotlight: pulsierender Highlight-Kreis am Ziel-Loch + große
 * „Spalte X"-Pille im Padding über dem Brett. Der Schüler sieht so sofort
 * die Ziel-Position und muss nicht im 5er-Raster zählen.
 *
 * Default-Position ist Reihe a (= ROW_Y_UPPER[0]). Für andere Reihen oder
 * für die Pin-Reihe (oben/unten am ESP32) Pose `row` setzen.
 */
export function BuildSpotlight({
  col,
  colLabel,
  subLabel,
  row,
}: {
  col: number;
  colLabel: string;
  subLabel?: string;
  /** Y-Koordinate des Highlights. Default = Reihe a (ROW_Y_UPPER[0]). */
  row?: number;
}) {
  const cx = BB_COL_X0 + col * BB_COL_DX;
  const cy = row ?? ROW_Y_UPPER[0];
  return (
    <g>
      <line
        x1={cx}
        y1={BB_Y - 4}
        x2={cx}
        y2={cy - 14}
        stroke="#d97706"
        strokeWidth="1.4"
        strokeDasharray="3 3"
      />
      <circle cx={cx} cy={cy} r="11" fill="#fbbf24" fillOpacity="0.55">
        <animate attributeName="r" values="9;15;9" dur="1.3s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="5" fill="#f59e0b" stroke="#92400e" strokeWidth="0.8" />
      <rect
        x={cx - 36}
        y={BB_Y - 26}
        width="72"
        height="22"
        rx="6"
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth="1.4"
      />
      <text
        x={cx}
        y={BB_Y - 11}
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#92400e"
        fontFamily="ui-monospace,monospace"
      >
        Spalte {colLabel}
      </text>
      {subLabel && (
        <g>
          <rect
            x={cx - 54}
            y={cy + 14}
            width="108"
            height="16"
            rx="5"
            fill="#fffbeb"
            stroke="#d97706"
            strokeWidth="1"
          />
          <text
            x={cx}
            y={cy + 25}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#92400e"
            fontFamily="ui-monospace,monospace"
          >
            {subLabel}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Spotlight für einen ESP32-Pin (unterhalb des Bretts auf Reihe j-Höhe).
 * Wir nehmen den Brett-Y-Offset MINUS_RAIL_Y nicht direkt, weil das Spotlight
 * über dem Pin sitzt — daher hier eigene Y-Position passend zum Pin.
 */
export function PinSpotlight({
  col,
  colLabel,
  subLabel,
  row,
}: {
  col: number;
  colLabel: string;
  subLabel?: string;
  /** Y-Koordinate (z.B. ROW_Y_LOWER[4] für unteren Pin-Header). */
  row: number;
}) {
  const cx = BB_COL_X0 + col * BB_COL_DX;
  return (
    <g>
      <line
        x1={cx}
        y1={BB_Y - 4}
        x2={cx}
        y2={row + 14}
        stroke="#d97706"
        strokeWidth="1.4"
        strokeDasharray="3 3"
      />
      <circle cx={cx} cy={row} r="11" fill="#fbbf24" fillOpacity="0.55">
        <animate attributeName="r" values="9;15;9" dur="1.3s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={row} r="5" fill="#f59e0b" stroke="#92400e" strokeWidth="0.8" />
      <rect
        x={cx - 36}
        y={BB_Y - 26}
        width="72"
        height="22"
        rx="6"
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth="1.4"
      />
      <text
        x={cx}
        y={BB_Y - 11}
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#92400e"
        fontFamily="ui-monospace,monospace"
      >
        Spalte {colLabel}
      </text>
      {subLabel && (
        <g>
          <rect
            x={cx - 54}
            y={row + 18}
            width="108"
            height="16"
            rx="5"
            fill="#fffbeb"
            stroke="#d97706"
            strokeWidth="1"
          />
          <text
            x={cx}
            y={row + 29}
            textAnchor="middle"
            fontSize="9"
            fontWeight="800"
            fill="#92400e"
            fontFamily="ui-monospace,monospace"
          >
            {subLabel}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Spotlight an der Minus- oder Plus-Schiene (für GND/3V3-Verbindungen).
 * Setzt die Pille unter (für Minus) oder über (für Plus) der Schiene.
 */
export function RailSpotlight({
  col,
  rail,
  label,
}: {
  col: number;
  rail: "plus" | "minus";
  label: string;
}) {
  const cx = BB_COL_X0 + col * BB_COL_DX;
  const cy = rail === "minus" ? MINUS_RAIL_Y + 7 : BB_Y + 23;
  return (
    <g>
      <circle cx={cx} cy={cy} r="11" fill="#fbbf24" fillOpacity="0.55">
        <animate attributeName="r" values="9;15;9" dur="1.3s" repeatCount="indefinite" />
      </circle>
      <circle cx={cx} cy={cy} r="5" fill="#f59e0b" stroke="#92400e" strokeWidth="0.8" />
      <rect
        x={cx - 54}
        y={rail === "minus" ? cy + 14 : cy - 30}
        width="108"
        height="16"
        rx="5"
        fill="#fffbeb"
        stroke="#d97706"
        strokeWidth="1"
      />
      <text
        x={cx}
        y={rail === "minus" ? cy + 25 : cy - 19}
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill="#92400e"
        fontFamily="ui-monospace,monospace"
      >
        {label}
      </text>
    </g>
  );
}

// re-export BB_H für Konsumenten die nur diese Datei importieren
export { BB_H };
