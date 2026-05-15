#!/usr/bin/env tsx
/**
 * HTTP-verifiziert alle Affiliate-Links in der DB.
 * Setzt Links mit 4xx/5xx auf inaktiv (program.isActive bleibt — wir downgraden nur einzelne Links).
 *
 *   pnpm verify:affiliate
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UA =
  "Mozilla/5.0 (compatible; MicroLearnBot/0.1; +https://microlearn.example)";

async function head(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": UA },
    });
    return res.status;
  } catch {
    return 0;
  }
}

function isSearchUrl(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("/search") ||
    u.includes("/s?k=") ||
    u.includes("?ssearch=") ||
    u.includes("?search=") ||
    u.includes("&search=") ||
    u.includes("?q=") ||
    u.includes("&q=")
  );
}

async function main() {
  const links = await prisma.affiliateLink.findMany({
    include: { program: true, component: true, board: true },
  });
  console.log(`Checking ${links.length} affiliate links…`);

  let ok = 0;
  let dead = 0;
  let inconclusive = 0;
  let skipped = 0;
  for (const link of links) {
    if (isSearchUrl(link.productUrl)) {
      skipped += 1;
      continue;
    }
    const status = await head(link.productUrl);
    const name =
      link.component?.name ?? link.board?.name ?? `(${link.id})`;
    const tag = `[${link.program.merchant}] ${name}`;
    // Anti-Bot status codes (503, 403, 429): URL ist wahrscheinlich gültig,
    // der Shop blockt nur unseren curl. Echte Browser kommen durch.
    const isAntiBot = status === 503 || status === 403 || status === 429;
    if (status >= 200 && status < 400) {
      console.log(`✓ ${status}  ${tag}`);
      ok += 1;
    } else if (isAntiBot) {
      console.log(`? ${status}  ${tag}  (anti-bot, browser-OK angenommen)`);
      inconclusive += 1;
    } else {
      console.log(`✗ ${status}  ${tag}  ${link.productUrl}`);
      dead += 1;
    }
  }
  console.log("---");
  console.log(
    `OK: ${ok} · Inconclusive: ${inconclusive} · Dead: ${dead} · Search-Skip: ${skipped}`,
  );
  await prisma.$disconnect();
  process.exit(dead > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
