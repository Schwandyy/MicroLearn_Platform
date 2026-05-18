"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  BOARD_VARIANTS,
  DEFAULT_BOARD_VARIANT,
  type BoardVariant,
  type BoardVariantSlug,
} from "./wiring";

const STORAGE_KEY = "microlearn.boardVariant";

interface BoardVariantContextValue {
  variant: BoardVariant;
  variantSlug: BoardVariantSlug;
  setVariant: (slug: BoardVariantSlug) => void;
}

const BoardVariantContext = createContext<BoardVariantContextValue | null>(null);

export function BoardVariantProvider({ children }: { children: ReactNode }) {
  const [variantSlug, setVariantSlug] = useState<BoardVariantSlug>(DEFAULT_BOARD_VARIANT);

  // Hydrate aus LocalStorage nach Mount (vermeidet SSR-Hydration-Mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && stored in BOARD_VARIANTS) {
        setVariantSlug(stored as BoardVariantSlug);
      }
    } catch {
      // localStorage unverfügbar (z.B. Inkognito mit Storage-Sperre) — ignore
    }
  }, []);

  const setVariant = useCallback((slug: BoardVariantSlug) => {
    setVariantSlug(slug);
    try {
      localStorage.setItem(STORAGE_KEY, slug);
    } catch {
      // ignore
    }
  }, []);

  const variant = BOARD_VARIANTS[variantSlug];

  return (
    <BoardVariantContext.Provider value={{ variant, variantSlug, setVariant }}>
      {children}
    </BoardVariantContext.Provider>
  );
}

/** Hook für Lesson-Components — liefert immer eine gültige Variante. */
export function useBoardVariant(): BoardVariantContextValue {
  const ctx = useContext(BoardVariantContext);
  if (ctx) return ctx;
  // Fallback wenn KEIN Provider drumherum: Default 38-Pin, kein Setter-State
  // — kommt nicht in normaler Lesson-Page vor, nur z.B. in isolierten Renderern.
  return {
    variant: BOARD_VARIANTS[DEFAULT_BOARD_VARIANT],
    variantSlug: DEFAULT_BOARD_VARIANT,
    setVariant: () => {},
  };
}
