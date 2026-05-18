// Geteilte Geometrie für alle Wiring-Diagramme (Breadboard + ESP32 DevKit V1).
// Alle Werte in SVG-Units, viewBox = VB_W × VB_H.
// Lesson-spezifische Komponenten (LED, Resistor, Button …) importieren colX
// und ROW_Y_UPPER/_LOWER und positionieren sich darüber.

export const VB_W = 1100;
export const VB_H = 620;

// Breadboard (MB-102 Hälfte, 30 sichtbare Spalten)
export const BB_X = 60;
export const BB_Y = 140;
export const BB_W = 980;
export const BB_H = 360;
export const BB_COLS = 30;
export const BB_COL_DX = (BB_W - 80) / BB_COLS;
export const BB_COL_X0 = BB_X + 50;

export const colX = (c: number) => BB_COL_X0 + c * BB_COL_DX;

// Y-Positionen
export const PLUS_RAIL_Y = BB_Y + 16;
export const ROW_Y_UPPER = [200, 222, 244, 266, 288] as const; // a, b, c, d, e
export const CHANNEL_TOP = 300;
export const CHANNEL_BOTTOM = 340;
export const ROW_Y_LOWER = [352, 374, 396, 418, 440] as const; // f, g, h, i, j
export const MINUS_RAIL_Y = BB_Y + BB_H - 16;

// ESP32 DevKit V1 — sitzt MIT Pin-Reihen auf row e + row f, body überspannt Channel.
// 15 Pins pro Seite, USB-Anschluss links außen (außerhalb des PCB).
export const ESP_FIRST_COL = 0;
export const ESP_LAST_COL = 14;
export const ESP_BODY_X = colX(ESP_FIRST_COL) - 10;
export const ESP_BODY_Y = ROW_Y_UPPER[4] - 6;
export const ESP_BODY_W = colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) + 20;
export const ESP_BODY_H = ROW_Y_LOWER[0] - ROW_Y_UPPER[4] + 12;

// Silkscreen-Pin-Labels wie auf echtem AZ-Delivery-DevKit-V1.
// BOTTOM-Reihe steht auf Brett-Reihe e (oben am Modul), TOP-Reihe auf Reihe f.
export const BOTTOM_PIN_LABELS = [
  "3V3", "GND", "D15", "D2", "D4", "RX2", "TX2", "D5",
  "D18", "D19", "D21", "RX0", "TX0", "D22", "D23",
] as const;
export const TOP_PIN_LABELS = [
  "VIN", "GND", "D13", "D12", "D14", "D27", "D26", "D25",
  "D33", "D32", "D35", "D34", "VN", "VP", "EN",
] as const;

// Pin-Side: "bottom" = sitzt in Brett-Reihe e (= ROW_Y_UPPER[4]), Pin geht nach UNTEN.
// "top" = sitzt in Brett-Reihe f (= ROW_Y_LOWER[0]), Pin geht nach OBEN auf der Brett-Skala.
// Auf der Visual-Y-Achse ist `bottom` näher an der oberen Schiene (PLUS_RAIL_Y).
export type EspPinSide = "bottom" | "top";

export interface EspPinRef {
  col: number; // 0..14
  side: EspPinSide;
}

// Y-Position eines ESP32-Pins (Loch-Y, nicht Pin-Body-Y).
export function espPinY(side: EspPinSide): number {
  return side === "bottom" ? ROW_Y_UPPER[4] : ROW_Y_LOWER[0];
}

// Convenience: aktive Pins können zusätzlich farbig markiert werden (siehe BreadboardCanvas).
export interface ActivePin extends EspPinRef {
  /** Farb-Token für Pin-Rand + Silkscreen-Label */
  tone: "signal" | "ground" | "power3v3" | "powerVin" | "neutral";
  /** Optional: floating Callout mit großer Pille außerhalb des Bretts */
  callout?: {
    title: string; // "GPIO 2"
    subtitle: string; // "Signal-Pin"
  };
}

export const TONE_COLORS: Record<ActivePin["tone"], { stroke: string; text: string; light: string; dark: string }> = {
  signal:    { stroke: "#15803d", text: "#15803d", light: "#86efac", dark: "#15803d" },
  ground:    { stroke: "#1d4ed8", text: "#1d4ed8", light: "#93c5fd", dark: "#1d4ed8" },
  power3v3:  { stroke: "#b91c1c", text: "#b91c1c", light: "#fca5a5", dark: "#b91c1c" },
  powerVin:  { stroke: "#92400e", text: "#92400e", light: "#fcd34d", dark: "#92400e" },
  neutral:   { stroke: "#92400e", text: "#cbd5e1", light: "#cbd5e1", dark: "#92400e" },
};
