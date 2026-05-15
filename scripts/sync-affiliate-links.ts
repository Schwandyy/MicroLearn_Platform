#!/usr/bin/env tsx
/**
 * Auto-Sync Affiliate-Direktlinks ohne kompletten Re-Seed.
 *
 * Iteriert alle Components/Boards und fragt für jeden aktiven Affiliate-
 * Anbieter dessen Discovery-Funktion ab. Aktualisiert AffiliateLink in
 * der DB; entfernt Links für Anbieter, bei denen aktuell nichts gefunden
 * wird (damit das UI nicht auf stale URLs zeigt).
 *
 * Such-Konfiguration je Bauteil lebt in `prisma/seed.ts`. Dieses Skript
 * wendet **dieselben** Configs an, ohne den restlichen Seed-Inhalt
 * anzufassen.
 *
 *   pnpm sync:affiliate
 */
import { PrismaClient } from "@prisma/client";
import { discoverFor, type Merchant } from "../src/server/affiliate/discovery";

const prisma = new PrismaClient();

interface PartDiscoveryConfig {
  slug: string;
  kind: "component" | "board";
  label: string;
  searchQuery: string;
  excludes?: string[];
  manualUrls?: Partial<Record<Merchant, string>>;
}

// Halte diese Liste mit prisma/seed.ts in Sync.
const CONFIGS: PartDiscoveryConfig[] = [
  {
    slug: "led-red-5mm",
    kind: "component",
    label: "LED rot 5 mm",
    searchQuery: "LED 5mm rot",
    excludes: [
      "smd",
      "0805",
      "0603",
      "matrix",
      "strip",
      "modul",
      "ws28",
      "neopixel",
      "panel",
    ],
  },
  {
    slug: "resistor-220ohm",
    kind: "component",
    label: "Widerstand 220 Ω",
    searchQuery: "Widerstand 220 ohm",
    excludes: [
      "smd",
      "0805",
      "0603",
      "modul",
      "sensor",
      "kohm",
      "kΩ",
      "ntc",
      "ldr",
      "potentio",
    ],
  },
  {
    slug: "breadboard-half",
    kind: "component",
    label: "Steckbrett (halb)",
    searchQuery: "Breadboard",
    excludes: ["mini", "170"],
  },
  {
    slug: "jumper-wires-mm",
    kind: "component",
    label: "Jumper-Kabel (M/M)",
    searchQuery: "Jumper Kabel Steckbrücken",
    excludes: ["kodier", "modul", "ribbon", "anschlusskabel", "sen5x", "patch"],
    manualUrls: { AMAZON_DE: "https://www.amazon.de/dp/B01EV70C78" },
  },
  {
    slug: "esp32-devkit-v1",
    kind: "board",
    label: "ESP32 DevKit V1",
    searchQuery: "ESP32 DevKit",
    excludes: ["s2-wroom", "s3", "c3", "camera", "lite"],
    manualUrls: { AMAZON_DE: "https://www.amazon.de/dp/B071P98VTG" },
  },
];

function appendTrackingTag(
  url: string,
  merchant: Merchant,
  trackingId: string | null,
): string {
  if (!trackingId) return url;
  const sep = url.includes("?") ? "&" : "?";
  const param: Record<Merchant, string> = {
    AMAZON_DE: "tag",
    AZ_DELIVERY: "ref",
    BERRYBASE: "ref",
    REICHELT: "PROVID",
  };
  return `${url}${sep}${param[merchant]}=${encodeURIComponent(trackingId)}`;
}

async function main() {
  const programs = await prisma.affiliateProgram.findMany({
    where: { isActive: true },
  });
  console.log(`Sync für ${CONFIGS.length} Bauteile × ${programs.length} aktive Anbieter…`);

  let upserted = 0;
  let removed = 0;

  for (const cfg of CONFIGS) {
    const owner =
      cfg.kind === "component"
        ? await prisma.component.findUnique({ where: { slug: cfg.slug } })
        : await prisma.board.findUnique({ where: { slug: cfg.slug } });
    if (!owner) {
      console.warn(`  ! ${cfg.kind} '${cfg.slug}' nicht in DB — übersprungen`);
      continue;
    }

    for (const program of programs) {
      const merchant = program.merchant as Merchant;
      const manual = cfg.manualUrls?.[merchant] ?? null;
      const discovered = manual
        ? manual
        : await discoverFor(merchant, {
            query: cfg.searchQuery,
            excludes: cfg.excludes,
          });
      const id = `${program.id}-${owner.id}`;

      if (!discovered) {
        const existed = await prisma.affiliateLink.findUnique({ where: { id } });
        if (existed) {
          await prisma.affiliateLink.delete({ where: { id } });
          removed += 1;
          console.log(`    − ${merchant.padEnd(12)} ${cfg.label}: kein Treffer, Link entfernt`);
        }
        continue;
      }

      const trackedUrl = appendTrackingTag(
        discovered,
        merchant,
        program.trackingId,
      );
      await prisma.affiliateLink.upsert({
        where: { id },
        create: {
          id,
          programId: program.id,
          productUrl: trackedUrl,
          productSlug: discovered,
          componentId: cfg.kind === "component" ? owner.id : null,
          boardId: cfg.kind === "board" ? owner.id : null,
        },
        update: {
          productUrl: trackedUrl,
          productSlug: discovered,
        },
      });
      upserted += 1;
      console.log(`    ✓ ${merchant.padEnd(12)} ${cfg.label}: ${discovered}`);
    }
  }

  console.log(`\n  ${upserted} Links aktualisiert, ${removed} entfernt`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
