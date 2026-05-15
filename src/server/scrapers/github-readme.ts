import "server-only";
import { USER_AGENT } from "./util";
import type { Scraper, ScrapedDoc } from "./types";

/**
 * GitHub-Scraper über die öffentliche REST-API.
 * Sucht nach Repos mit Topic "esp32" oder "arduino", liest README.md.
 */
async function ghFetch<T>(url: string): Promise<T | null> {
  try {
    const headers: HeadersInit = {
      "User-Agent": USER_AGENT,
      Accept: "application/vnd.github.v3+json",
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface SearchRepoItem {
  full_name: string;
  html_url: string;
  description: string | null;
  default_branch: string;
}

export const githubReadmeScraper: Scraper = {
  source: "GITHUB_README",
  async list(limit = 20) {
    const search = await ghFetch<{ items: SearchRepoItem[] }>(
      "https://api.github.com/search/repositories?q=topic:esp32+language:c+stars:%3E50&sort=updated&per_page=" +
        encodeURIComponent(String(limit)),
    );
    if (!search?.items) return [];
    return search.items.map((it) => it.html_url);
  },
  async fetch(url): Promise<ScrapedDoc | null> {
    const match = /github\.com\/([^/]+)\/([^/?#]+)/.exec(url);
    if (!match) return null;
    const [, owner, repo] = match;
    const meta = await ghFetch<SearchRepoItem>(
      `https://api.github.com/repos/${owner}/${repo}`,
    );
    if (!meta) return null;
    const readmeMeta = await ghFetch<{ content?: string; encoding?: string }>(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
    );
    if (!readmeMeta?.content || readmeMeta.encoding !== "base64") return null;
    const markdown = Buffer.from(readmeMeta.content, "base64").toString("utf8");
    if (markdown.length < 400) return null;
    return {
      source: "GITHUB_README",
      sourceUrl: url,
      title: meta.full_name,
      markdown,
      rawHtml: markdown,
      language: "en",
    };
  },
};
