# Notes to App Review (iOS)

> Diese Notiz wird im App-Store-Connect-Feld **„Notes for App Review"**
> eingegeben. Apple zieht das ungekürzt, also alles muss da rein.

---

## Demo-Account

```
Email: review-apple@microlearn.example
Pass:  ReviewApple-2026!
```

Dieser Account ist **Institution-Tier** und hat eine Demo-Klasse mit
3 vorausgefüllten Schüler:innen. Damit könnt ihr alle bezahlten Flows
verifizieren ohne Stripe-Checkout zu durchlaufen.

Schüler-Code für die WebView-Schüleransicht: **`DEMO-2026`** (gültig 30 Tage).

## Was die App tut

MicroLearn ist eine Bildungs-App für Mikroelektronik (Arduino, ESP32,
Raspberry Pi Pico). Die App ist ein Capacitor-WebView auf unsere
PWA-Deployment unter `https://app.microlearn.example`. Alle Funktionen
laufen über HTTPS gegen unsere eigene Next.js-API; es gibt keine
Drittanbieter-Tracker.

## Account-Erstellung

- Email/Passwort, Google, GitHub und Apple-Sign-in werden unterstützt
- Schulen können Schüler:innen über einen **Klassen-Code** anmelden — diese
  Accounts speichern **keine personenbezogenen Daten** (kein Name, keine
  E-Mail, kein Geburtsdatum). Dieser Pfad existiert für minderjährige
  Schüler:innen und ist DSGVO-konform.

## Bezahlung

- **In-App-Käufe** sind in v1 **nicht** aktiv. Pro/Institution-Abos werden
  ausschließlich über Stripe-Checkout im WebView abgewickelt — also
  außerhalb der App-Store-Bezahlmechanik. Apple verlangt IAP nur für
  digitale Güter, die *in der App selbst* konsumiert werden; unsere
  Subscription wird über die Web-Pricing-Seite abgeschlossen.
- Wir folgen dem **Reader-App-Modell**: die App stellt zuvor erworbene
  Inhalte dar, eröffnet aber keinen Bezahlflow in-App. Im Pricing-Bildschirm
  steht ein Link „Online verwalten", der Safari öffnet.

## Push-Benachrichtigungen

- Wir nutzen **APNs via Capacitor** ausschließlich für *transaktionale*
  Mitteilungen (Streak-Erinnerung, neue Aufgabe von Lehrkraft, Antwort
  auf Kommentar). Kein Marketing-Push.

## Daten-Sammlung

Siehe `ios-privacy-manifest.md`. Wir tracken nicht über Drittanbieter,
ATT-Prompt ist daher nicht nötig.

## Bekannte Tester-Fragen

| Frage | Antwort |
|---|---|
| Warum kein IAP? | Reader-App-Modell, Abos werden außerhalb der App erworben (Stripe-Web-Checkout). |
| Wo ist die Privacy Policy? | App-Einstellungen → Rechtliches → Datenschutz, auch verlinkt im Sign-Up. |
| Wie testet ihr die Schüler:innen-Sicht? | Demo-Account abmelden, „Mit Schüler-Code anmelden" → `DEMO-2026`. |
| Was tun bei Crash? | Sentry-Crash-Reports gehen an `crash@microlearn.example`, Kontakt-Mail steht in der App. |

## Kontakt
- **Submission-Owner:** Andreas Habedank · habedank@az-delivery.com
- **Antwortzeit:** ≤ 24 h werktags
