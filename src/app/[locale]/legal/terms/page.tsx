import { setRequestLocale } from "next-intl/server";
import { legalConfig } from "@/server/lib/legal-config";

export const metadata = {
  title: "AGB / Terms",
  description: "Allgemeine Geschäftsbedingungen / Terms of Service",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = legalConfig();
  const isDe = locale === "de";

  if (isDe) {
    return (
      <div className="container max-w-3xl py-12 prose prose-sm dark:prose-invert max-w-none">
        <h1>Allgemeine Geschäftsbedingungen</h1>

        <h2>1. Anbieter und Geltungsbereich</h2>
        <p>
          Diese AGB gelten für die Nutzung der MicroLearn-Plattform, betrieben
          von {c.company}, {c.street}, {c.zip} {c.city}, {c.country}.
        </p>

        <h2>2. Leistungsumfang</h2>
        <p>
          MicroLearn bietet strukturierte Online-Lerninhalte zur Mikroelektronik
          inkl. Quiz, Simulator, KI-gestütztem Mentor und Community-Funktionen.
          Inhalte werden laufend erweitert. Wir können einzelne Funktionen
          jederzeit anpassen oder einstellen, soweit das für dich zumutbar ist.
        </p>

        <h2>3. Registrierung und Konto</h2>
        <ul>
          <li>
            Reguläre Konten erfordern eine gültige E-Mail-Adresse. Du bist für
            die Sicherheit deines Passworts selbst verantwortlich.
          </li>
          <li>
            Schüler-Konten (über Klassencode) werden ohne E-Mail angelegt und
            sind an einen Lehrer-Account gebunden. Eine Übertragung des Kontos
            ist nicht möglich.
          </li>
          <li>
            Mehrfach-Konten oder Konten zur Umgehung von Sperren sind nicht
            zulässig.
          </li>
        </ul>

        <h2>4. Pro- und Institution-Tarife</h2>
        <ul>
          <li>
            Kostenpflichtige Tarife werden über Stripe abgerechnet. Es gilt das
            jeweils auf der Preisseite ausgewiesene Modell (monatlich/jährlich).
          </li>
          <li>
            Abos verlängern sich automatisch, solange du sie nicht im{" "}
            <a href="/de/pricing">Stripe-Customer-Portal</a> kündigst. Die
            Kündigung wird zum Ende der laufenden Periode wirksam.
          </li>
          <li>
            Verbraucher haben ein 14-tägiges Widerrufsrecht — siehe Abschnitt 5.
          </li>
        </ul>

        <h2>5. Widerrufsbelehrung (Verbraucher)</h2>
        <p>
          Du hast das Recht, binnen 14 Tagen ohne Angabe von Gründen diesen
          Vertrag zu widerrufen, indem du uns per E-Mail an{" "}
          <a href={`mailto:${c.email}`}>{c.email}</a> kontaktierst. Bereits
          gezahlte Beträge erstatten wir innerhalb von 14 Tagen. Mit Beginn der
          Nutzung der kostenpflichtigen Inhalte erlischt das Widerrufsrecht
          ggf. vorzeitig — wir holen dafür beim Checkout deine ausdrückliche
          Zustimmung ein.
        </p>

        <h2>6. Nutzer-Inhalte (Projekte & Kommentare)</h2>
        <ul>
          <li>
            Du behältst alle Rechte an Inhalten, die du veröffentlichst.
            Du räumst uns aber das einfache, unentgeltliche Recht ein, deine
            Inhalte im Rahmen des Plattform-Betriebs darzustellen.
          </li>
          <li>
            Du versicherst, alle nötigen Rechte an den hochgeladenen Inhalten
            zu haben (insb. Bildrechte).
          </li>
          <li>
            Verboten sind insbesondere: rechtswidrige Inhalte, Werbung, Spam,
            personenbezogene Daten Dritter, sicherheitskritische Anleitungen
            (z. B. zur Manipulation gefährlicher Spannungen), urheberrechtlich
            geschützte Inhalte ohne Erlaubnis.
          </li>
          <li>
            Wir können Inhalte ohne Vorwarnung entfernen, wenn sie gegen diese
            Regeln verstoßen.
          </li>
        </ul>

        <h2>7. KI-Mentor</h2>
        <p>
          Der KI-Mentor (gestützt auf Anthropic Claude) ist ein Lern-Assistent —
          keine Beratung durch einen ausgebildeten Lehrer. Wir übernehmen keine
          Gewähr für die Richtigkeit oder Sicherheit konkreter Schaltungs- oder
          Code-Vorschläge. Prüfe Spannungen, Polung und Strom-Grenzen immer
          selbst, bevor du etwas in Betrieb nimmst.
        </p>

        <h2>8. Affiliate-Links</h2>
        <p>
          Manche Links zu Bauteilen sind Affiliate-Links. Kaufst du darüber,
          erhalten wir eine Provision vom Händler. Für dich entstehen keine
          Mehrkosten. Wir sind in der Auswahl der Anbieter neutral.
        </p>

        <h2>9. Haftung</h2>
        <p>
          Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit. Für
          leichte Fahrlässigkeit haften wir nur bei Verletzung wesentlicher
          Vertragspflichten, und nur in Höhe des vorhersehbaren, typischen
          Schadens. Eine darüber hinausgehende Haftung — insbesondere für
          Schäden durch fehlerhaft umgesetzte Lerninhalte — ist ausgeschlossen.
        </p>

        <h2>10. Schlussbestimmungen</h2>
        <p>
          Es gilt deutsches Recht. Verbraucher genießen den Schutz der
          zwingenden Vorschriften ihres gewöhnlichen Aufenthaltsorts.
          Gerichtsstand für Kaufleute ist {c.city}.
        </p>

        <hr />
        <p className="text-xs text-muted-foreground">
          Template-Fassung — vor Go-Live unbedingt anwaltlich prüfen lassen.
        </p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-12 prose prose-sm dark:prose-invert max-w-none">
      <h1>Terms of Service</h1>

      <h2>1. Provider and scope</h2>
      <p>
        These Terms apply to the use of the MicroLearn platform, operated by{" "}
        {c.company}, {c.street}, {c.zip} {c.city}, {c.country}.
      </p>

      <h2>2. Service</h2>
      <p>
        MicroLearn provides structured online learning content for
        microelectronics including quizzes, simulators, AI mentor and community
        features. Content is added continuously. We may adapt or discontinue
        individual features at any reasonable time.
      </p>

      <h2>3. Account</h2>
      <ul>
        <li>
          Regular accounts require a valid email address. You are responsible
          for keeping your password safe.
        </li>
        <li>
          Student accounts (via classroom code) are created without email and
          are tied to a teacher account. Accounts cannot be transferred.
        </li>
        <li>
          Multiple accounts or accounts created to evade bans are not allowed.
        </li>
      </ul>

      <h2>4. Paid plans (Pro, Institution)</h2>
      <ul>
        <li>Paid plans are billed via Stripe per the pricing page.</li>
        <li>
          Subscriptions renew automatically until cancelled in the{" "}
          <a href="/en/pricing">Stripe customer portal</a>. Cancellations take
          effect at the end of the current billing period.
        </li>
        <li>EU consumers have a 14-day right of withdrawal — see Section 5.</li>
      </ul>

      <h2>5. Right of withdrawal (EU consumers)</h2>
      <p>
        You have the right to withdraw from this contract within 14 days without
        giving reasons by emailing us at{" "}
        <a href={`mailto:${c.email}`}>{c.email}</a>. We will refund any paid
        amounts within 14 days. Right of withdrawal may end earlier once you
        start using paid content — we obtain your explicit consent for this at
        checkout.
      </p>

      <h2>6. User content</h2>
      <ul>
        <li>
          You keep all rights to content you publish. You grant us a simple,
          royalty-free right to display your content as part of operating the
          platform.
        </li>
        <li>
          You confirm you have the necessary rights to all content you upload
          (especially image rights).
        </li>
        <li>
          Prohibited: unlawful content, ads, spam, personal data of third
          parties, dangerous wiring instructions (high voltage etc.), copyrighted
          material without permission.
        </li>
        <li>
          We may remove content without notice if it violates these rules.
        </li>
      </ul>

      <h2>7. AI mentor</h2>
      <p>
        The AI mentor (powered by Anthropic Claude) is a learning assistant —
        not certified teaching. We make no warranty regarding the correctness or
        safety of any specific schematic or code suggestion. Always verify
        voltages, polarities and current limits yourself before powering
        anything on.
      </p>

      <h2>8. Affiliate links</h2>
      <p>
        Some component links are affiliate links. If you buy through them, we
        receive a commission. There is no additional cost for you. Our retailer
        selection is neutral.
      </p>

      <h2>9. Liability</h2>
      <p>
        We are fully liable for intent and gross negligence. For slight
        negligence we are only liable for breach of essential contractual duties
        and only up to the foreseeable, typical damage. Any further liability —
        especially for damage caused by incorrectly implemented tutorials — is
        excluded.
      </p>

      <h2>10. Final provisions</h2>
      <p>
        German law applies. Consumers retain the protection of mandatory
        provisions of their place of habitual residence. For merchants, the
        place of jurisdiction is {c.city}.
      </p>

      <hr />
      <p className="text-xs text-muted-foreground">
        Template — have it reviewed by a lawyer before going live.
      </p>
    </div>
  );
}
