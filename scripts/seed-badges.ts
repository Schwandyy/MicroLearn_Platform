import { PrismaClient } from "@prisma/client";
import { BADGE_CATALOG } from "../src/server/lib/badges";

const prisma = new PrismaClient();

async function main() {
  for (const b of BADGE_CATALOG) {
    const data = {
      slug: b.slug,
      category: b.category,
      xpReward: b.xpReward,
      title_de: b.title_de,
      title_en: b.title_en,
      description_de: b.description_de,
      description_en: b.description_en,
    };
    await prisma.badge.upsert({
      where: { slug: b.slug },
      create: data,
      update: data,
    });
  }
  const count = await prisma.badge.count();
  console.log(`Seeded badges. Total in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
