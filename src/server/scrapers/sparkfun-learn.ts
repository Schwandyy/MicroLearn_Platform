import "server-only";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

const FEED_URL = "https://learn.sparkfun.com/feeds/tutorials";
const TUTORIALS_INDEX_URL = "https://learn.sparkfun.com/tutorials";

/**
 * SparkFun Learn — tutorials for Arduino, RP2040, ESP32, sensors, soldering.
 * Listing via the public ATOM feed at /feeds/tutorials (357 KB, ~latest 50
 * tutorials). If the feed is unreachable, we fall back to the /tutorials index
 * page and pick out individual tutorial slug links.
 *
 * Attribution: every tutorial keeps its `sourceUrl`, which the Claude pipeline
 * credits in the generated lesson body.
 */
export const sparkfunLearnScraper: Scraper = {
  source: "SPARKFUN_LEARN",
  async list(limit = 15) {
    const feed = await fetchHtml(FEED_URL);
    let urls = feed ? extractFeedEntries(feed) : [];

    if (urls.length === 0) {
      const index = await fetchHtml(TUTORIALS_INDEX_URL);
      if (index) urls = extractTutorialLinksFromIndex(index);
    }

    return Array.from(new Set(urls)).slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const { title, markdown } = htmlToMarkdown(html);
    if (!markdown || markdown.length < 400) return null;
    return {
      source: "SPARKFUN_LEARN",
      sourceUrl: url,
      title,
      markdown,
      rawHtml: html,
      language: "en",
    };
  },
};

function extractFeedEntries(xml: string): string[] {
  // SparkFun's ATOM feed uses self-closing or paired <link href="..."></link>
  // tags inside each <entry>. The outermost feed-level link points at the
  // tutorials index, so we skip it.
  const out: string[] = [];
  const entryRe = /<entry\b[\s\S]*?<\/entry>/gi;
  let entry: RegExpExecArray | null;
  while ((entry = entryRe.exec(xml)) !== null) {
    const linkMatch = /<link\b[^>]*href="([^"]+)"/i.exec(entry[0]);
    const url = linkMatch?.[1];
    if (!url) continue;
    if (!/^https:\/\/learn\.sparkfun\.com\/tutorials\/[^/]+$/.test(url)) {
      continue;
    }
    out.push(url);
  }
  return out;
}

function extractTutorialLinksFromIndex(html: string): string[] {
  const out: string[] = [];
  const re = /href="(https:\/\/learn\.sparkfun\.com\/tutorials\/[^"#?]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const url = m[1];
    if (!url) continue;
    // Skip tag/category pages and the bare index.
    if (url.includes("/tutorials/tags/")) continue;
    if (url.replace(/\/$/, "").endsWith("/tutorials")) continue;
    out.push(url.replace(/\/$/, ""));
  }
  return out;
}
