# WebSerial-Flash (Phase 7.2)

User können ESP32-Boards direkt aus dem Lesson-Player flashen — kein
Arduino-IDE-Setup. Voraussetzung: Chromium-basierter Desktop-Browser
(Chrome, Edge, Brave) und USB-Kabel mit Datenleitung.

## So funktioniert es

Auf jeder Lesson mit gesetztem `firmwareUrl` zeigt der Step-Player auf
`CODE_WALK`-Steps eine Karte „Direkt auf Board flashen". Klick →
`navigator.serial.requestPort()` → User wählt das Board aus → `esptool-js`
verbindet sich mit dem Bootloader, erkennt den Chip, lädt die `.bin` und
schreibt sie auf den angegebenen Flash-Offset.

Komponente: `src/components/learning/esp-flash-button.tsx`

## Lesson-Felder (Prisma)

```prisma
model Lesson {
  // …
  firmwareUrl          String?   // z. B. https://cdn.microlearn.example/firmware/blink-esp32.bin
  firmwareChip         String?   // "esp32" | "esp32s3" | "esp32c3" | "esp32s2" | "esp8266"
  firmwareFlashAddress String?   // Standard Arduino ESP32: "0x10000"
}
```

Setzen aktuell direkt via Prisma Studio oder SQL:

```sql
UPDATE "Lesson"
SET "firmwareUrl"          = 'https://cdn.microlearn.example/firmware/blink-esp32.bin',
    "firmwareChip"         = 'esp32',
    "firmwareFlashAddress" = '0x10000'
WHERE slug = 'esp32-blink-led';
```

## Firmware-Pipeline (TODO Phase 7.2.1)

- Pro Lesson eine `firmware-source/` mit `platformio.ini` + `src/main.cpp`
- GitHub-Action baut `.bin` per `pio run -e esp32 --target buildfs` und
  pusht Artefakt nach R2 unter `firmware/<slug>-<chip>.bin`
- Admin-UI im Lesson-Wizard zum Eintragen der Felder
- Optional: Cloud-Build via WokwiCI / espressif/idf-docker-image für
  ad-hoc-Sketches

## Hosting + CORS

`firmwareUrl` muss CORS-fähig sein (Browser-Fetch). R2 mit
`Access-Control-Allow-Origin: <unsere-Domain>` reicht. Für lokale Tests:
`.bin` in `public/firmware/` ablegen und mit relativer URL referenzieren
(`/firmware/blink-esp32.bin`).

## Browser-Support

| Browser | Status |
|---------|--------|
| Chrome ≥ 89 (Desktop) | ✅ |
| Edge ≥ 89 (Desktop) | ✅ |
| Brave Desktop | ✅ |
| Safari (alle) | ❌ — Fallback-Karte mit Manual-Anleitung |
| Firefox (alle) | ❌ — Fallback-Karte mit Manual-Anleitung |
| Chrome / Safari iOS | ❌ — WebSerial nicht verfügbar |

Der Component erkennt das automatisch und zeigt im Fallback-Fall die
.bin als Download-Link + Hinweis auf esptool.py / Arduino IDE.

## Sicherheit

- Direkt-Flash nur nach explizitem User-Klick + User-Port-Auswahl (WebSerial
  öffnet einen Browser-Dialog, kein stiller Zugriff).
- Server stellt nur die `.bin` über CDN bereit — kein Server-seitiger
  USB-Zugriff, keine Identifikation des physischen Boards.
- Wir nutzen den offiziellen `esptool-js`-Loader von Espressif (MIT).
