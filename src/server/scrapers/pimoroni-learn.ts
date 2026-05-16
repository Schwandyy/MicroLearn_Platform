import "server-only";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

const INDEX_URL = "https://learn.pimoroni.com/";

/**
 * Pimoroni Learn — UK-based maker shop's tutorial portal. Strong on Raspberry
 * Pi, Pico (RP2040/RP2350), CircuitPython, MicroPython, and original Pimoroni
 * boards (Inky, Enviro, Plasma, Tufty, Badger). The site has no public feed
 * or sitemap, but the homepage lists every article as a relative
 * `/article/<slug>` link. We crawl that index and let the topic filter narrow
 * the result down to microcontroller-relevant tutorials.
 *
 * Attribution: every article keeps its `sourceUrl`, which the Claude pipeline
 * credits in the generated lesson body.
 */
export const pimoroniLearnScraper: Scraper = {
  source: "PIMORONI_LEARN",
  async list(limit = 15) {
    const html = await fetchHtml(INDEX_URL);
    if (!html) return [];
    const urls = extractArticleUrls(html);
    return Array.from(new Set(urls)).slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const { title, markdown } = htmlToMarkdown(html);
    if (!markdown || markdown.length < 400) return null;
    return {
      source: "PIMORONI_LEARN",
      sourceUrl: url,
      title,
      markdown,
      rawHtml: html,
      language: "en",
    };
  },
};

const TOPIC_KEYWORDS = [
  "pi",
  "pico",
  "rp2040",
  "rp2350",
  "circuitpython",
  "micropython",
  "esp",
  "neopixel",
  "plasma",
  "inky",
  "enviro",
  "badger",
  "automation",
  "explorer",
  "trilobot",
  "tufty",
  "keybow",
  "sensor",
  "led",
];

function extractArticleUrls(html: string): string[] {
  const out: string[] = [];
  const re = /href="(\/article\/([a-z0-9-]+))"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const path = m[1];
    const slug = m[2];
    if (!path || !slug) continue;
    if (!TOPIC_KEYWORDS.some((k) => slug.includes(k))) continue;
    const url = `https://learn.pimoroni.com${path}`;
    out.push(url);
  }
  return out;
}
