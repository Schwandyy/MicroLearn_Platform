// Read-only Audit: zeigt pro Lesson BOM-Items + alle Affiliate-Preise an,
// damit man manuell sieht wo BOMs unvollständig sind oder Preise fehlen.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function fmtPrice(cents: number | null, currency: string | null): string {
  if (cents == null) return "—";
  return `${(cents / 100).toFixed(2)} ${currency ?? "EUR"}`;
}

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    orderBy: [{ course: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: {
      bom: {
        include: {
          component: {
            include: { affiliateLinks: { include: { program: true } } },
          },
          board: {
            include: { affiliateLinks: { include: { program: true } } },
          },
        },
      },
    },
  });

  const flaggedNoBom: string[] = [];
  const flaggedNoPrice: string[] = [];

  for (const l of lessons) {
    console.log(`\n=== ${l.slug} — ${l.title_de}`);
    if (l.bom.length === 0) {
      console.log("  ⚠️  KEIN BOM-Eintrag");
      flaggedNoBom.push(l.slug);
      continue;
    }
    for (const item of l.bom) {
      const name = item.component?.name ?? item.board?.name ?? "(unbekannt)";
      const allLinks = [
        ...(item.component?.affiliateLinks ?? []),
        ...(item.board?.affiliateLinks ?? []),
      ];
      if (allLinks.length === 0) {
        console.log(`  • ${item.quantity}× ${name}  ⚠️ keine Affiliate-Links`);
        flaggedNoPrice.push(`${l.slug} / ${name}`);
        continue;
      }
      const cheapest = allLinks.reduce((min, link) => {
        if (link.priceCents == null) return min;
        if (min == null || link.priceCents < min.priceCents!) return link;
        return min;
      }, null as (typeof allLinks)[number] | null);
      const prices = allLinks
        .map((al) => `${al.program.displayName}: ${fmtPrice(al.priceCents, al.currency)}`)
        .join(" · ");
      const hint = cheapest ? `ab ${fmtPrice(cheapest.priceCents, cheapest.currency)}` : "kein Preis";
      console.log(`  • ${item.quantity}× ${name}  [${hint}]  (${prices})`);
    }
  }

  console.log("\n\n--- ZUSAMMENFASSUNG ---");
  console.log(`Lessons ohne BOM: ${flaggedNoBom.length}`);
  for (const s of flaggedNoBom) console.log(`  - ${s}`);
  console.log(`BOM-Items ohne Preis: ${flaggedNoPrice.length}`);
  for (const s of flaggedNoPrice) console.log(`  - ${s}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
