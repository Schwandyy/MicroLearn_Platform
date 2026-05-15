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

### 🚧 Phase 2 (next)

- [ ] Lernpfad-/Lesson-Renderer (Konzept → Quiz → Projekt → Final-Quiz)
- [ ] Wokwi-Embed-Wrapper (serverseitiger API-Key)
- [ ] Stripe-Integration (Free/Pro/Institution + Webhook)
- [ ] Scraping-Pipeline (hackster, az-delivery, arduino, randomnerdtutorials, adafruit, GitHub)
- [ ] Claude-Aufbereitung + AI Pre-Check (Sicherheit, Logik, Kompatibilität)
- [ ] Review-Queue + Admin-Interface
- [ ] MeiliSearch-Index
- [ ] KI-Mentor-Chat (Pro)
- [ ] Klassen-Dashboard + Schüler-Code-Generator (Institution)
- [ ] Push-Notifications (Streak-Reminder)

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
