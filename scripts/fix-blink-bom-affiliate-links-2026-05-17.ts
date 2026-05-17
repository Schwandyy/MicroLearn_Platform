/**
 * Verknüpft fehlende AffiliateLinks für die Blink-Lesson-BOM-Items.
 * Priorität: AZ_DELIVERY > REICHELT > AMAZON_DE (die Reihenfolge, in der
 * der Shop für den User AZ-Delivery am sinnvollsten ist).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";
const MERCHANT_PRIORITY = ["AZ_DELIVERY", "REICHELT", "AMAZON_DE"] as const;

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) throw new Error(`Lesson ${LESSON_SLUG} not found.`);

  const bom = await prisma.bOMItem.findMany({
    where: { lessonId: lesson.id },
    include: {
      component: { include: { affiliateLinks: { include: { program: true } } } },
      board: { include: { affiliateLinks: { include: { program: true } } } },
      affiliateLink: { include: { program: true } },
    },
  });

  let fixed = 0;
  for (const bi of bom) {
    const name = bi.component?.name ?? bi.board?.name ?? "?";
    if (bi.affiliateLinkId) {
      console.log(`✓ ${name} bereits verknüpft (${bi.affiliateLink?.program.merchant})`);
      continue;
    }
    const candidates = bi.component?.affiliateLinks ?? bi.board?.affiliateLinks ?? [];
    if (candidates.length === 0) {
      console.warn(`⚠ ${name} hat KEINE AffiliateLinks — überspringe.`);
      continue;
    }
    const picked = MERCHANT_PRIORITY.map((m) => candidates.find((c) => c.program.merchant === m)).find(Boolean) ?? candidates[0];
    if (!picked) continue;
    await prisma.bOMItem.update({
      where: { id: bi.id },
      data: { affiliateLinkId: picked.id },
    });
    console.log(`✅ ${name} → ${picked.program.merchant}  ${picked.productUrl}`);
    fixed++;
  }

  console.log(`\nFertig: ${fixed} BOM-Items neu verknüpft.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
