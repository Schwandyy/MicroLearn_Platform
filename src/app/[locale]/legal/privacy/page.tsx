import { setRequestLocale } from "next-intl/server";
import { legalConfig } from "@/server/lib/legal-config";

export const metadata = {
  title: "Datenschutz / Privacy",
  description: "Datenschutzerklärung / Privacy policy",
};

export default async function PrivacyPage({
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
        <h1>Datenschutzerklärung</h1>

        <h2>1. Verantwortlicher</h2>
        <p>
          {c.company}, {c.street}, {c.zip} {c.city}, {c.country}.
          <br />
          E-Mail: <a href={`mailto:${c.email}`}>{c.email}</a>
        </p>

        <h2>2. Welche Daten wir verarbeiten</h2>
        <ul>
          <li>
            <strong>Konto-Daten</strong>: E-Mail, Name (optional), Avatar
            (optional), gehashtes Passwort. Bei OAuth-Login zusätzlich vom Anbieter
            (Google/GitHub/Apple) gelieferte Profilinformationen.
          </li>
          <li>
            <strong>Schüler-Codes</strong> (DSGVO-konform für Minderjährige):
            Nur ein selbstgewählter Benutzername — keine E-Mail, kein
            Geburtsdatum, kein echter Name.
          </li>
          <li>
            <strong>Lern-Fortschritt</strong>: abgeschlossene Lektionen,
            XP, Streaks, Quiz-Antworten.
          </li>
          <li>
            <strong>User-generated Content</strong>: Projekt-Beiträge,
            Kommentare, Bilder (falls hochgeladen).
          </li>
          <li>
            <strong>Zahlungsdaten</strong>: werden über Stripe Inc. abgewickelt
            (separate Datenverarbeitung, Stripe Privacy Policy beachten).
          </li>
          <li>
            <strong>Technische Daten</strong>: Server-Logs (IP, User-Agent,
            Zeitstempel) zur Fehlerbehebung und Missbrauchs-Erkennung.
          </li>
        </ul>

        <h2>3. Rechtsgrundlagen</h2>
        <p>
          Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) für Konto-Funktionen
          und Lernbetrieb; Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
          für Logs und Sicherheits-Funktionen; Art. 6 Abs. 1 lit. a DSGVO
          (Einwilligung) für Marketing-E-Mails und Cookies, die nicht technisch
          notwendig sind.
        </p>

        <h2>4. Drittanbieter (Auftragsverarbeiter)</h2>
        <ul>
          <li>
            <strong>Vercel Inc.</strong> – Hosting (Datenübermittlung in die USA
            auf Basis Standardvertragsklauseln).
          </li>
          <li>
            <strong>Stripe Inc.</strong> – Zahlungsabwicklung.
          </li>
          <li>
            <strong>Cloudflare R2</strong> – Bild-Speicherung (sofern aktiviert).
          </li>
          <li>
            <strong>Anthropic PBC</strong> – KI-Mentor und Quiz-Bewertung. Wir
            senden den Lektions-Kontext und die Anfrage des Nutzers an die
            Claude-API; es findet kein Training auf diesen Daten statt.
          </li>
          <li>
            <strong>Resend Inc.</strong> – Transaktionale E-Mails (z. B.
            Passwort-Reset).
          </li>
        </ul>

        <h2>5. Cookies</h2>
        <p>
          Wir verwenden technisch notwendige Cookies für Anmeldung und Sprache.
          Funktionale Cookies (z. B. Theme, &bdquo;Hab ich&ldquo;-Marker für Bauteile)
          werden in Local Storage gespeichert. Eine ausdrückliche Einwilligung
          ist für nicht-notwendige Cookies erforderlich — siehe Cookie-Banner.
        </p>

        <h2>6. Speicherdauer</h2>
        <p>
          Konto-Daten werden gespeichert, solange dein Konto existiert. Bei
          Löschung über <a href="/de/settings">Einstellungen → Konto löschen</a>{" "}
          werden alle direkt zuordenbaren Daten unverzüglich entfernt.
          Buchhaltungsrelevante Rechnungen können wir aus gesetzlichen Gründen
          bis zu 10 Jahre aufbewahren.
        </p>

        <h2>7. Deine Rechte</h2>
        <p>
          Du hast jederzeit das Recht auf Auskunft (Art. 15), Berichtigung
          (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18),
          Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Auskunft
          und Export kannst du selbst unter{" "}
          <a href="/de/settings">Einstellungen → Daten exportieren</a> auslösen.
        </p>

        <h2>8. Beschwerderecht</h2>
        <p>
          Du kannst dich bei einer Aufsichtsbehörde beschweren — in Deutschland
          ist das die jeweilige Landesdatenschutzbehörde.
        </p>

        <hr />
        <p className="text-xs text-muted-foreground">
          Stand: Template — bitte vor Go-Live anwaltlich prüfen lassen.
        </p>
      </div>
    );
  }

  // English
  return (
    <div className="container max-w-3xl py-12 prose prose-sm dark:prose-invert max-w-none">
      <h1>Privacy Policy</h1>

      <h2>1. Controller</h2>
      <p>
        {c.company}, {c.street}, {c.zip} {c.city}, {c.country}.
        <br />
        Email: <a href={`mailto:${c.email}`}>{c.email}</a>
      </p>

      <h2>2. Data we process</h2>
      <ul>
        <li>
          <strong>Account data</strong>: email, name (optional), avatar
          (optional), hashed password. OAuth providers (Google/GitHub/Apple)
          may share additional profile info.
        </li>
        <li>
          <strong>Student codes</strong> (GDPR-friendly for minors): only a
          self-chosen nickname — no email, no birth date, no real name.
        </li>
        <li>
          <strong>Learning progress</strong>: completed lessons, XP, streaks,
          quiz answers.
        </li>
        <li>
          <strong>User content</strong>: project posts, comments, uploaded
          images.
        </li>
        <li>
          <strong>Payment data</strong>: handled by Stripe Inc. (separate
          processing).
        </li>
        <li>
          <strong>Technical data</strong>: server logs (IP, user agent, time)
          for error handling and abuse detection.
        </li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>
        Art. 6(1)(b) GDPR (contract) for account and learning features;
        Art. 6(1)(f) GDPR (legitimate interest) for logs and security;
        Art. 6(1)(a) GDPR (consent) for marketing emails and non-essential
        cookies.
      </p>

      <h2>4. Sub-processors</h2>
      <ul>
        <li><strong>Vercel Inc.</strong> – hosting (US transfer under SCCs).</li>
        <li><strong>Stripe Inc.</strong> – payment processing.</li>
        <li><strong>Cloudflare R2</strong> – image storage (when enabled).</li>
        <li>
          <strong>Anthropic PBC</strong> – AI mentor and quiz scoring. Lesson
          context and user prompt are sent to the Claude API; no training on
          this data.
        </li>
        <li>
          <strong>Resend Inc.</strong> – transactional emails (e.g. password
          reset).
        </li>
      </ul>

      <h2>5. Cookies</h2>
      <p>
        We use strictly necessary cookies for sign-in and language. Functional
        preferences (theme, &quot;owned-it&quot; markers) live in Local Storage.
        Non-essential cookies require explicit consent — see the cookie banner.
      </p>

      <h2>6. Retention</h2>
      <p>
        Account data is kept while your account exists. On deletion via{" "}
        <a href="/en/settings">Settings → Delete account</a>, directly
        attributable data is removed immediately. Billing-relevant invoices may
        be retained for up to 10 years for tax reasons.
      </p>

      <h2>7. Your rights</h2>
      <p>
        You have the right to access (Art. 15), rectification (Art. 16), erasure
        (Art. 17), restriction (Art. 18), portability (Art. 20), and objection
        (Art. 21). Access and export are self-service via{" "}
        <a href="/en/settings">Settings → Export your data</a>.
      </p>

      <h2>8. Right to complain</h2>
      <p>
        You can lodge a complaint with a supervisory authority in your country
        of residence.
      </p>

      <hr />
      <p className="text-xs text-muted-foreground">
        Template — please have it reviewed by a lawyer before going live.
      </p>
    </div>
  );
}
