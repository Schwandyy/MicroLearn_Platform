# Capacitor-Asset-Sources

Diese Dateien sind die **Quelle** für `pnpm mobile:assets` und damit für
alle iOS-Icons, Android-Adaptive-Icons, Splash-Screens etc.

| Datei | Pflicht | Verwendung |
|---|---|---|
| `logo.png` | ja (1024×1024) | Light-Mode-Source |
| `logo-dark.png` | optional | Dark-Mode-Variante |

## Aktueller Stand

Die `logo*.png`-Dateien sind **Platzhalter**, generiert von
`pnpm mobile:assets:placeholders`. Sie sollen das Build-Toolchain-Setup
verifizieren — nicht in den Store gehen.

## Wenn das Design fertig ist

1. **Ersetze** `logo.png` (+ optional `logo-dark.png`) durch das echte
   1024×1024-Asset (PNG, sRGB, keine Transparenz im sichtbaren Bereich).
2. Führe einmal `pnpm mobile:assets` aus.
3. Committe die neuen Native-Outputs in `ios/App/App/Assets.xcassets/` und
   `android/app/src/main/res/`.

> **Hinweis:** Das Capacitor-Asset-CLI bevorzugt SVG-Quellen, fällt aber
> automatisch auf PNG zurück. Wenn du ein SVG-Logo hast, lege es als
> `logo.svg` ab — die PNG-Versionen werden dann obsolet.
