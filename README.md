# MicroLearn

DACH-fokussierte PWA für strukturiertes Mikroelektronik-Lernen. ESP32, Arduino, Pi Pico, STM32 — Lernpfade, Projekte, Wokwi-Simulator, KI-Mentor, Community.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · shadcn/ui · next-intl (DE/EN) · next-pwa · Prisma + PostgreSQL · NextAuth.js v5 · Stripe · Anthropic Claude · MeiliSearch · Cloudflare R2.

---

## Quickstart (lokale Entwicklung)

```bash
# 1) Dependencies
pnpm install

# 2) Postgres + MeiliSearch via Docker
#    (Erfordert Docker Desktop: https://www.docker.com/products/docker-desktop/)
docker compose up -d

# 3) Env
cp .env.example .env.local
# AUTH_SECRET füllen: openssl rand -base64 32

# 4) DB-Schema migrieren + seeden
pnpm db:push
pnpm db:seed

# 5) Dev-Server
pnpm dev
```

App läuft auf <http://localhost:3030> → redirect nach `/de`.

> **Hinweis:** Ohne Docker Desktop kannst du auch eine lokale Postgres-Installation
> (z. B. `brew install postgresql@16 && brew services start postgresql@16`) verwenden
> und `DATABASE_URL` entsprechend setzen.

---

## Verzeichnisstruktur

```
src/
  app/
    layout.tsx                  # root html/body (renders [locale])
    [locale]/
      layout.tsx                # next-intl provider, navbar, toaster
      page.tsx                  # Landing
      auth/sign-in/             # Login (Email/PW + OAuth + Schüler-Code)
      auth/sign-up/             # Registrierung
      assessment/               # Einstufungstest (8 Fragen, Wizard)
      dashboard/                # User-Dashboard
      offline/                  # PWA Offline-Fallback
    api/
      auth/[...nextauth]/       # NextAuth.js v5 handler
      auth/register/            # Email/PW Registrierung
      assessment/               # Server-Auswertung des Quiz
      profile/boards/           # Board-Favoriten
  components/
    ui/                         # shadcn/ui (button, card, input, …)
    auth/                       # SignInForm, SignUpForm, SessionProvider
    quiz/assessment-wizard.tsx  # 8-Fragen-Wizard
    dashboard/                  # BoardSelector etc.
    i18n/language-switch.tsx    # DE/EN Dropdown
    navbar.tsx
  i18n/
    routing.ts                  # next-intl routing definition
    request.ts                  # message loader
  lib/
    utils.ts                    # cn(), locale helpers
    assessment.ts               # Scoring & Level-Mapping
  server/
    auth/                       # NextAuth config + Schüler-Code-System
    db/prisma.ts                # Singleton client
  hooks/use-toast.ts
  middleware.ts                 # next-intl middleware (locale routing)
messages/
  de.json
  en.json
prisma/
  schema.prisma                 # Vollständiges Datenmodell
  seed.ts                       # 5 Boards · 4 Lernpfade · Affiliate-Programme
public/
  manifest.webmanifest
  icons/                        # PWA Icons (s. README dort)
docker-compose.yml              # Postgres 16 + MeiliSearch v1.11
```

---

## Roadmap

### ✅ Phase 1 (dieser Commit)

- [x] Next.js 14 + TypeScript strict + Tailwind + shadcn/ui
- [x] next-intl (DE/EN, /de /en URL-Routing, Sprachswitch)
- [x] next-pwa (Manifest, SW, Offline-Fallback)
- [x] Vollständiges Prisma-Schema (alle Entities, zweisprachige Content-Felder)
- [x] NextAuth.js v5 mit 6 Methoden (Email/PW, Google, GitHub, Apple, SAML-Hook, Schüler-Code)
- [x] Schüler-Code-System (DSGVO für Minderjährige, kein PII)
- [x] Assessment-Quiz (8 Fragen, visueller Wizard, Auto-Level)
- [x] Nutzer-Dashboard (Lernpfade, XP, Streak, Boards, Sprachswitch)

### ✅ Phase 2

- [x] Port 3030 (3000 lokal belegt)
- [x] Lesson-Renderer (Konzept → Mini-Quiz → Wokwi-Projekt → Schaltplan/Safety → Final-Quiz → XP/Streak)
- [x] Wokwi-Embed via iframe (öffentliche Projekte), serverseitiger API-Key vorbereitet
- [x] Stripe-Integration (Pricing, Checkout, Customer-Portal, Webhook mit Signaturprüfung)
- [x] Scraping-Pipeline (az-delivery, randomnerdtutorials, GitHub READMEs)
- [x] Claude-Aufbereitung (bilinguale JSON-Lessons mit Prompt-Caching) + AI Pre-Check (Safety/Logic/Compat/Language)
- [x] Review-Queue + Admin-Interface (Approve/Request Changes/Reject)
- [x] MeiliSearch-Index + `/api/search`
- [x] KI-Mentor-Chat (Pro, streaming via SSE, kontextuell, 50/Tag Rate-Limit)
- [x] Klassen-Dashboard + Schüler-Code-Generator (Institution)
- [x] Push-Notifications (VAPID, Streak-Reminder Cron 18:00 UTC)
- [x] Cookie-Banner (DSGVO, localStorage)

### ✅ Phase 3

