import { setRequestLocale } from "next-intl/server";
import { legalConfig } from "@/server/lib/legal-config";

export const metadata = {
  title: "Impressum",
  description: "Impressum / Legal notice",
};

export default async function ImprintPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = legalConfig();
  const isDe = locale === "de";

  return (
    <div className="container max-w-3xl py-12 prose prose-sm dark:prose-invert max-w-none">
      <h1>{isDe ? "Impressum" : "Legal Notice"}</h1>

      <p>
        {isDe
          ? "Angaben gemäß § 5 TMG / § 18 MStV:"
          : "Information according to § 5 TMG / § 18 MStV:"}
      </p>

      <p>
        <strong>{c.company}</strong>
        <br />
        {c.street}
        <br />
        {c.zip} {c.city}
        <br />
        {c.country}
      </p>

      <h2>{isDe ? "Vertreten durch" : "Represented by"}</h2>
      <p>{c.owner}</p>

      <h2>{isDe ? "Kontakt" : "Contact"}</h2>
      <p>
        {isDe ? "E-Mail" : "Email"}:{" "}
        <a href={`mailto:${c.email}`}>{c.email}</a>
        {c.phone ? (
          <>
            <br />
            {isDe ? "Telefon" : "Phone"}: {c.phone}
          </>
        ) : null}
      </p>

      {c.register && (
        <>
          <h2>{isDe ? "Registereintrag" : "Commercial register"}</h2>
          <p>{c.register}</p>
        </>
      )}

      {c.vat && (
        <>
          <h2>
            {isDe
              ? "Umsatzsteuer-ID"
              : "VAT ID"}
          </h2>
          <p>
            {isDe
              ? "Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: "
              : "VAT identification number according to Section 27a German VAT Act: "}
            {c.vat}
          </p>
        </>
      )}

      <h2>
        {isDe
          ? "Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)"
          : "Responsible for content"}
      </h2>
      <p>
        {c.responsible}
        <br />
        {c.street}, {c.zip} {c.city}, {c.country}
      </p>

      <h2>
        {isDe ? "EU-Streitschlichtung" : "EU dispute resolution"}
      </h2>
      <p>
        {isDe
          ? "Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: "
          : "The European Commission provides a platform for online dispute resolution (ODR): "}
        <a
          href="https://ec.europa.eu/consumers/odr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://ec.europa.eu/consumers/odr/
        </a>
        .
      </p>

      <h2>
        {isDe
          ? "Hinweis zur Verbraucherstreitbeilegung"
          : "Consumer dispute resolution notice"}
      </h2>
      <p>
        {isDe
          ? "Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."
          : "We are not willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board."}
      </p>

      <hr />
      <p className="text-xs text-muted-foreground">
        {isDe
          ? "Hinweis: Diese Seite wird aus Umgebungsvariablen gefüllt. Vor Go-Live unbedingt anwaltlich prüfen lassen."
          : "Note: This page is populated from environment variables. Please have it reviewed by a lawyer before going live."}
      </p>
    </div>
  );
}
