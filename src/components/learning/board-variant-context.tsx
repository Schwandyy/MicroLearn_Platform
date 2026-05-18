"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  BOARD_VARIANTS,
  DEFAULT_BOARD_VARIANT,
  type BoardVariant,
  type BoardVariantSlug,
} from "./wiring";

const VARIANT_STORAGE_KEY = "microlearn.boardVariant";
const SIGNAL_PIN_STORAGE_KEY = "microlearn.signalPin";

/** Default-Signal-Pin für die Blink-Lesson. */
export const DEFAULT_SIGNAL_PIN = "D2";

/**
 * Welche Pins sind als Signal-Pin (digitalWrite-Output) erlaubt?
 * - D6-D11 (SD0-SD3, CLK, CMD) gehören zum internen Flash → ausgeschlossen
 * - D34/D35/VP/VN sind input-only auf ESP32 → ausgeschlossen
 * - 3V3/GND/5V/VIN sind Power → ausgeschlossen
 * - RX0/TX0 sind UART (Serial-Monitor) → erlaubt aber mit Warnung
 * - EN ist Reset-Pin → ausgeschlossen
 */
export const SELECTABLE_SIGNAL_PINS = new Set([
  "D2", "D4", "D5", "D12", "D13", "D14", "D15",
  "D16", "D17", // = RX2/TX2 — sind auch nutzbar als Output
  "D18", "D19", "D21", "D22", "D23",
  "D25", "D26", "D27", "D32", "D33",
]);

/** Pin-Kategorie — wofür ist der Pin gut. */
export type PinCategory = "signal" | "power" | "ground" | "input-only" | "flash" | "uart" | "reset";

/** Kategorisiert ein Pin-Label, damit das UI passenden Klick-Effekt liefert. */
export function getPinCategory(label: string): PinCategory {
  if (SELECTABLE_SIGNAL_PINS.has(label)) return "signal";
  if (label === "RX2" || label === "TX2") return "signal"; // = D16/D17 alias
  if (label === "RX0" || label === "TX0") return "uart";
  if (label === "GND") return "ground";
  if (label === "3V3" || label === "5V" || label === "VIN") return "power";
  if (label === "EN") return "reset";
  if (label === "VP" || label === "VN" || label === "D34" || label === "D35") return "input-only";
  if (label === "SD0" || label === "SD1" || label === "SD2" || label === "SD3" || label === "CMD" || label === "CLK") return "flash";
  return "signal";
}

/** Erklärungs-Text pro Pin-Kategorie. Wird im Pin-Visual als Inline-Info gezeigt. */
export const PIN_CATEGORY_INFO: Record<PinCategory, { title: string; subtitle: string; canBeSignal: boolean }> = {
  signal:       { title: "Signal-Pin",        subtitle: "Kann an/aus geschaltet werden (digitalWrite). Klick wählt diesen Pin für die Lesson aus.", canBeSignal: true },
  power:        { title: "Power-Pin",          subtitle: "Liefert Strom (3,3 V oder 5 V). Wird nicht gesteuert — verbindet du z. B. mit der Plus-Schiene.", canBeSignal: false },
  ground:       { title: "Masse-Pin (GND)",    subtitle: "Minus-Anschluss. Wird in jeder Schaltung gebraucht — Verbindung zur Minus-Schiene.", canBeSignal: false },
  "input-only": { title: "Input-only-Pin",     subtitle: "Kann nur LESEN (z. B. Sensoren), nicht steuern. Für LEDs nicht geeignet.", canBeSignal: false },
  flash:        { title: "Flash-Pin",          subtitle: "Wird intern für den Programm-Speicher gebraucht. Finger weg — sonst startet der ESP32 nicht.", canBeSignal: false },
  uart:         { title: "Serial-Monitor-Pin", subtitle: "Wird vom USB-Anschluss für die Programmierung genutzt. Klick wählt diesen Pin, aber er kollidiert mit dem Serial-Monitor.", canBeSignal: true },
  reset:        { title: "Reset-Pin (EN)",     subtitle: "Startet den ESP32 neu wenn gedrückt. Nicht für Schaltungen.", canBeSignal: false },
};

/** Ob ein Pin als Signal verwendet werden kann (Default-Klick-Verhalten). */
export function isSelectablePin(label: string): boolean {
  return PIN_CATEGORY_INFO[getPinCategory(label)].canBeSignal;
}

interface BoardVariantContextValue {
  variant: BoardVariant;
  variantSlug: BoardVariantSlug;
  setVariant: (slug: BoardVariantSlug) => void;
  /** Aktuell für die Lesson gewählter Signal-Pin (Label wie "D2", "D4", …). */
  signalPinLabel: string;
  setSignalPinLabel: (label: string) => void;
}

const BoardVariantContext = createContext<BoardVariantContextValue | null>(null);

export function BoardVariantProvider({ children }: { children: ReactNode }) {
  const [variantSlug, setVariantSlug] = useState<BoardVariantSlug>(DEFAULT_BOARD_VARIANT);
  const [signalPinLabel, setSignalPinLabelState] = useState<string>(DEFAULT_SIGNAL_PIN);

  // Hydrate aus LocalStorage nach Mount
  useEffect(() => {
    try {
      const storedVariant = localStorage.getItem(VARIANT_STORAGE_KEY);
      if (storedVariant && storedVariant in BOARD_VARIANTS) {
        setVariantSlug(storedVariant as BoardVariantSlug);
      }
      const storedSignal = localStorage.getItem(SIGNAL_PIN_STORAGE_KEY);
      if (storedSignal && isSelectablePin(storedSignal)) {
        setSignalPinLabelState(storedSignal);
      }
    } catch {
      // localStorage unverfügbar — ignore
    }
  }, []);

  const setVariant = useCallback((slug: BoardVariantSlug) => {
    setVariantSlug(slug);
    try {
      localStorage.setItem(VARIANT_STORAGE_KEY, slug);
    } catch {
      // ignore
    }
  }, []);

  const setSignalPinLabel = useCallback((label: string) => {
    if (!isSelectablePin(label)) return;
    setSignalPinLabelState(label);
    try {
      localStorage.setItem(SIGNAL_PIN_STORAGE_KEY, label);
    } catch {
      // ignore
    }
  }, []);

  const variant = BOARD_VARIANTS[variantSlug];

  return (
    <BoardVariantContext.Provider
      value={{ variant, variantSlug, setVariant, signalPinLabel, setSignalPinLabel }}
    >
      {children}
    </BoardVariantContext.Provider>
  );
}

/** Hook für Lesson-Components — liefert immer eine gültige Variante + signalPin. */
export function useBoardVariant(): BoardVariantContextValue {
  const ctx = useContext(BoardVariantContext);
  if (ctx) return ctx;
  return {
    variant: BOARD_VARIANTS[DEFAULT_BOARD_VARIANT],
    variantSlug: DEFAULT_BOARD_VARIANT,
    setVariant: () => {},
    signalPinLabel: DEFAULT_SIGNAL_PIN,
    setSignalPinLabel: () => {},
  };
}
