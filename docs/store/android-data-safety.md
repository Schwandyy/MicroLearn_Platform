# Play „Data Safety"-Formular

Antworten für das Formular unter
Play Console → App-Inhalt → **Datensicherheit**.

## Sammelt deine App Nutzerdaten oder gibt sie weiter?
**Ja** — siehe unten.

## Sicherheits-Praktiken
- [x] Daten werden bei der Übertragung verschlüsselt (HTTPS)
- [x] Nutzer können beantragen, dass ihre Daten gelöscht werden
- [x] Code geprüft auf bekannte Sicherheitslücken (Snyk + GitHub Code Scanning)
- [ ] Verpflichtung zur „Family Policy" — wir nutzen Schüler-Code-Logins für
      Minderjährige; ein vollständiger Family-Programs-Opt-in folgt nach
      Marktstart.

## Datenklassen

### Persönliche Daten

| Datentyp | Erhoben | Optional | Geteilt | Verschlüsselt im Transit | Verwendungszweck |
|---|---|---|---|---|---|
| Name | ja | ja | nein | ja | App-Funktion, Konto-Verwaltung |
| E-Mail-Adresse | ja | nein (außer Schüler-Code-Login) | nein | ja | App-Funktion, Konto-Verwaltung |
| User-IDs | ja | nein | nein | ja | App-Funktion, Analyse (eigene) |

### Finanzielle Daten

| Datentyp | Erhoben | Geteilt | Hinweis |
|---|---|---|---|
| Zahlungsinformationen | nein (in der App) | n/a | Stripe übernimmt Bezahlung außerhalb der App (Web-Checkout) |

### Nutzergenerierter Inhalt

| Datentyp | Erhoben | Geteilt | Verschlüsselt im Transit | Zweck |
|---|---|---|---|---|
| Fotos & Videos | ja (Community-Projekte) | nein | ja | App-Funktion |
| Textnachrichten | ja (Kommentare) | nein | ja | App-Funktion |

### App-Aktivität

| Datentyp | Erhoben | Geteilt | Zweck |
|---|---|---|---|
| App-Interaktionen | ja | nein | App-Funktion, Analyse (eigene) |
| In-App-Suchverlauf | ja | nein | App-Funktion |

### App-Info & Performance

| Datentyp | Erhoben | Geteilt | Zweck |
|---|---|---|---|
| Crash-Logs | ja | nein | Analyse (Diagnose) |
| Diagnoseinformationen | ja | nein | Analyse (Diagnose) |

### Geräte- oder andere IDs

| Datentyp | Erhoben | Geteilt | Zweck |
|---|---|---|---|
| Geräte- / andere IDs | ja (Web-Push-Subscription) | nein | App-Funktion (Push) |

## Daten zur Familienrichtlinie (Kinder unter 13)

Wir sammeln **keine** personenbezogenen Daten von Nutzer:innen, die sich
per Schüler-Code (Klassen-Login) anmelden:
- Kein Name (nur selbstgewählter Username)
- Keine E-Mail
- Kein Geburtsdatum
- Kein Standort

Erwachsene Lehrkräfte und Eltern können Schüler-Accounts jederzeit
deaktivieren.

## Löschung beantragen

Innerhalb der App: Einstellungen → Konto → „Konto löschen" — löscht
alle PII und gibt das DSGVO-Export-PDF im selben Schritt heraus.
Bestätigung dauert ≤ 24 h.
