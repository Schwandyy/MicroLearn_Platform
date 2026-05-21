// Geteilte Geometrie für alle Wiring-Diagramme — Generische Hardware:
// 830-Pin Breadboard (MB-102, 60 Spalten + 10 Reihen + 2 Rails)
// und ESP32 NodeMCU DevKit V1 in zwei Varianten:
//   • 38-Pin (0.9-inch DIP, überspannt Brett-Reihen a + i)
//   • 30-Pin (DOIT, 0.7-inch DIP, sitzt auf Brett-Reihen e + f
//     wie ein klassischer DIP-Chip über der Mittelrille)
//
// Alle Werte in SVG-Units.

export const VB_W = 2000;
export const VB_H = 620;

// === Breadboard MB-102 ===
export const BB_X = 60;
export const BB_Y = 140;
export const BB_W = 1880;
export const BB_H = 360;
export const BB_COLS = 60;
export const BB_COL_DX = (BB_W - 80) / BB_COLS; // 30 SVG/Spalte
export const BB_COL_X0 = BB_X + 50;
export const colX = (c: number) => BB_COL_X0 + c * BB_COL_DX;

// === Y-Positionen ===
export const PLUS_RAIL_Y = BB_Y + 16;
export const ROW_Y_UPPER = [200, 222, 244, 266, 288] as const; // a, b, c, d, e
export const CHANNEL_TOP = 300;
export const CHANNEL_BOTTOM = 340;
export const ROW_Y_LOWER = [352, 374, 396, 418, 440] as const; // f, g, h, i, j
export const MINUS_RAIL_Y = BB_Y + BB_H - 16;

// === Pin-Side-Konvention ===
// NORTH sitzt auf Brett-Reihe a (38-Pin) bzw. e (30-Pin) — also oben.
// SOUTH sitzt auf Brett-Reihe i (38-Pin) bzw. f (30-Pin) — also unten.
export type EspPinSide = "north" | "south";

export interface EspPinRef {
  col: number;
  side: EspPinSide;
}

export interface ActivePin extends EspPinRef {
  tone: "signal" | "ground" | "power3v3" | "power5v" | "neutral";
  callout?: {
    title: string;
    subtitle: string;
  };
}

export const TONE_COLORS: Record<ActivePin["tone"], { stroke: string; text: string; light: string; dark: string }> = {
  signal:   { stroke: "#15803d", text: "#15803d", light: "#86efac", dark: "#15803d" },
  ground:   { stroke: "#1d4ed8", text: "#1d4ed8", light: "#93c5fd", dark: "#1d4ed8" },
  power3v3: { stroke: "#b91c1c", text: "#b91c1c", light: "#fca5a5", dark: "#b91c1c" },
  power5v:  { stroke: "#92400e", text: "#92400e", light: "#fcd34d", dark: "#92400e" },
  neutral:  { stroke: "#92400e", text: "#cbd5e1", light: "#cbd5e1", dark: "#92400e" },
};

// === Board-Varianten ===
export type BoardVariantSlug = "esp32-38pin" | "esp32-30pin";

export interface BoardVariant {
  slug: BoardVariantSlug;
  /** Anzeige-Label im Picker (lang). */
  label: string;
  /** Kurz-Label für kompakte UI. */
  shortLabel: string;
  pinCount: number;
  /** NORTH-Reihe (oberer Pin-Header), LINKS→RECHTS (USB-Ende zuerst). */
  northLabels: readonly string[];
  /** SOUTH-Reihe (unterer Pin-Header). */
  southLabels: readonly string[];
  /** ROW_Y_UPPER-Index für NORTH (0=a, 4=e) */
  northRowYIndex: 0 | 1 | 2 | 3 | 4;
  /** ROW_Y_LOWER-Index für SOUTH (0=f, 3=i, 4=j) */
  southRowYIndex: 0 | 1 | 2 | 3 | 4;
}

