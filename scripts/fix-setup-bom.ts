// Fügt das fehlende USB-Datenkabel als Component an + verlinkt es in der
// esp32-setup-BOM. Idempotent — kann mehrfach laufen.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1) USB-Datenkabel Micro-USB als Component
  const cable = await prisma.component.upsert({
    where: { slug: "usb-data-cable-micro-usb" },
    update: {
      name: "USB-Datenkabel (Micro-USB)",
      descriptionShort_de: "Zum Programmieren — muss Daten übertragen, kein reines Lade-Kabel.",
      descriptionShort_en: "For programming — must carry data, not just power.",
    },
    create: {
      slug: "usb-data-cable-micro-usb",
      name: "USB-Datenkabel (Micro-USB)",
      category: "cable",
      iconKey: "Cable",
      logicLevel: "BOTH",
      voltageMin: 5,
      voltageMax: 5,
      description_de:
        "Standard-Micro-USB-Kabel zum Programmieren des ESP32 vom Computer aus. " +
        "Wichtig: muss DATEN übertragen, nicht nur Strom. Viele günstige Handy-Lade-Kabel " +
        "haben keine Datenleitung und funktionieren NICHT.",
      description_en:
        "Standard Micro-USB cable for programming the ESP32 from a computer. " +
        "Important: it must carry DATA, not just power. Many cheap phone-charging " +
        "cables omit the data lines and will NOT work.",
      descriptionShort_de: "Zum Programmieren — muss Daten übertragen, kein reines Lade-Kabel.",
      descriptionShort_en: "For programming — must carry data, not just power.",
      levelHint: "L1_BEGINNER",
    },
  });
  console.log("[1/3] Component:", cable.slug, cable.id);

  // 2) Affiliate-Links für drei Merchants (Amazon/AZ/Reichelt)
  type LinkSeed = {
    merchant: "AZ_DELIVERY" | "AMAZON_DE" | "REICHELT";
    productUrl: string;
    priceCents: number;
    packageNote_de: string;
    packageNote_en: string;
  };
  const links: LinkSeed[] = [
    {
      merchant: "AZ_DELIVERY",
      productUrl: "https://www.az-delivery.de/products/micro-usb-zu-usb-kabel",
      priceCents: 299,
      packageNote_de: "1 m Micro-USB",
      packageNote_en: "1 m Micro-USB",
    },
    {
      merchant: "AMAZON_DE",
      productUrl: "https://www.amazon.de/s?k=micro+usb+datenkabel+1m&tag=microlearn-21",
      priceCents: 599,
      packageNote_de: 'Such-Ergebnis · achte auf „Datenkabel"',
      packageNote_en: 'Search result · look for "data cable"',
    },
  ];

  for (const seed of links) {
    const program = await prisma.affiliateProgram.findUnique({
      where: { merchant: seed.merchant },
    });
    if (!program) {
      console.warn(`[skip] AffiliateProgram ${seed.merchant} fehlt — überspringe.`);
      continue;
    }
    // Existiert bereits?
    const existing = await prisma.affiliateLink.findFirst({
      where: { programId: program.id, componentId: cable.id },
    });
    if (existing) {
      await prisma.affiliateLink.update({
        where: { id: existing.id },
        data: {
          productUrl: seed.productUrl,
          priceCents: seed.priceCents,
          currency: "EUR",
          packageNote_de: seed.packageNote_de,
          packageNote_en: seed.packageNote_en,
        },
      });
      console.log("[2/3] AffiliateLink updated:", seed.merchant);
    } else {
      await prisma.affiliateLink.create({
        data: {
          programId: program.id,
          componentId: cable.id,
          productUrl: seed.productUrl,
          priceCents: seed.priceCents,
          currency: "EUR",
          packageNote_de: seed.packageNote_de,
          packageNote_en: seed.packageNote_en,
        },
      });
      console.log("[2/3] AffiliateLink created:", seed.merchant);
    }
  }

  // 3) BOM-Eintrag für esp32-setup ergänzen
  const lesson = await prisma.lesson.findUnique({
    where: { slug: "esp32-setup" },
    select: { id: true },
  });
  if (!lesson) {
    console.error("Lesson esp32-setup nicht gefunden — abgebrochen.");
    return;
  }
  const existingBom = await prisma.bOMItem.findFirst({
    where: { lessonId: lesson.id, componentId: cable.id },
  });
  if (existingBom) {
    console.log("[3/3] BOM bereits gesetzt — fertig.");
  } else {
    await prisma.bOMItem.create({
      data: {
        lessonId: lesson.id,
        componentId: cable.id,
        quantity: 1,
        note_de: 'Achte auf „Datenkabel" — reine Lade-Kabel funktionieren nicht.',
        note_en: 'Look for "data cable" — power-only cables will not work.',
      },
    });
    console.log("[3/3] BOM-Eintrag esp32-setup → USB-Kabel hinzugefügt.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
