# Lesson-Fakten-Audit 2026-05-16

Model: `claude-sonnet-4-6` · Lessons: 6

**Total findings:** 24 (8 critical / 10 major / 6 minor)

## CRITICAL (8)

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** Step 4 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Schritt 4 beschreibt in Punkt 4, dass der Widerstand zwischen GPIO 2 und der LED-Anode liegt, aber Schritt 5 wiederholt dieselbe Beschreibung als separate Anweisung — dadurch wird die LED-Schaltung doppelt beschrieben, was verwirrend ist, aber kein echter Widerspruch. Kritischer: In Schritt 3 wird der Taster in Spalten 10 und 12 gesteckt, aber ein Standard-6-mm-Mikroschalter hat seine Beinchen im Abstand von 2 Spalten (2×0,1" = 5,08 mm), was bedeutet, dass die Beinchen in Spalten 10 und 12 korrekt wären — jedoch überbrückt ein solcher Taster typischerweise die Mittenlücke des Steckbretts (Spalten e/f), wenn er quer eingesteckt wird. Die Beschreibung 'Reihe e + f, Spalte 10' und 'Reihe e + f, Spalte 12' ist für einen Standard-6-mm-Taster korrekt.
- **Fix:** Kein Handlungsbedarf für den Taster-Einbau — Beschreibung ist korrekt für einen Standard-6-mm-Mikroschalter.

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** Step 4 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** In Schritt 4, Punkt 4 steht: 'LED-Anode (langes Bein) → 220-Ω-Widerstand → GPIO 2', was impliziert, dass der Widerstand zwischen Anode und GPIO liegt. In Schritt 5 steht dagegen: 'Widerstand von GPIO 2 zur LED-Anode' — die Reihenfolge ist umgekehrt. Beide Beschreibungen meinen dieselbe Schaltung, aber die widersprüchliche Reihenfolge kann Lernende verwirren, welches Ende des Widerstands wohin gehört.
- **Fix:** In beiden Schritten einheitlich formulieren: 'GPIO 2 → Widerstand (220 Ω) → LED-Anode (langes Bein)', um Konsistenz zu gewährleisten.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** GPIO 25 und GPIO 26 sind am ESP32 mit dem integrierten DAC verbunden und gelten als Strapping-unkritisch, aber GPIO 25 ist auf vielen ESP32 DevKit V1-Boards tatsächlich problemlos — das eigentliche Problem ist GPIO 26, das ebenfalls DAC-Pin ist, was aber kein Fehler ist. Das wirkliche Problem: Der Text behauptet, die gewählten Pins seien 'kein Strapping, kein UART', aber GPIO 14 ist ein Strapping-Pin (MTMS/HSPI_CLK) und beeinflusst den Boot-Modus des ESP32, was beim Reset zu unerwartetem Verhalten führen kann.
- **Fix:** GPIO 14 durch einen tatsächlich strapping-unkritischen Pin ersetzen, z. B. GPIO 18 oder GPIO 19, und die Begründung im Text entsprechend korrigieren.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der Spannungsteiler ist falsch dimensioniert: 1 kΩ (Echo → Mitte) und 2 kΩ (Mitte → GND) ergibt Vmitte = 5 V × 2/(1+2) = 3,33 V, was korrekt klingt, aber die Widerstandsbezeichnung ist vertauscht — der obere Widerstand (zwischen Echo-Ausgang und Mittelabgriff) sollte der größere sein, damit der Strom begrenzt wird. Tatsächlich ist die Formel hier: Vmitte = 5 V × R_unten / (R_oben + R_unten) = 5 × 2/(1+2) = 3,33 V. Die Werte sind also rechnerisch korrekt (1 kΩ oben, 2 kΩ unten → 3,33 V), jedoch ist die BOM-Beschreibung irreführend: sie nennt den 1 kΩ 'Obere Hälfte' und den 2 kΩ 'Untere Hälfte', was mit der Schaltung übereinstimmt. Kein echter Fehler hier.
- **Fix:** Kein Handlungsbedarf, die Werte und Beschreibungen sind konsistent.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Im BUILD-Schritt wird beschrieben, dass für den Spannungsteiler ein 1 kΩ- und ein 2 kΩ-Widerstand benötigt werden, die BOM listet diese auch auf. Der Code und die Pinbelegung (Trig GPIO 5, Echo GPIO 18) stimmen überein — kein Widerspruch.
- **Fix:** Kein Handlungsbedarf.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die BOM listet nur 4 Jumper-Kabel (M/M), aber für die Verbindung ESP32 ↔ HC-SR04 (VCC, GND, Trig, Echo) werden mindestens 4 Kabel benötigt, plus 2 weitere für den Spannungsteiler-Aufbau auf dem Steckbrett (Echo-Ausgang zum Teiler, Mittelabgriff zu GPIO 18) — insgesamt mindestens 6 Kabel. Mit nur 4 Kabeln kann der empfohlene Spannungsteiler nicht vollständig verdrahtet werden.
- **Fix:** Die BOM sollte mindestens 6 Jumper-Kabel (M/M) auflisten, um den Spannungsteiler korrekt zu verdrahten.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** map() in Arduino gibt einen long-Wert zurück und erwartet long-Parameter; der Cast '(long)minDist' schneidet Dezimalstellen ab, aber schwerwiegender: wenn minDist den Wert 999.0 (kein Echo) hat, liefert map() einen Wert weit außerhalb von 50–500 ms. constrain() fängt das zwar ab, aber der eigentliche Fehler ist, dass minDist vor dem map()-Aufruf nicht auf einen sinnvollen Bereich geprüft wird — bei 999 cm zeigt der Roboter Verhalten, das im Unterricht nicht erklärt wird.
- **Fix:** Vor dem map()-Aufruf minDist auf den Bereich 5–100 cm begrenzen, z. B. mit 'minDist = constrain(minDist, 5, 100);', damit map() immer sinnvolle Eingaben erhält.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die Formel zur Abstandsberechnung lautet 'duration * 0.0343 / 2.0', wobei duration in Mikrosekunden vorliegt; 0.0343 cm/µs ist korrekt (Schallgeschwindigkeit ≈ 343 m/s = 0,0343 cm/µs), aber das Ergebnis ist richtig — kein Fehler hier. Jedoch: pulseIn() gibt einen 'long' zurück, der mit einem float multipliziert wird; das ist in Arduino korrekt implizit gecastet. Kein echter Bug.
- **Fix:** Kein Fix nötig — diese Zeile ist korrekt.

## MAJOR (10)

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Die Verkabelungsanleitung beschreibt, dass der Widerstand zwischen GPIO 2 und der LED-Anode liegt (Punkt 4: 'LED-Anode → 220-Ω-Widerstand → GPIO 2'), was bedeutet, dass der Widerstand auf der Anodenseite sitzt — das ist korrekt. Jedoch ist die Reihenfolge in der Beschreibung umgekehrt: zuerst wird die Anode genannt, dann der Widerstand, dann GPIO 2, was suggeriert, dass der Strom von der Anode zum GPIO fließt, statt von GPIO 2 über den Widerstand zur Anode.
- **Fix:** Formulierung ändern zu: 'GPIO 2 → 220-Ω-Widerstand → LED-Anode (langes Bein)', um die korrekte Stromflussrichtung vom Ausgang zur LED darzustellen.

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** Step 0 [INTRO]
- **Category:** term-order
- **Problem:** Der Begriff 'Pull-Up' wird im EXPLAIN-Schritt (Step 2) eingeführt, aber im INTRO (Step 0) noch nicht verwendet — das ist korrekt. Jedoch wird 'INPUT_PULLUP' im CODE_WALK (Step 6) und im QUIZ (Step 7) verwendet, ohne dass der Begriff 'Pull-Up' im EXPLAIN-Schritt (Step 2) formal als Fachbegriff eingeführt wird; er erscheint nur im keyPoint-Payload, nicht im sichtbaren Fließtext des Schritts.
- **Fix:** Den Begriff 'Pull-Up' explizit im sichtbaren Text von Step 2 einführen und erklären, bevor er im Code-Walk und Quiz verwendet wird.

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 3 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Kommentar in der Konstanten-Erklärung (Zeilen 2–5) erwähnt 'welcher PWM-Kanal', obwohl im neuen ESP32-Arduino-Core v3+ mit ledcAttach() kein separater Kanal mehr angegeben wird — die Variable PWM_CHAN existiert im Code gar nicht.
- **Fix:** Den Kommentar in explain_de anpassen: 'Konstanten: welcher Pin, Pulsrate und Auflösung. 8 Bit = 256 Helligkeitsstufen.' — den Hinweis auf 'PWM-Kanal' streichen.

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 3 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Setup-Kommentar in explain_de lautet 'PWM-Kanal konfigurieren und an unseren Pin koppeln', aber ledcAttach(pin, freq, res) in Core v3+ kombiniert beides in einem Schritt ohne expliziten Kanal — die Beschreibung 'Kanal konfigurieren' ist irreführend falsch.
- **Fix:** explain_de für Zeilen 7–10 ändern zu: 'Setup: PWM direkt für den Pin konfigurieren — Frequenz und Auflösung in einem Aufruf. Danach kann der ESP32 das selbständig.'

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Arduino Stepper-Library verwendet für den 28BYJ-48 eine Full-Step-Sequenz mit 4 Schritten pro Zyklus, was 32 Schritte pro Motorwellen-Umdrehung ergibt. Das interne Getriebe des 28BYJ-48 hat jedoch eine Übersetzung von ca. 63,68:1 (nicht exakt 64:1), was zu ca. 2037,9 Schritten pro Ausgangswellen-Umdrehung führt — nicht exakt 2048. Der Wert 2048 ist eine Näherung, die als exakt dargestellt wird.
- **Fix:** Den Wert 2048 als Näherungswert kennzeichnen (z. B. '≈ 2048') und darauf hinweisen, dass die tatsächliche Schrittanzahl je nach Motorexemplar leicht abweichen kann.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Der Text beschreibt die Verkabelung als 'natürlich der Reihe nach' (IN1→14, IN2→25, IN3→26, IN4→27), erklärt aber am Ende desselben Schritts, dass der Library-Konstruktor die Pins in der Reihenfolge IN1, IN3, IN2, IN4 übergeben werden — das widerspricht der intuitiven 'der Reihe nach'-Aussage und kann Lernende verwirren, die die physische Reihenfolge mit der Code-Reihenfolge gleichsetzen.
- **Fix:** Die Formulierung 'natürlich der Reihe nach' entfernen oder klarstellen, dass die physische Verkabelung sequenziell ist, der Konstruktor-Aufruf im Code aber bewusst eine andere Reihenfolge (IN1, IN3, IN2, IN4) verwendet.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Schallgeschwindigkeit wird als 0,0343 cm/µs angegeben, was korrekt ist (343 m/s = 0,0343 cm/µs). Allerdings gilt dieser Wert nur bei ca. 20 °C; für Schüler könnte der Eindruck entstehen, es sei ein fixer Wert — das ist aber ein Nebenaspekt und kein echter Fehler.
- **Fix:** Kein Handlungsbedarf, da der Wert für den Unterrichtskontext ausreichend genau ist.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 1 [PARTS]
- **Category:** factual-other
- **Problem:** Der HC-SR04 wird mit einem Messbereich von 2 cm bis ca. 400 cm angegeben, der tatsächliche Messbereich laut Datenblatt beträgt jedoch 2 cm bis 400 cm (4 m), was korrekt ist. Kein Fehler.
- **Fix:** Kein Handlungsbedarf.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** loop() führt nach dem Sweep nur einen einzigen blinkLED()-Aufruf durch (LED blinkt genau einmal), bevor der nächste Sweep beginnt — die LED blinkt also nicht kontinuierlich mit dem berechneten Tempo, sondern nur einmal pro vollständigem 180°-Sweep (~1–2 Sekunden). Das widerspricht der Beschreibung in Step 5 ('Die LED blinkt danach schnell … oder langsam').
- **Fix:** Nach dem Sweep eine kurze Schleife einfügen, die blinkLED(blinkDelay) z. B. 5-mal aufruft, damit das Blink-Verhalten für den Lernenden sichtbar und erfahrbar ist.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** safety
- **Problem:** Step 3 erwähnt als Option, den 5-V-Echo-Pin des HC-SR04 direkt mit dem ESP32-GPIO (3,3-V-tolerant) zu verbinden und bezeichnet dies nur als 'Risiko für den Pin auf Dauer' — tatsächlich kann dauerhaft anliegende 5 V den GPIO-Pin des ESP32 beschädigen oder zerstören, was für Schüler ein reales Hardwarerisiko darstellt.
- **Fix:** Den Spannungsteiler (1 kΩ / 2 kΩ) als einzig empfohlene Lösung darstellen und die Direktverbindung nicht als akzeptable Testoption anbieten.

## MINOR (6)

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste enthält 5 Jumper-Kabel, aber die Schaltung benötigt mindestens 4 Kabel (GPIO 4 → Taster, Taster → GND-Schiene, GPIO 2 → Widerstand/LED, LED-Kathode → GND-Schiene, GND-Schiene → ESP32-GND), also mindestens 5 Verbindungen — wobei der Widerstand direkt auf dem Steckbrett steckt und kein eigenes Kabel benötigt. Die Anzahl 5 ist plausibel, aber knapp.
- **Fix:** Jumper-Kabel-Anzahl auf 6 erhöhen, um sicherzustellen, dass Schüler genug Kabel für alle Verbindungen inklusive Reservekabel haben.

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der Text sagt 'hunderte Male pro Sekunde', aber die im Code verwendete PWM-Frequenz beträgt 5000 Hz, also 5000-mal pro Sekunde — 'hunderte' ist stark untertrieben.
- **Fix:** Den Text anpassen zu 'tausende Male pro Sekunde (hier: 5000-mal!)' um mit dem tatsächlichen Code-Wert übereinzustimmen.

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der keyPoint behauptet 'fast JEDER GPIO kann PWM', was beim ESP32 korrekt ist, aber GPIO 2 ist gleichzeitig die eingebaute LED und ein Strapping-Pin — das kann auf manchen DevKit-Varianten zu unerwartetem Verhalten beim Flashen führen.
- **Fix:** Einen kurzen Hinweis ergänzen: 'GPIO 2 ist auf den meisten DevKits die eingebaute LED — beim Hochladen kann sie kurz aufleuchten, das ist normal.'

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste enthält ein Steckbrett MB-102, das im Aufbau jedoch nicht verwendet wird — der Motorstecker wird direkt auf die ULN2003-Platine gesteckt und die Jumper-Kabel verbinden ULN2003 direkt mit dem ESP32.
- **Fix:** Das Steckbrett MB-102 aus der Stückliste entfernen oder im BUILD-Schritt erklären, wofür es konkret eingesetzt wird.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** pulseIn() hat ohne Timeout-Parameter einen Standard-Timeout von 1 Sekunde; bei fehlendem Echo (z. B. kein Objekt in Reichweite) blockiert die Funktion bis zu 1 Sekunde und gibt 0 zurück, was zu einem Abstandswert von 0,0 cm führt — ohne Fehlerbehandlung oder Hinweis für den Schüler.
- **Fix:** Einen Timeout-Parameter zu pulseIn() hinzufügen (z. B. pulseIn(ECHO_PIN, HIGH, 30000)) und den Rückgabewert 0 als 'kein Echo' behandeln und ausgeben.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Step 3 beschreibt den Servo-Signalanschluss an GPIO 13 und den Code verwendet ebenfalls SERVO_PIN 13 — das stimmt überein. Jedoch wird GPIO 13 beim ESP32 DevKit V1 beim Booten als Strobe/Bootstrap-Pin genutzt und kann beim Start kurze Impulse ausgeben, die den Servo zucken lassen.
- **Fix:** Einen unproblematischeren GPIO wie GPIO 14 oder GPIO 27 für den Servo verwenden und SERVO_PIN im Code entsprechend anpassen.

---

## Per-Lesson Übersicht

- `esp32-button-led` — Taster: LED auf Knopfdruck: 2 major · 2 critical · 1 minor
- `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen: 2 major · 2 minor
- `esp32-buzzer-melodie` — Buzzer: dein erstes Lied: clean
- `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel: 1 critical · 2 major · 1 minor
- `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus: 2 major · 3 critical · 1 minor
- `esp32-mini-roboter` — Mini-Roboter: alles zusammen: 2 critical · 2 major · 1 minor