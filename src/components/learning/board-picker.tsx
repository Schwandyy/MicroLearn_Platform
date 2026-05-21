"use client";

import { cn } from "@/lib/utils";
import { useBoardVariant } from "./board-variant-context";
import { BOARD_VARIANTS, type BoardVariantSlug } from "./wiring";

/**
 * Board-Variante-Picker — zwei Karten (30-Pin DOIT, 38-Pin).
 * Klick speichert in Context + LocalStorage; alle Schaltbild- und Pin-Visual-
 * Komponenten reagieren live.
 *
 * Platzierung: am Anfang von Step 3 EXPLAIN „Das ist dein ESP32" — direkt
 * über dem Pin-Visual.
 */
export function BoardPicker({ className }: { className?: string }) {
  const { variantSlug, setVariant } = useBoardVariant();

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-foreground">Welches ESP32-Board hast du?</h3>
        <span className="text-xs text-muted-foreground">Zähle die Pins auf einer Seite</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(BOARD_VARIANTS) as BoardVariantSlug[]).map((slug) => {
          const v = BOARD_VARIANTS[slug];
          const isActive = slug === variantSlug;
          return (
            <button
              key={slug}
              type="button"
              onClick={() => setVariant(slug)}
              className={cn(
                "group relative flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
                "hover:bg-accent/50 hover:border-primary/60",
                isActive
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-card",
              )}
              aria-pressed={isActive}
            >
              <BoardPreview pinsPerSide={v.pinCount} active={isActive} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold">{v.shortLabel}</span>
                  {isActive && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                      gewählt
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {v.label.split("—")[1]?.trim() ?? v.label}
                </p>
                <p className="mt-1 text-xs font-mono text-muted-foreground">
                  {v.pinCount} Pins pro Seite · {v.pinCount * 2} insgesamt
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Tipp: Schau auf die Pin-Header und zähle die goldenen Stifte. Die Wahl
        bleibt für alle Lessons gespeichert und passt Schaltbilder + Pin-Belegung an.
      </p>
    </div>
  );
}

/**
 * Mini-Vorschau des Boards — schmales Rechteck mit Pin-Stiften links + rechts.
 * Hilft dem Schüler, die Anzahl visuell zu vergleichen.
 */
function BoardPreview({ pinsPerSide, active }: { pinsPerSide: number; active: boolean }) {
  const W = 80;
  const PIN_H = 4;
  const PIN_GAP = 2;
  const sideH = pinsPerSide * (PIN_H + PIN_GAP);
  const H = sideH + 16;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-20 w-12 flex-shrink-0", active && "drop-shadow-sm")}
      aria-hidden="true"
    >
      {/* PCB */}
      <rect x="14" y="4" width={W - 28} height={H - 8} rx="3" fill="#0a1422" stroke={active ? "#2563eb" : "#1f2937"} strokeWidth="1.2" />
      {/* USB oben */}
      <rect x={W / 2 - 8} y="0" width="16" height="6" rx="1" fill="#94a3b8" />
      {/* WROOM in der Mitte */}
      <rect x={W / 2 - 14} y={H / 2 - 18} width="28" height="36" rx="1.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
      {/* Pin-Header links */}
      {Array.from({ length: pinsPerSide }).map((_, i) => (
        <rect
          key={`pin-l-${i}`}
          x="6"
          y={8 + i * (PIN_H + PIN_GAP)}
          width="8"
          height={PIN_H}
          rx="0.5"
          fill="#facc15"
          stroke="#a16207"
          strokeWidth="0.3"
        />
      ))}
      {/* Pin-Header rechts */}
      {Array.from({ length: pinsPerSide }).map((_, i) => (
        <rect
          key={`pin-r-${i}`}
          x={W - 14}
          y={8 + i * (PIN_H + PIN_GAP)}
          width="8"
          height={PIN_H}
          rx="0.5"
          fill="#facc15"
          stroke="#a16207"
          strokeWidth="0.3"
        />
      ))}
      {/* Pin-Anzahl-Label */}
      <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="6" fontWeight="800" fill={active ? "#2563eb" : "#94a3b8"} fontFamily="ui-monospace,monospace">
        {pinsPerSide}/Seite
      </text>
    </svg>
  );
}
