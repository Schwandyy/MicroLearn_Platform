import "server-only";
import * as cheerio from "cheerio";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

export const randomNerdScraper: Scraper = {
  source: "RANDOM_NERD_TUTORIALS",
  async list(limit = 20) {
    const html = await fetchHtml("https://randomnerdtutorials.com/projects-esp32/");
    if (!html) return [];
    const $ = cheerio.load(html);
    const links: string[] = [];
    $("a").each((_, a) => {
      const href = $(a).attr("href");
      if (!href) return;
      if (
        href.startsWith("https://randomnerdtutorials.com/") &&
        /esp32|esp8266|arduino|raspberry/.test(href) &&
        !links.includes(href)
      ) {
        links.push(href);
      }
    });
    return links.slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const { title, markdown } = htmlToMarkdown(html);
    if (!markdown || markdown.length < 200) return null;
    return {
      source: "RANDOM_NERD_TUTORIALS",
      sourceUrl: url,
      title,
      markdown,
      rawHtml: html,
      language: "en",
    };
  },
};
