# Store-Submission-Pack

Alles, was du brauchst, um MicroLearn in den **Apple App Store** und den
**Google Play Store** zu bekommen. Die App selbst ist ein Capacitor-WebView
auf die produktive Next.js-Deployment (siehe Haupt-`README.md` → Phase 4).

| Datei | Zweck |
|---|---|
| `ios-privacy-manifest.md` | Werte für `PrivacyInfo.xcprivacy` (iOS 17+ Pflicht) |
| `ios-app-store-listing.md` | App-Store-Listing-Texte DE + EN, Keywords, Promo |
| `ios-review-notes.md` | Fragen, mit denen Apples App-Review meist startet, plus unsere Antworten |
| `android-play-listing.md` | Play-Console-Listing-Texte DE + EN, Promo |
| `android-data-safety.md` | Antworten für das Play „Data Safety"-Formular |
| `screenshots.md` | Welche Screens, in welchen Auflösungen, in welcher Sprache |

## Reihenfolge (typischer Submission-Run)

1. **Produktiv-Build verifizieren** — App-URL aus
   `MICROLEARN_MOBILE_URL` liefert HTTPS, Lighthouse PWA-Score > 90,
   Auth + Stripe + Push funktionieren in iOS Safari + Android Chrome.
2. **Native Projekte erzeugen** —
   `pnpm mobile:add:ios && pnpm mobile:add:android`.
3. **Bundle-IDs prüfen** — `com.azdelivery.microlearn` muss in iTunes Connect
   und Play Console identisch hinterlegt sein.
4. **Icons & Splash** — `assets/icon.png` + `assets/splash.png` (1024×1024)
   pflegen, dann `pnpm mobile:assets`.
5. **iOS Privacy Manifest** — Werte aus `ios-privacy-manifest.md` in
   `ios/App/App/PrivacyInfo.xcprivacy` übernehmen (Xcode → New File →
   App Privacy).
6. **Screenshots** — siehe `screenshots.md`. iOS 6.7" + iPad Pro 12.9";
   Android Phone + 7"-Tablet.
7. **Listing-Texte** — DE + EN aus den Listing-Dateien einsetzen.
8. **TestFlight / Play Internal Track** — interne Tester laden, einmal
   einen *bezahlten* Pro-Flow durchspielen (für die Apple-Reviewer).
9. **Submission** mit Review-Notes-Datei als „Notes to Reviewer" hinterlegen.

## Wer hilft im Notfall
- Apple Developer Support: <https://developer.apple.com/contact/>
- Google Play Console Hilfe: <https://support.google.com/googleplay/android-developer>
