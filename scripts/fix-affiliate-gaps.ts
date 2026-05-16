// Füllt fehlende Affiliate-Links für Components ohne kaufbare Quelle.
// AZ-Delivery + Amazon DE, beide mit funktionalen Such-URLs. Preise sind
// konservative Marktpreis-Schätzungen (Stand 2025); UI zeigt zusätzlich
// einen Pack-Hinweis, damit klar ist was im Warenkorb landet.
// Idempotent.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProductSeed = {
  slug: string;
  azSlug?: string; // direkter Produkt-Slug bei AZ-Delivery (Vermutung — Such-URL als Fallback)
  azSearch?: string; // Such-Begriff bei AZ
  azPriceCents: number;
  azPackage_de: string;
  azPackage_en: string;
  amazonSearch: string;
  amazonPriceCents: number;
  amazonPackage_de: string;
  amazonPackage_en: string;
};

const SEEDS: ProductSeed[] = [
  {
    slug: "bmp280-sensor",
    azSearch: "bmp280",
    azPriceCents: 699,
    azPackage_de: "1 Modul",
    azPackage_en: "1 module",
    amazonSearch: "bmp280 sensor modul",
    amazonPriceCents: 899,
    amazonPackage_de: "Meist 2er-Pack",
    amazonPackage_en: "Usually 2-pack",
  },
  {
    slug: "buzzer-passive",
    azSearch: "passiver buzzer",
    azPriceCents: 449,
    azPackage_de: "Set mit aktivem + passivem Buzzer",
    azPackage_en: "Set with active + passive buzzer",
    amazonSearch: "passiver buzzer arduino 5v",
    amazonPriceCents: 599,
    amazonPackage_de: "10er-Pack",
    amazonPackage_en: "10-pack",
  },
  {
    slug: "dc-motor-3v",
    azSearch: "dc motor 3v",
    azPriceCents: 399,
    azPackage_de: "Einzeln",
    azPackage_en: "Single",
    amazonSearch: "mini dc motor 3v arduino",
    amazonPriceCents: 699,
    amazonPackage_de: "Meist 5er-Set",
    amazonPackage_en: "Usually 5-pack",
  },
  {
    slug: "ds18b20-waterproof",
    azSearch: "ds18b20 wasserdicht",
    azPriceCents: 599,
    azPackage_de: "1 Sonde mit 1 m Kabel",
    azPackage_en: "1 probe, 1 m cable",
    amazonSearch: "ds18b20 wasserdicht 1m",
    amazonPriceCents: 899,
    amazonPackage_de: "Oft 2er- oder 3er-Set",
    amazonPackage_en: "Usually 2- or 3-pack",
  },
  {
    slug: "led-rgb-5mm",
    azSearch: "rgb led 5mm common cathode",
    azPriceCents: 299,
    azPackage_de: "10er-Pack 5 mm RGB",
    azPackage_en: "10-pack 5 mm RGB",
    amazonSearch: "rgb led 5mm common cathode",
    amazonPriceCents: 699,
    amazonPackage_de: "100er-Pack",
    amazonPackage_en: "100-pack",
  },
  {
    slug: "mpu6050-sensor",
    azSearch: "mpu6050",
    azPriceCents: 599,
    azPackage_de: "1 Modul",
    azPackage_en: "1 module",
    amazonSearch: "mpu-6050 modul gy-521",
    amazonPriceCents: 899,
    amazonPackage_de: "Meist 2er-Pack",
    amazonPackage_en: "Usually 2-pack",
  },
  {
    slug: "neopixel-strip-ws2812b",
    azSearch: "ws2812b strip 1m",
    azPriceCents: 999,
    azPackage_de: "1 m, 60 LEDs",
    azPackage_en: "1 m, 60 LEDs",
    amazonSearch: "ws2812b led streifen 1m 60",
    amazonPriceCents: 1299,
    amazonPackage_de: "1 m oder 5 m je nach Variante",
    amazonPackage_en: "1 m or 5 m depending on variant",
  },
  {
    slug: "oled-ssd1306",
    azSearch: "oled 128x64 i2c ssd1306",
    azPriceCents: 799,
    azPackage_de: "0,96\" Display",
    azPackage_en: "0.96\" display",
    amazonSearch: "oled 128x64 i2c ssd1306 0.96",
    amazonPriceCents: 999,
    amazonPackage_de: "Meist 2er-Pack",
    amazonPackage_en: "Usually 2-pack",
  },
  {
    slug: "photoresistor-ldr",
    azSearch: "fotowiderstand ldr",
    azPriceCents: 349,
    azPackage_de: "10er-Pack",
    azPackage_en: "10-pack",
    amazonSearch: "fotowiderstand ldr arduino",
    amazonPriceCents: 599,
    amazonPackage_de: "30er-Pack o.ä.",
    amazonPackage_en: "Usually 30+ pack",
  },
  {
    slug: "pir-hc-sr501",
    azSearch: "pir hc-sr501",
    azPriceCents: 399,
    azPackage_de: "1 Modul",
    azPackage_en: "1 module",
    amazonSearch: "pir bewegungsmelder hc-sr501",
    amazonPriceCents: 699,
    amazonPackage_de: "Meist 3er-Pack",
    amazonPackage_en: "Usually 3-pack",
  },
  {
    slug: "soil-moisture-yl69",
    azSearch: "bodenfeuchte sensor yl-69",
    azPriceCents: 399,
    azPackage_de: "Sensor + Modul",
    azPackage_en: "Probe + module",
    amazonSearch: "bodenfeuchte sensor yl-69 arduino",
    amazonPriceCents: 699,
    amazonPackage_de: "Meist 5er-Set",
    amazonPackage_en: "Usually 5-pack",
  },
  {
    slug: "stepper-28byj48-uln2003",
    azSearch: "28byj-48 schrittmotor uln2003",
    azPriceCents: 549,
    azPackage_de: "Motor + Treiber-Modul",
    azPackage_en: "Motor + driver module",
    amazonSearch: "28byj-48 uln2003 schrittmotor",
    amazonPriceCents: 999,
    amazonPackage_de: "Meist 5er-Set",
    amazonPackage_en: "Usually 5-pack",
  },
  {
    slug: "ultrasonic-hc-sr04",
    azSearch: "hc-sr04 ultraschall",
    azPriceCents: 349,
    azPackage_de: "1 Modul",
    azPackage_en: "1 module",
    amazonSearch: "hc-sr04 ultraschall sensor",
    amazonPriceCents: 599,
    amazonPackage_de: "Meist 5er-Set",
    amazonPackage_en: "Usually 5-pack",
  },
];

