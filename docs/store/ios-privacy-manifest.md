# iOS Privacy Manifest (`PrivacyInfo.xcprivacy`)

Pflicht ab iOS 17 für Apps, die nach App Store Connect hochgeladen werden.
Diese Werte gelten für **MicroLearn als WebView auf die produktive
Next.js-Deployment**. Wenn wir später native Datennutzung dazubauen, muss
das hier aktualisiert werden.

## Datei anlegen
Xcode → File → New → File from Template → Resource → **App Privacy**.
Speichert sich als `ios/App/App/PrivacyInfo.xcprivacy`.

## `NSPrivacyTracking`
**false** — wir verfolgen keine Nutzer:innen über Apps/Webseiten Dritter
hinweg. (Falls später Meta/Google Ads-SDKs dazukommen, hier umstellen.)

## `NSPrivacyTrackingDomains`
**leer**.

## `NSPrivacyCollectedDataTypes`

Diese Datenklassen sammeln wir und müssen sie deklarieren:

| `NSPrivacyCollectedDataType` | `Linked` | `Tracking` | `Purposes` |
|---|---|---|---|
| `NSPrivacyCollectedDataTypeEmailAddress` | true | false | `Authentication`, `AppFunctionality` |
| `NSPrivacyCollectedDataTypeName` | true | false | `Authentication`, `AppFunctionality` |
| `NSPrivacyCollectedDataTypeUserID` | true | false | `Authentication`, `Analytics` |
| `NSPrivacyCollectedDataTypeOtherDiagnosticData` | false | false | `AppFunctionality`, `Analytics` |
| `NSPrivacyCollectedDataTypePaymentInfo` | true | false | `AppFunctionality` |
| `NSPrivacyCollectedDataTypeOtherUserContent` | true | false | `AppFunctionality` |

Hinweise:
- **`PaymentInfo`** weil Stripe-Checkout aus der App heraus geöffnet wird.
  Wir speichern keine Karten — Stripe ist Verantwortlicher.
- **`OtherUserContent`** = Community-Projekte + Kommentare.
- **`OtherDiagnosticData`** = Server-Logs / Sentry (falls aktiv).
- **Schüler-Code-Accounts** sammeln **kein** PII — separat dokumentiert in
  der Datenschutzerklärung (`/de/legal/datenschutz`).

## `NSPrivacyAccessedAPITypes`

Reasons (mind. einer pro genutzter API):

| API | Reason |
|---|---|
| `NSPrivacyAccessedAPICategoryUserDefaults` | `CA92.1` (Persistieren von App-Daten innerhalb des Containers) |
| `NSPrivacyAccessedAPICategoryFileTimestamp` | `C617.1` (App-eigene Dateien lesen/schreiben) |
| `NSPrivacyAccessedAPICategorySystemBootTime` | `35F9.1` (Performance-Messung) |

Capacitor selbst nutzt diese APIs intern; ohne Deklaration lehnt Apple den
Upload ab.

## Sentinel-Wert
`NSPrivacyTracking = NO` bedeutet ausdrücklich: **kein App-Tracking-Dialog**
(ATT) nötig. Falls wir Werbung oder Marketing-SDKs hinzunehmen, müssen wir
ATT-Prompt + Tracking-Reasons ergänzen.
