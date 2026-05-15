import "server-only";
import * as cheerio from "cheerio";

export const USER_AGENT =
  "MicroLearnBot/0.1 (+https://microlearn.example; respects robots.txt)";

export async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const BLOCK_TAGS = ["script", "style", "noscript", "nav", "footer", "header", "aside"];

export function htmlToMarkdown(html: string): { title?: string; markdown: string } {
  const $ = cheerio.load(html);
  BLOCK_TAGS.forEach((t) => $(t).remove());
  $("[aria-hidden='true']").remove();

  const title =
    $("meta[property='og:title']").attr("content") ??
    $("title").first().text() ??
    $("h1").first().text() ??
    undefined;

  const article = $("article").first().length
    ? $("article").first()
    : $("main").first().length
      ? $("main").first()
      : $("body");

  const parts: string[] = [];
  article
    .find("h1, h2, h3, h4, p, pre, code, ul, ol, li, blockquote, table")
    .each((_, el) => {
      const $el = $(el);
      const tag =
        "tagName" in el && typeof el.tagName === "string"
          ? el.tagName.toLowerCase()
          : undefined;
      const text = $el.text().trim();
      if (!text) return;
      switch (tag) {
        case "h1":
          parts.push(`\n# ${text}\n`);
          break;
        case "h2":
          parts.push(`\n## ${text}\n`);
          break;
        case "h3":
          parts.push(`\n### ${text}\n`);
          break;
        case "h4":
          parts.push(`\n#### ${text}\n`);
          break;
        case "p":
          parts.push(`${text}\n`);
          break;
        case "pre":
          parts.push(`\n\`\`\`\n${text}\n\`\`\`\n`);
          break;
        case "code":
          if ($el.parent().is("pre")) return;
          parts.push(`\`${text}\``);
          break;
        case "li":
          parts.push(`- ${text}`);
          break;
        case "blockquote":
          parts.push(`\n> ${text}\n`);
          break;
        default:
          parts.push(`${text}\n`);
      }
    });

  return { title: title?.trim(), markdown: parts.join("\n").trim() };
}
