// Schließt fehlende packageNote_*-Felder auf AffiliateLink, damit Schüler
// verstehen, dass z.B. 5.99 € für eine LED in Wahrheit ein 100er-Pack ist.
// User-Feedback 2026-05-17: Preise wirken absurd ohne Pack-Kontext.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface PackNote {
  matchUrl: string; // substring match
  de: string;
  en: string;
}

const NOTES: PackNote[] = [
  // ESP32 — Einzelpreise sind ok, kein Pack-Hinweis nötig
  // LED-Rot Reichelt = Einzelpreis ~0.09 €
  {
    matchUrl: "reichelt.de/de/de/shop/produkt/flat-led_5mm_rot",
    de: "Einzelpreis · LED-Sets gibt es bei Reichelt günstiger ab 25 Stück",
    en: "Single piece price · cheaper from 25 pcs at Reichelt",
  },
  // Widerstand Reichelt = Einzelpreis 0.10 €
  {
    matchUrl: "reichelt.de/de/de/shop/produkt/widerstand_metallschicht_220",
    de: "Einzelpreis · Pack ab 10 Stück günstiger",
    en: "Single piece price · cheaper from 10 pcs",
  },
  // Amazon ESP32 Einzel
  {
    matchUrl: "amazon.de/dp/B071P98VTG",
    de: "1 ESP32 mit Lieferzeit Prime",
    en: "Single ESP32, Prime delivery",
  },
  // AZ-Delivery ESP32 Einzel
  {
    matchUrl: "az-delivery.de/products/esp32-developmentboard",
    de: "1× ESP32 NodeMCU",
    en: "1× ESP32 NodeMCU",
  },
  // AZ-Delivery USB
  {
    matchUrl: "az-delivery.de/products/micro-usb-zu-usb-kabel",
    de: "1m Datenkabel",
    en: "1 m data cable",
  },
  // Amazon USB Suche → unsicher, generic hint
  {
    matchUrl: "amazon.de/s?k=micro+usb+datenkabel",
    de: "Suchergebnis — wähle ein Datenkabel, KEIN reines Ladekabel",
    en: "Search result — pick a data cable, NOT charge-only",
  },
  // Breadboard Reichelt
  {
    matchUrl: "reichelt.de/de/de/shop/produkt/experimentier-steckboard_830_kontakte",
    de: "830 Kontakte (volle Größe)",
    en: "830 contacts (full size)",
  },
  {
    matchUrl: "az-delivery.de/products/breadboard",
    de: "830 Kontakte",
    en: "830 contacts",
  },
  {
    matchUrl: "amazon.de/dp/B07LFD4LT6",
    de: "3er Pack Breadboards",
    en: "3-pack breadboards",
  },
];

async function main() {
  let updated = 0;
  for (const note of NOTES) {
    const result = await prisma.affiliateLink.updateMany({
      where: {
        productUrl: { contains: note.matchUrl },
      },
      data: {
        packageNote_de: note.de,
        packageNote_en: note.en,
      },
    });
    if (result.count > 0) {
      console.log(`[+] ${note.matchUrl} → ${result.count} Affiliate-Links aktualisiert`);
      updated += result.count;
    } else {
      console.log(`[ ] ${note.matchUrl} → kein Match`);
    }
  }
  console.log(`\n✅ ${updated} packageNote-Einträge geschrieben.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
