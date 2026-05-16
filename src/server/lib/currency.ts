import "server-only";
import { headers } from "next/headers";

export type Currency = "EUR" | "CHF";

const CH_COUNTRY_CODES = new Set(["CH", "LI"]);

/**
 * Resolve the currency for the current visitor. Strategy:
 *
 *  1. explicit override via `?currency=` query (validated by the caller)
 *  2. CDN-supplied IP country header (Vercel: `x-vercel-ip-country`,
 *     Cloudflare: `cf-ipcountry`) — CH / LI map to CHF
 *  3. `Accept-Language` first tag containing "ch" (de-CH, fr-CH, it-CH)
 *  4. fallback to EUR
 *
 * Defensive — every step independently graceful so a misconfigured CDN
 * never throws.
 */
export async function detectCurrency(): Promise<Currency> {
  try {
    const h = await headers();
    const country = (
      h.get("x-vercel-ip-country") ??
      h.get("cf-ipcountry") ??
      ""
    )
      .trim()
      .toUpperCase();
    if (country && CH_COUNTRY_CODES.has(country)) return "CHF";

    const accept = h.get("accept-language") ?? "";
    const firstTag = accept.split(",")[0]?.trim().toLowerCase() ?? "";
    if (/-ch\b/.test(firstTag)) return "CHF";
  } catch {
    // headers() can only run inside a request scope — outside that scope we
    // simply return EUR.
  }
  return "EUR";
}

export function isCurrency(value: unknown): value is Currency {
  return value === "EUR" || value === "CHF";
}
