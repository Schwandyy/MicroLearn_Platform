# PWA Icons

Vor dem Production-Build hier ablegen:

- `icon-192.png` — 192×192, transparenter Hintergrund oder Markenfarbe, mit Safe-Zone (10 %) für `maskable`
- `icon-512.png` — 512×512, gleiches Layout
- (optional) `icon-maskable-512.png`, `apple-touch-icon.png` (180×180)

Quick-Generator: https://realfavicongenerator.net/ oder `pnpm dlx pwa-asset-generator logo.svg public/icons`.

Solange Platzhalter-PNGs fehlen, zeigt Lighthouse einen Manifest-Warning — App läuft trotzdem.