function azUrl(seed: ProductSeed): string {
  if (seed.azSlug) return `https://www.az-delivery.de/products/${seed.azSlug}`;
  return `https://www.az-delivery.de/search?q=${encodeURIComponent(seed.azSearch ?? seed.slug)}`;
}

function amazonUrl(seed: ProductSeed): string {
  return `https://www.amazon.de/s?k=${encodeURIComponent(seed.amazonSearch)}&tag=microlearn-21`;
}

async function ensureLink(opts: {
  programMerchant: "AZ_DELIVERY" | "AMAZON_DE";
  componentId: string;
  productUrl: string;
  priceCents: number;
  pkg_de: string;
  pkg_en: string;
}) {
  const program = await prisma.affiliateProgram.findUnique({
    where: { merchant: opts.programMerchant },
  });
  if (!program) {
    console.warn(`Program ${opts.programMerchant} fehlt — skip.`);
    return false;
  }
  const existing = await prisma.affiliateLink.findFirst({
    where: { programId: program.id, componentId: opts.componentId },
  });
  const data = {
    productUrl: opts.productUrl,
    priceCents: opts.priceCents,
    currency: "EUR",
    packageNote_de: opts.pkg_de,
    packageNote_en: opts.pkg_en,
  };
  if (existing) {
    await prisma.affiliateLink.update({ where: { id: existing.id }, data });
    return false; // kein Neuanlage-Zähler
  } else {
    await prisma.affiliateLink.create({
      data: { ...data, programId: program.id, componentId: opts.componentId },
    });
    return true;
  }
}

async function main() {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    const c = await prisma.component.findUnique({ where: { slug: seed.slug } });
    if (!c) {
      console.warn(`Component ${seed.slug} fehlt — skip.`);
      skipped += 1;
      continue;
    }
    const a = await ensureLink({
      programMerchant: "AZ_DELIVERY",
      componentId: c.id,
      productUrl: azUrl(seed),
      priceCents: seed.azPriceCents,
      pkg_de: seed.azPackage_de,
      pkg_en: seed.azPackage_en,
    });
    const b = await ensureLink({
      programMerchant: "AMAZON_DE",
      componentId: c.id,
      productUrl: amazonUrl(seed),
      priceCents: seed.amazonPriceCents,
      pkg_de: seed.amazonPackage_de,
      pkg_en: seed.amazonPackage_en,
    });
    if (a) created += 1;
    else updated += 1;
    if (b) created += 1;
    else updated += 1;
    console.log(`✓ ${seed.slug}`);
  }
  console.log(`\nNeu: ${created} · Aktualisiert: ${updated} · Übersprungen: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
