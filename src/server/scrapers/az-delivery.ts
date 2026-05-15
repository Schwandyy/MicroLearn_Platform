import "server-only";
import * as cheerio from "cheerio";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

export const azDeliveryScraper: Scraper = {
  source: "AZ_DELIVERY",
  async list(limit = 20) {
    const html = await fetchHtml("https://www.az-delivery.de/blogs/azdelivery-blog-fur-arduino-und-raspberry-pi");
    if (!html) return [];
    const $ = cheerio.load(html);
    const links: string[] = [];
    $("a[href*='/blogs/azdelivery-blog-fur-arduino-und-raspberry-pi/']").each(
      (_, a) => {
        const href = $(a).attr("href");
        if (!href) return;
        const url = href.startsWith("http")
          ? href
          : `https://www.az-delivery.de${href}`;
        if (!links.includes(url)) links.push(url);
      },
    );
    return links.slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const { title, markdown } = htmlToMarkdown(html);
    if (!markdown || markdown.length < 200) return null;
    return {
      source: "AZ_DELIVERY",
      sourceUrl: url,
      title,
      markdown,
      rawHtml: html,
      language: "de",
    };
  },
};
