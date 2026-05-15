import type { Locale } from "./utils";

export function pickLocalized<T extends Record<string, unknown>>(
  obj: T,
  base: string,
  locale: Locale,
): string {
  const key = `${base}_${locale}` as keyof T;
  const value = obj[key];
  if (typeof value === "string" && value.length > 0) return value;
  const fallback = obj[`${base}_de` as keyof T];
  return typeof fallback === "string" ? fallback : "";
}
