/**
 * Lesson-Text-Templating — ersetzt Platzhalter in DB-Texten je nach gewähltem
 * Signal-Pin (z.B. D2 / D4 / D12).
 *
 * Unterstützte Platzhalter:
 *   {{SIGNAL_LABEL}}  → "D2", "D4" …
 *   {{SIGNAL_GPIO}}   → "2", "4" …
 *
 * Beispiel-Text in DB:
 *   "Wir benutzen GPIO {{SIGNAL_GPIO}} — auf deinem Board als
 *    „{{SIGNAL_LABEL}}" beschriftet."
 *
 * Bei selectedSignalPin = "D4" wird daraus:
 *   "Wir benutzen GPIO 4 — auf deinem Board als „D4" beschriftet."
 */

export interface LessonTemplateContext {
  signalLabel: string;  // z.B. "D2"
  signalGpio: string;   // z.B. "2"
}

const PLACEHOLDER_REGEX = /\{\{(SIGNAL_LABEL|SIGNAL_GPIO)\}\}/g;

export function applyLessonTemplate(text: string | null | undefined, ctx: LessonTemplateContext): string {
  if (!text) return "";
  return text.replace(PLACEHOLDER_REGEX, (match, key: string) => {
    if (key === "SIGNAL_LABEL") return ctx.signalLabel;
    if (key === "SIGNAL_GPIO") return ctx.signalGpio;
    return match;
  });
}

/** Extrahiert die GPIO-Nummer aus einem Pin-Label ("D4" → "4"). */
export function gpioFromLabel(label: string): string {
  const m = label.match(/D(\d+)/);
  return m ? m[1]! : label;
}

/** Macht aus einem Pin-Label den Template-Kontext für Lesson-Texte. */
export function makeLessonContext(signalLabel: string): LessonTemplateContext {
  return { signalLabel, signalGpio: gpioFromLabel(signalLabel) };
}

/**
 * Rekursiv: ersetzt Platzhalter in allen String-Werten eines beliebigen
 * Objekts/Arrays. Nicht-Strings (numbers, booleans, null) bleiben unverändert.
 */
export function applyLessonTemplateDeep<T>(value: T, ctx: LessonTemplateContext): T {
  if (typeof value === "string") {
    return applyLessonTemplate(value, ctx) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => applyLessonTemplateDeep(v, ctx)) as unknown as T;
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = applyLessonTemplateDeep(v, ctx);
    }
    return out as unknown as T;
  }
  return value;
}
