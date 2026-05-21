import "server-only";

/**
 * Wird in Impressum/Privacy/AGB verwendet. Setze in .env entsprechende Werte —
 * lass keine Felder leer in Produktion, sonst stehen Platzhalter live.
 *
 * Empfohlene env-Variablen:
 *   LEGAL_COMPANY=MicroLearn UG (haftungsbeschränkt)
 *   LEGAL_OWNER=Max Muster
 *   LEGAL_STREET=Musterstr. 1
 *   LEGAL_ZIP=10115
 *   LEGAL_CITY=Berlin
 *   LEGAL_COUNTRY=Deutschland
 *   LEGAL_EMAIL=hi@example.com
 *   LEGAL_PHONE=+49 30 1234567
 *   LEGAL_VAT=DE123456789
 *   LEGAL_REGISTER=HRB 12345 (Amtsgericht Berlin)
 *   LEGAL_RESPONSIBLE=Max Muster (gleiche Adresse wie oben)
 */
export interface LegalConfig {
  company: string;
  owner: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  email: string;
  phone: string | null;
  vat: string | null;
  register: string | null;
  responsible: string;
}

export function legalConfig(): LegalConfig {
  return {
    company: process.env.LEGAL_COMPANY ?? "MicroLearn (Platzhalter)",
    owner: process.env.LEGAL_OWNER ?? "Vertretungsberechtigte Person",
    street: process.env.LEGAL_STREET ?? "Straße + Hausnummer",
    zip: process.env.LEGAL_ZIP ?? "PLZ",
    city: process.env.LEGAL_CITY ?? "Stadt",
    country: process.env.LEGAL_COUNTRY ?? "Deutschland",
    email: process.env.LEGAL_EMAIL ?? "habedank@odisey.de",
    phone: process.env.LEGAL_PHONE ?? null,
    vat: process.env.LEGAL_VAT ?? null,
    register: process.env.LEGAL_REGISTER ?? null,
    responsible:
      process.env.LEGAL_RESPONSIBLE ??
      process.env.LEGAL_OWNER ??
      "Vertretungsberechtigte Person",
  };
}
