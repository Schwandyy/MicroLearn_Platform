// Geteilte Geometrie für alle Wiring-Diagramme — Standard AZ-Delivery-
// Hardware: 830-Pin Breadboard (MB-102, 60 Spalten + 10 Reihen + 2 Rails)
// und 38-Pin ESP32 NodeMCU DevKit V1 (19 Pins pro Seite, sitzt MIT
// Pin-Headern auf Brett-Reihe a + Brett-Reihe i, 28×56 mm).
//
// Alle Werte in SVG-Units. 1 SVG-Unit ≈ 0.115 mm (geschickt gerundet auf
// menschenlesbare Werte).

export const VB_W = 2000;
export const VB_H = 620;

// Breadboard — 60 sichtbare Spalten (echtes 830-Pin-Board hat 60-63 Spalten)
export const BB_X = 60;
export const BB_Y = 140;
export const BB_W = 1880;
export const BB_H = 360;
export const BB_COLS = 60;
export const BB_COL_DX = (BB_W - 80) / BB_COLS; // = 30 SVG-Units pro Spalte
export const BB_COL_X0 = BB_X + 50;

export const colX = (c: number) => BB_COL_X0 + c * BB_COL_DX;

// Y-Positionen — Reihen-Anordnung: Plus-Rail / a-e / Channel / f-j / Minus-Rail
export const PLUS_RAIL_Y = BB_Y + 16;
export const ROW_Y_UPPER = [200, 222, 244, 266, 288] as const; // a, b, c, d, e
export const CHANNEL_TOP = 300;
export const CHANNEL_BOTTOM = 340;
export const ROW_Y_LOWER = [352, 374, 396, 418, 440] as const; // f, g, h, i, j
export const MINUS_RAIL_Y = BB_Y + BB_H - 16;

// ESP32 DevKit V1 38-Pin — sitzt MIT Pin-Headern auf Reihe a (north) und
// Reihe i (south). PCB-Körper überspannt Reihen a-i (= 9 Reihen vertikal,
// inkl. Mittelrille). Pin-Header-Spannweite a→i ≈ 22.86 mm, passt zum
// echten Board-Maß 28 mm × 56 mm.
export const ESP_FIRST_COL = 0;        // Pin 1 sitzt in Brett-Spalte 1 (= colX(0))
export const ESP_LAST_COL = 18;        // 19 Pins → letzter in Spalte 19
export const ESP_PIN_COUNT = 19;

// ESP-PCB ist real 56mm × 28mm — 56mm Länge ragt 3.9mm über die Pin-Spannweite
// hinaus. Daher ESP_BODY_X = colX(0)-50 (Padding links für USB-seitigen Über-
// hang) und ESP_BODY_W = Pin-Spannweite + 80 (50 links + 30 rechts Padding).
export const ESP_BODY_X = colX(ESP_FIRST_COL) - 50;
export const ESP_BODY_Y = ROW_Y_UPPER[0] - 8;
export const ESP_BODY_W = colX(ESP_LAST_COL) - colX(ESP_FIRST_COL) + 80;
export const ESP_BODY_H = ROW_Y_LOWER[3] - ROW_Y_UPPER[0] + 16;

// Pin-Layout AZ-Delivery 38-Pin ESP32 NodeMCU DevKit V1
// Quelle: offizielles Pinout-PDF (ESP-32_NodeMCU_Developmentboard_Pinout.pdf)
// USB-Anschluss ist auf der LINKEN Schmalseite des Renderers (Spalte 0-Ende).
//
// NORTH = Brett-Reihe a (oberer Pin-Header beim Renderer).
//   Original-Layout USB-unten = "rechte Pin-Reihe oben→unten".
//   Bei 90°-Rotation gegen Uhrzeigersinn (USB nach links) → Renderer-OBERE
//   Pin-Reihe von LINKS (USB-Ende) nach RECHTS (weit weg vom USB):
export const PIN_NORTH_LABELS = [
  "GND", "D23", "D22", "TX0", "RX0", "D21", "D19", "D18", "D5", "TX2",
  "RX2", "D4", "D2", "D15", "GND", "CLK", "SD0", "SD1", "3V3",
] as const;
// SOUTH = Brett-Reihe i (unterer Pin-Header). Entspricht Original-Layout
//   USB-unten "linke Pin-Reihe oben→unten", rotiert → Renderer-UNTERE Pin-
//   Reihe von LINKS nach RECHTS:
export const PIN_SOUTH_LABELS = [
  "3V3", "EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26",
  "D27", "D14", "D12", "GND", "D13", "SD2", "SD3", "CMD", "5V",
] as const;

// Hilfs-Lookups für Lesson-Code: über Pin-Name die Spalte finden.
export function findNorthCol(label: string): number {
  return PIN_NORTH_LABELS.indexOf(label as never);
}
export function findSouthCol(label: string): number {
  return PIN_SOUTH_LABELS.indexOf(label as never);
}

// Pin-Side-Konvention: "north" sitzt in Reihe a, "south" in Reihe i.
export type EspPinSide = "north" | "south";

export interface EspPinRef {
  col: number; // 0..18
  side: EspPinSide;
}

/** Y-Koordinate des Pin-Loches (NICHT des Pin-Bodys). */
export function espPinY(side: EspPinSide): number {
  return side === "north" ? ROW_Y_UPPER[0] : ROW_Y_LOWER[3];
}

export interface ActivePin extends EspPinRef {
  /** Farb-Token für Pin-Rand + Silkscreen-Label */
  tone: "signal" | "ground" | "power3v3" | "power5v" | "neutral";
  /** Optional: floating Callout mit großer Pille außerhalb des Bretts */
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