- [x] Community-Projekte (Showcase, Likes, Kommentare, UGC-Rate-Limits)
- [x] Klassen-Workflow (Bulk-Assignment, Detail-Tabs, Teacher-Aktivität)
- [x] Creator-Flow (Step-Bilder, Drag-Reorder, Lesson-Edit, Onboarding)
- [x] Moderation + Legal (Admin-Dashboard, Impressum, AGB, Footer)
- [x] PDF-Zertifikate (@react-pdf/renderer, OG-Image, Verify-QR)
- [x] Lehrplan-Mapping (CurriculumStandard für BW/BY/NRW MINT,
      Lehrer-Tagging im Creator, /paths-Filter, Klassen-State+Grade)
- [x] Content-Scraper: Adafruit Learn + Hackster.io (ATOM-Feeds)

### ✅ Phase 4

- [x] Lehrer-Reporting-PDF mit Curriculum-Coverage
      (`@react-pdf/renderer`, bilingual, je Klasse: Schüler:innen-Tabelle +
      Standard-Abdeckung BW/BY/NRW/AT/CH inkl. "offen / abgedeckt"-Badge)
- [x] Curriculum-Standards für AT (Lehrplan Sek I/II) und CH (LP21)
      — 14 zusätzliche Einträge, Bundesländer-Dropdown gruppiert DE / AT / CH
- [x] Mehr Scraper-Quellen: SparkFun Learn (`/feeds/tutorials` ATOM) +
      Pimoroni Learn (`/article/<slug>`-Crawl mit Topic-Filter)
- [x] Capacitor Mobile-Wrapper (iOS + Android via PWA-Bridge, server.url
      zeigt auf die produktive Next.js-Deployment, www/ als Bootstrap-Shell)

### ✅ Phase 5

- [x] Live Coverage-Heatmap im Teacher-Dashboard (Standards × Schüler:innen,
      sticky Header/Spalte, geteilte Coverage-Logik mit dem PDF)
- [x] Wochenbericht-Mail via Resend (Cron Montags 07:00 UTC,
      bilingualer HTML+Text-Digest mit Stat-Karten + Top-Aktiven)
- [x] App-Store-Submission-Pack in `docs/store/` (iOS PrivacyInfo,
      DE+EN-Listings für App Store + Play Console, Review-Notes,
      Data-Safety-Formular, Screenshot-Guide)
- [x] Capacitor-Asset-Pipeline: Platzhalter-Generator (`assets/logo.png`
      via sharp+SVG), `pnpm mobile:assets:placeholders` + `pnpm mobile:assets`

### ✅ Phase 6

- [x] One-Click-Opt-out für Wochenmail (signierter HMAC-Token im Mail-Link,
      `weeklyDigestOptOut` auf User, Settings-Toggle nur für Lehrkräfte)
- [x] KI-Curriculum-Vorschlag im Creator (Claude bekommt Lesson + Kandidaten,
      gibt ≤5 Standards + Konfidenz + Begründung zurück, „Übernehmen"-Button)
- [x] Stripe Currency-Auto-Detect (EUR/CHF, CH/LI → CHF, Pill-Switcher,
      Annual-Save-Bubble auf Pro-Yearly-Card; `STRIPE_PRICE_*_CHF` envs)
- [x] Automatische App-Store-Screenshots via Playwright (iOS 6.7", iPad Pro
      12.9", Android Phone, Auth-Session über `pnpm screenshots:capture-session`)

### 📱 Mobile-App bauen (Capacitor)

```bash
# 1) Produktiv-URL setzen (oder direkt capacitor.config.ts editieren)
export MICROLEARN_MOBILE_URL=https://app.microlearn.example

# 2) Native Projekte erzeugen (einmalig, danach in .gitignore)
pnpm mobile:add:ios       # benötigt Xcode + CocoaPods
pnpm mobile:add:android   # benötigt Android Studio + JDK 17

# 3) Icons + Splash erzeugen
#    Optional: Platzhalter erzeugen, wenn assets/logo.png noch nicht designt ist
pnpm mobile:assets:placeholders
pnpm mobile:assets

# 4) Web → native syncen + öffnen
pnpm mobile:sync
pnpm mobile:open:ios
pnpm mobile:open:android
```

Die App lädt die produktive Web-Version in einer WKWebView (iOS) / WebView
(Android); der PWA-Service-Worker übernimmt Offline-Caching. Stripe, NextAuth,
Push & R2 funktionieren unverändert, weil sie weiterhin gegen den Next-Server
laufen.

---

## Sicherheit / DSGVO

- **Schüler-Code-Accounts** speichern keine E-Mail, kein Passwort, keinen Geburtstag, kein Profilbild — nur einen selbstgewählten Benutzernamen + Klassen-Zugehörigkeit. Lehrer kann jederzeit deaktivieren.
- **Cookies** Cookie-Banner ist in Phase 2 vorgesehen; default werden nur strikt notwendige Cookies gesetzt.
- **Stripe Webhooks** Signatur-Validierung via `stripe.webhooks.constructEvent`.
- **Rate-Limiting** Upstash Redis + `@upstash/ratelimit` (in Phase 2 auf `/api/*` aktiviert).
- **CSP/Headers** Basis-Header in `next.config.mjs` (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## Lizenz

Proprietary — © AZ-Delivery / Andreas Habedank.
