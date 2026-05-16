# Screenshot-Guide

## Pflichtgrößen

### iOS

| Gerät | Auflösung | Stück | Pflicht |
|---|---|---|---|
| iPhone 6.7" (Pro Max) | 1290 × 2796 | 3–10 | ✅ |
| iPhone 6.5" (Plus) | 1242 × 2688 | 3–10 | optional |
| iPad Pro 12.9" (6. Gen) | 2048 × 2732 | 3–10 | ✅ (für iPad-Listing) |

Apple skaliert ältere Geräte vom 6.7"-Set automatisch — daher reicht
6.7" + iPad als Minimum.

### Android

| Gerät | Auflösung | Stück | Pflicht |
|---|---|---|---|
| Handy (Portrait) | 1080 × 1920 oder größer | 2–8 | ✅ |
| 7"-Tablet | 1200 × 1920 | 1–8 | wenn Tablet-Layout publiziert wird |
| 10"-Tablet | 1600 × 2560 | 1–8 | wenn Tablet-Layout publiziert wird |

## Inhalts-Reihenfolge (gleiches Set für iOS + Android)

1. **Hero / Landing** — „Mikroelektronik lernen, Schritt für Schritt" mit
   Lernpfad-Karten im Hintergrund.
2. **Lesson-Player** — laufende Lektion mit BOM, Schaltplan, Code-Snippet.
3. **KI-Mentor** — Chat-View mit einer Beispiel-Frage „Warum blinkt meine
   LED nicht?".
4. **Klassenzimmer-Dashboard** — Schüler:innen-Tabelle + Coverage-Heatmap.
5. **PDF-Zertifikat** — Mockup auf Schreibtisch, Tabletp daneben.
6. **Lehrer-Bericht** — Coverage-PDF in einem Tablet-Frame.
7. **Datenschutz / Schüler-Code-Login** — „Keine E-Mail, kein Geburtstag".

## Quellen
- Marketing-Frames: `assets/screenshots/{ios,android}/<index>.png`
- Pull-Quotes als overlay (Tailwind-Brand-Gelb `#F5B544` auf Dunkelblau
  `#0b1220`)

## Produktion — automatisch via Playwright

```bash
# 1) Dev-Server starten (Port 3030)
pnpm dev

# 2) (Einmalig) Auth-Cookie holen für protected Screens
BASE_URL=http://localhost:3030 pnpm screenshots:capture-session
#   → öffnet Chromium-Fenster, dort einloggen, <enter> im Terminal.
#   → schreibt .screenshot-cookies.json (gitignored)

# 3) Optional: konkrete Klasse setzen
export SCREENSHOT_CLASSROOM_PATH="/classroom/<id>"

# 4) Screenshots erzeugen
BASE_URL=http://localhost:3030 pnpm screenshots:store
#   → docs/store/assets/screenshots/{ios-67,ipad-pro-129,android-phone}/*.png
```

Skript-Eckdaten:

| Device | viewport | DPR | resultierende PNG |
|---|---|---|---|
| `ios-67` | 430 × 932 | 3 | 1290 × 2796 |
| `ipad-pro-129` | 1024 × 1366 | 2 | 2048 × 2732 |
| `android-phone` | 412 × 915 | 2.625 | ~1081 × 2400 (auf 1080 × 1920 croppen) |

Auth-geschützte Routes (`/dashboard`, `/mentor`, `/classroom/*`) werden
übersprungen, solange `.screenshot-cookies.json` nicht existiert — das
Skript meldet das je Routen-Zeile beim Lauf.

## Produktion — manuell (Fallback / Marketing-Frames)

1. App auf realem iPhone 15 Pro Max + iPad Pro 12.9 öffnen
   (oder über Xcode-Simulator → Screenshot-Hotkey ⌘S)
2. Android: Pixel 7 Pro Emulator (1080 × 2400 → auf 1080 × 1920 zuschneiden)
3. Mit Figma-Template `MicroLearn-AppStore.fig` rahmen
   (Marketing-Repo, separater Branch)
4. Export als 24-bit PNG, sRGB-Profil, **kein** Alphakanal für iOS

## Lokalisierung

Screenshots werden in DE **und** EN gepflegt. App Store Connect & Play
Console erkennen pro-Sprach-Sets automatisch.
