/**
 * Auto-Discovery für Affiliate-Direktlinks.
 *
 * Pro Bauteil und Anbieter wird die jeweilige Suche/API abgefragt und der
 * erste plausible Direktlink zurückgegeben. Findet ein Anbieter nichts,
 * liefert die Discovery-Funktion `null` — das Bauteil erscheint im UI
 * dann ohne diesen Anbieter (kein irreführender Such-Button).
 *
 * Token-Reduktion: AZ-Delivery (Shopify Predictive Search) macht Prefix-Match
 * und scheitert oft an zu spezifischen Phrasen. Findet eine Suche nichts,
 * wird das letzte Wort entfernt und neu gesucht — bis ein Treffer kommt
 * (oder die Tokens aufgebraucht sind). Excludes filtern offensichtliche
 * Fehltreffer (Module, SMD-Varianten etc.).
 */

const BROWSER_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "accept-language": "de-DE,de;q=0.9,en;q=0.5",
  "accept-encoding": "gzip, deflate, br",
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response | null> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { ...BROWSER_HEADERS, ...init?.headers },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

async function urlReturns200(url: string): Promise<boolean> {
  const res = await fetchWithTimeout(url);
  return Boolean(res?.ok);
}

export interface DiscoveryQuery {
  /** Primärer Such-Begriff (deutsch). */
  query: string;
  /** Negativ-Filter — Treffer mit diesen Substrings in Titel oder URL werden übersprungen. */
  excludes?: string[];
}

function matchesExclude(text: string, excludes?: string[]): boolean {
  if (!excludes || excludes.length === 0) return false;
  const lower = text.toLowerCase();
  return excludes.some((ex) => lower.includes(ex.toLowerCase()));
}

/**
 * AZ-Delivery — Shopify Predictive-Search-API.
 * Sucht in absteigender Spezifität (Token-Reduktion), filtert via Excludes.
 */
export async function discoverAtAzDelivery(
  q: DiscoveryQuery,
): Promise<string | null> {
  const tokens = q.query.split(/\s+/).filter(Boolean);

  while (tokens.length > 0) {
    const query = tokens.join(" ");
    const url =
      "https://www.az-delivery.de/search/suggest.json?" +
      new URLSearchParams({
        q: query,
        "resources[type]": "product",
        "resources[limit]": "10",
      }).toString();
    const res = await fetchWithTimeout(url, {
      headers: { accept: "application/json" },
    });
    if (!res?.ok) {
      tokens.pop();
      continue;
    }
    const json = (await res.json().catch(() => null)) as
      | {
          resources?: {
            results?: { products?: Array<{ url?: string; title?: string }> };
          };
        }
      | null;
    const products = json?.resources?.results?.products ?? [];
    for (const p of products) {
      if (!p.url) continue;
      const title = p.title ?? "";
      if (matchesExclude(title, q.excludes)) continue;
      if (matchesExclude(p.url, q.excludes)) continue;
      const path = p.url.split("?")[0];
      const productUrl = `https://www.az-delivery.de${path}`;
      if (await urlReturns200(productUrl)) return productUrl;
    }
    // Nichts Passendes auf dieser Token-Stufe → reduziere und versuche erneut
    tokens.pop();
  }
  return null;
}

/**
 * Reichelt — HTML-Suche, erstes Produkt-Link aus der Trefferliste.
 * Brauch volle Browser-Header (Cloudflare-Bot-Schutz).
 */
export async function discoverAtReichelt(
  q: DiscoveryQuery,
): Promise<string | null> {
  const tokens = q.query.split(/\s+/).filter(Boolean);

  while (tokens.length > 0) {
    const url =
      "https://www.reichelt.de/de/de/shop/suche/" +
      encodeURIComponent(tokens.join(" "));
    const res = await fetchWithTimeout(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
    });
    if (!res?.ok) {
      tokens.pop();
      continue;
    }
    const html = await res.text();
    const matches = [
      ...html.matchAll(
        /href="(https:\/\/www\.reichelt\.de\/de\/de\/shop\/produkt\/[^"]+?-\d+)"/g,
      ),
    ];
    const seen = new Set<string>();
    for (const m of matches) {
      const productUrl = m[1];
      if (!productUrl || seen.has(productUrl)) continue;
      seen.add(productUrl);
      if (matchesExclude(productUrl, q.excludes)) continue;
      if (await urlReturns200(productUrl)) return productUrl;
    }
    tokens.pop();
  }
  return null;
}

/**
 * BerryBase — kein zuverlässiger Such-Endpoint identifiziert; vorerst null.
 */
export async function discoverAtBerryBase(
  _q: DiscoveryQuery,
): Promise<string | null> {
  void _q;
  return null;
}

/**
 * Amazon — keine kostenlose Such-API ohne PA-API-Konto.
 * Discovery liefert `null`; ASINs werden manuell im Seed gepflegt.
 */
export async function discoverAtAmazonDe(
  _q: DiscoveryQuery,
): Promise<string | null> {
  void _q;
  return null;
}

export type Merchant = "AZ_DELIVERY" | "AMAZON_DE" | "BERRYBASE" | "REICHELT";

export async function discoverFor(
  merchant: Merchant,
  q: DiscoveryQuery,
): Promise<string | null> {
  switch (merchant) {
    case "AZ_DELIVERY":
      return discoverAtAzDelivery(q);
    case "REICHELT":
      return discoverAtReichelt(q);
    case "BERRYBASE":
      return discoverAtBerryBase(q);
    case "AMAZON_DE":
      return discoverAtAmazonDe(q);
  }
}
