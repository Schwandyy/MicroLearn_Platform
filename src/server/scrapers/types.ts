import "server-only";
import type { ContentSource } from "@prisma/client";

export interface ScrapedDoc {
  source: ContentSource;
  sourceUrl: string;
  title?: string;
  markdown: string;
  rawHtml: string;
  language?: "de" | "en" | null;
}

export interface Scraper {
  readonly source: ContentSource;
  /** Liefert URLs der zu prüfenden Detailseiten (kann z.B. Sitemap, RSS, Listing-Page parsen) */
  list(limit?: number): Promise<string[]>;
  /** Holt + extrahiert Inhalt einer Detailseite */
  fetch(url: string): Promise<ScrapedDoc | null>;
}
