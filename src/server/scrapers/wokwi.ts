import "server-only";
import * as cheerio from "cheerio";
import { fetchHtml, htmlToMarkdown } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

/**
 * Wokwi-Projekte sind **NUR Inspirations-Quelle**, niemals Embed im Lesson-Renderer.
 * Wir lesen die öffentliche Projekt-Liste und extrahieren den Beschreibungstext
 * (Schaltungs-Idee, Bauteile, Code) — Claude destilliert daraus eine eigenständige
 * MicroLearn-Lerneinheit.
 */
export const wokwiScraper: Scraper = {
  source: "EDITORIAL", // closest match — Wokwi-Projekte sind editorial reviewed before content
  async list(limit = 20) {
    // Wokwi hat keine offene Listing-Seite; wir starten von kuratierten Featured-Projekten.
    // In Phase 3 ersetzbar durch Wokwi-API (falls verfügbar) oder eigene Liste.
    const seeds = [
      "https://wokwi.com/projects/336838716100935764", // ESP32 Blink classic
      "https://wokwi.com/projects/352529388147884033", // ESP32 + DHT22
      "https://wokwi.com/projects/342045104190620244", // Arduino traffic light
      "https://wokwi.com/projects/342046045114826322", // Pi Pico LED
    ];
    return seeds.slice(0, limit);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const html = await fetchHtml(url);
    if (!html) return null;
    const $ = cheerio.load(html);
    const title =
      $("meta[property='og:title']").attr("content") ??
      $("title").text() ??
      "Wokwi project";
    const description =
      $("meta[property='og:description']").attr("content") ?? "";
    const { markdown } = htmlToMarkdown(html);
    const combined = `${description}\n\n${markdown}`.trim();
    if (combined.length < 100) return null;
    return {
      source: "EDITORIAL",
      sourceUrl: url,
      title,
      markdown: combined,
      rawHtml: html,
      language: "en",
    };
  },
};