export const BOARD_VARIANTS: Record<BoardVariantSlug, BoardVariant> = {
  "esp32-38pin": {
    slug: "esp32-38pin",
    label: "ESP32 NodeMCU DevKit V1 — 38-Pin",
    shortLabel: "38-Pin",
    pinCount: 19,
    // USB-OBEN-Layout um 90° gegen den Uhrzeigersinn gedreht (= USB links im Renderer)
    northLabels: [
      "GND", "D23", "D22", "TX0", "RX0", "D21", "D19", "D18", "D5", "TX2",
      "RX2", "D4", "D2", "D15", "GND", "CLK", "SD0", "SD1", "3V3",
    ],
    southLabels: [
      "3V3", "EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26",
      "D27", "D14", "D12", "GND", "D13", "SD2", "SD3", "CMD", "5V",
    ],
    northRowYIndex: 0, // Reihe a
    southRowYIndex: 3, // Reihe i
  },
  "esp32-30pin": {
    slug: "esp32-30pin",
    label: "ESP32 NodeMCU DevKit — 30-Pin (DOIT / schmal)",
    shortLabel: "30-Pin",
    pinCount: 15,
    northLabels: [
      "3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5", "D18", "D19",
      "D21", "RX0", "TX0", "D22", "D23",
    ],
    southLabels: [
      "EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26", "D27",
      "D14", "D12", "D13", "GND", "VIN",
    ],
    northRowYIndex: 4, // Reihe e
    southRowYIndex: 0, // Reihe f
  },
};

export const DEFAULT_BOARD_VARIANT: BoardVariantSlug = "esp32-38pin";

// === Helper-Funktionen ===

/** Y-Loch-Koordinate für die NORTH-/SOUTH-Pin-Header einer Variante. */
export function getPinY(variant: BoardVariant, side: EspPinSide): number {
  if (side === "north") return ROW_Y_UPPER[variant.northRowYIndex];
  return ROW_Y_LOWER[variant.southRowYIndex];
}

/** ESP-Body-Maße einer Variante. */
export function getEspBodyForVariant(variant: BoardVariant) {
  const firstCol = 0;
  const lastCol = variant.pinCount - 1;
  const northY = ROW_Y_UPPER[variant.northRowYIndex];
  const southY = ROW_Y_LOWER[variant.southRowYIndex];
  return {
    x: colX(firstCol) - 50,
    y: northY - 8,
    w: colX(lastCol) - colX(firstCol) + 80,
    h: southY - northY + 16,
    firstCol,
    lastCol,
  };
}

/** Brett-Spalten-Index eines Pin-Labels innerhalb einer Variante. */
export function findPinCol(variant: BoardVariant, side: EspPinSide, label: string): number {
  const list = side === "north" ? variant.northLabels : variant.southLabels;
  return list.indexOf(label);
}

// === Backwards-compat: alte Konstanten für nicht-variant-aware Code ===
export const PIN_NORTH_LABELS = BOARD_VARIANTS["esp32-38pin"].northLabels;
export const PIN_SOUTH_LABELS = BOARD_VARIANTS["esp32-38pin"].southLabels;
export const ESP_PIN_COUNT = BOARD_VARIANTS["esp32-38pin"].pinCount;
export const ESP_FIRST_COL = 0;
export const ESP_LAST_COL = BOARD_VARIANTS["esp32-38pin"].pinCount - 1;
export const ESP_BODY_X = colX(ESP_FIRST_COL) - 50;
export const ESP_BODY_Y = ROW_Y_UPPER[0] - 8;
export const ESP_BODY_W = colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) + 80;
export const ESP_BODY_H = ROW_Y_LOWER[3] - ROW_Y_UPPER[0] + 16;

/** 38-Pin-only espPinY (Backwards-compat). */
export function espPinY(side: EspPinSide): number {
  return side === "north" ? ROW_Y_UPPER[0] : ROW_Y_LOWER[3];
}

/** Pin-Index nur für 38-Pin-Variante (Backwards-compat). */
export function findNorthCol(label: string): number {
  return PIN_NORTH_LABELS.indexOf(label);
}
export function findSouthCol(label: string): number {
  return PIN_SOUTH_LABELS.indexOf(label);
}

/** Pin-Label → GPIO-Nummer (für CODE_WALK, Highlight-Lookup etc.). */
export const LABEL_TO_GPIO: Record<string, number> = {
  D2: 2, D4: 4, D5: 5, D12: 12, D13: 13, D14: 14, D15: 15,
  D18: 18, D19: 19, D21: 21, D22: 22, D23: 23,
  D25: 25, D26: 26, D27: 27, D32: 32, D33: 33, D34: 34, D35: 35,
  VP: 36, VN: 39,
  TX0: 1, RX0: 3, TX2: 17, RX2: 16,
  SD0: 7, SD1: 8, SD2: 9, SD3: 10, CLK: 6, CMD: 11,
};

export function getGpioForLabel(label: string): number | undefined {
  return LABEL_TO_GPIO[label];
}
