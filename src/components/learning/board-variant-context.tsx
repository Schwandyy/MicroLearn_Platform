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

/** Welche Brett-Reihen-Labels haben User-eine Klick-Aktion auf diesem Visual? */
export function isSelectablePin(label: string): boolean {
  if (SELECTABLE_SIGNAL_PINS.has(label)) return true;
  if (label === "RX2") return SELECTABLE_SIGNAL_PINS.has("D16");
  if (label === "TX2") return SELECTABLE_SIGNAL_PINS.has("D17");
  return false;
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
