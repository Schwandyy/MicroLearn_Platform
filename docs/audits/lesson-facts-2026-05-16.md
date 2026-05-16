# Lesson-Fakten-Audit 2026-05-16

Model: `claude-sonnet-4-6` · Lessons: 25

**Total findings:** 76 (14 critical / 33 major / 29 minor)

## CRITICAL (14)

### `esp32-blink-led` — Eine LED zum Blinken bringen
- **Where:** Step 6 [BUILD]
- **Category:** pin-wiring
- **Problem:** Das kurze LED-Beinchen (Kathode) wird in Reihe a, Spalte 9 gesteckt, aber das lange Beinchen (Anode) ebenfalls in Reihe c, Spalte 7 — damit liegen Anode und Kathode in verschiedenen Spalten (7 und 9), was korrekt ist. Jedoch wird in Schritt 7 Kabel A ebenfalls in Reihe a, Spalte 9 gesteckt, während das lange Beinchen in Reihe c, Spalte 7 sitzt. Das bedeutet, Anode und Kathode sind zwei Spalten voneinander entfernt (Spalte 7 und Spalte 9), ohne dass eine Verbindung zwischen ihnen beschrieben wird — die LED hat also keinen geschlossenen Pfad durch sich selbst, weil das lange Beinchen in c7 und das kurze in a9 stecken, aber c7 und a9 sind auf einem Standard-Steckbrett NICHT in derselben Spalte verbunden. Das ist inkonsistent: Auf einem 5-Loch-Steckbrett (Reihen a–e) sind a7, b7, c7, d7, e7 verbunden — a9 ist eine andere Spalte. Die LED überspannt also zwei Spalten (7 und 9), was bedeutet, dass zwischen Widerstand (rechtes Bein in c7) und LED-Anode (c7) eine Verbindung besteht, aber die Kathode (a9) zwei Spalten weiter liegt. Das ist physikalisch möglich, aber Schritt 7 beschreibt Kabel A als von a9 zur Minus-Schiene — das ist korrekt. Das eigentliche Problem: Das lange LED-Beinchen (Anode) in c7 und das kurze (Kathode) in a9 bedeutet, die LED überbrückt Spalte 7 zu Spalte 9, was bei einer Standard-5mm-LED mit ~2,54 mm Rasterabstand nicht möglich ist — der Abstand beträgt 2 Spalten (5,08 mm), was dem typischen LED-Beinabstand entspricht und funktioniert. Kein Fehler hier. Stattdessen: In Schritt 5 wird das grüne Kabel von GPIO 2 mit Spalte 4 (linkes Widerstandsbeinchen) verbunden, das rechte Beinchen in Spalte 7. In Schritt 6 kommt die LED-Anode in c7 (gleiche Spalte wie rechtes Widerstandsbeinchen — korrekt verbunden). Die Kathode kommt in a9. In Schritt 7 geht Kabel A von a9 zur Minus-Schiene. Das ist elektrisch korrekt. Kein Fehler in der Verdrahtung.
- **Fix:** Kein Fehler — dieser Befund wird zurückgezogen.

### `esp32-blink-led` — Eine LED zum Blinken bringen
- **Where:** Step 5 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** In Schritt 5 wird beschrieben, dass das grüne Kabel GPIO 2 mit dem linken Widerstandsbeinchen in Spalte 4 verbindet, aber in Schritt 3 wird GPIO 2 als der zu verwendende Pin genannt und im Code (Schritt 10) wird LED_PIN = 2 verwendet — das ist konsistent. Kein Fehler.
- **Fix:** Kein Fehler — dieser Befund wird zurückgezogen.

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Die blaue Minus-Schiene (GND) wird im Verkabelungsschritt benutzt, aber es gibt kein Kabel, das die Minus-Schiene mit einem GND-Pin des ESP32 verbindet — ohne diese Verbindung ist der Stromkreis offen und der Taster funktioniert nicht.
- **Fix:** Einen zusätzlichen Schritt oder Hinweis ergänzen: ein Jumper-Kabel vom GND-Pin des ESP32 zur blauen Minus-Schiene des Steckbretts legen.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Melodie 'Alle meine Entchen' beginnt mit C4–D4–E4–F4–G4–G4–A4–A4, was den Frequenzen 262–294–330–349–392–392–440–440 Hz entspricht — das ist korrekt. Jedoch wird im Code-Walk (Step 4) in der englischen Erklärung fälschlicherweise 'Twinkle Twinkle' als Liedname genannt, obwohl die Lesson durchgehend 'Alle meine Entchen' meint.
- **Fix:** In der Code-Zeilen-Erklärung (lines, explain_en) 'Twinkle Twinkle' durch 'Alle meine Entchen' ersetzen.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Behauptung, die Standard-Arduino-Stepper-Library steuere den 28BYJ-48 im Half-Step-Modus mit 2048 Schritten pro Umdrehung an, ist falsch. Die Arduino Stepper-Library verwendet ausschließlich Full-Step (4-Schritt-Sequenz), keinen Half-Step. Die 2048-Schritte-Zahl stammt aus dem Getriebe-Übersetzungsverhältnis (~1:64) des 28BYJ-48 und gilt für Full-Step-Betrieb mit dieser Library.
- **Fix:** Den Satz korrigieren: Die Standard-Stepper-Library nutzt Full-Step-Ansteuerung; die 2048 Schritte pro Umdrehung ergeben sich aus dem internen Getriebe (ca. 64:1), nicht aus Half-Stepping. Den Klammersatz über '1024 Schritte im Full-Step' entfernen, da er auf dieser falschen Prämisse beruht.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** bom-mismatch
- **Problem:** Der Spannungsteiler am Echo-Pin benötigt einen 1-kΩ- und einen 2-kΩ-Widerstand, beide fehlen jedoch vollständig in der Stückliste (BOM).
- **Fix:** BOM um '1× Widerstand 1 kΩ' und '1× Widerstand 2 kΩ' ergänzen; außerdem sind für den Spannungsteiler zwei zusätzliche Jumper-Kabel nötig, sodass die Jumper-Anzahl auf mindestens 6 erhöht werden sollte.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Aufruf 'digitalWrite(LED_PIN, motion)' übergibt einen int-Wert (Rückgabe von digitalRead), was in Arduino/ESP32 zwar funktioniert, aber 'motion' ist als 'int' deklariert und wird direkt an digitalWrite übergeben — das ist technisch korrekt und kein Bug.
- **Fix:** Kein Handlungsbedarf — dieser Befund wird zurückgezogen.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 0 [INTRO]
- **Category:** schematic-mismatch
- **Problem:** Die Lesson-Beschreibung (Intro, Summary, Step 5, Step 7) beschreibt einen Servo-Sweep mit LED-Blinken als Roboter-Radar-Auge, aber der tatsächliche Code in Step 4 steuert einen DC-Motor per PWM und enthält weder Servo-Code noch LED-Code.
- **Fix:** Entweder den Code durch den angekündigten Servo+LED-Code ersetzen, oder die Beschreibung an den tatsächlichen DC-Motor-Code anpassen.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste enthält einen Servo SG90 und eine rote LED, aber der Code in Step 4 verwendet weder einen Servo noch eine LED — stattdessen wird ein DC-Motor per MOSFET angesteuert, der weder in der BOM noch im Code-Kommentar als Bauteil aufgeführt ist.
- **Fix:** BOM um MOSFET (z. B. IRLZ44N), 1N4007-Freilaufdiode, 100-Ω-Gate-Widerstand und DC-Motor ergänzen, oder Code und Verkabelung auf Servo + LED umstellen.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** bom-mismatch
- **Problem:** Step 3 beschreibt eine MOSFET-Schaltung mit Gate-Vorwiderstand (100 Ω), 1N4007-Freilaufdiode und externer 6-V-Batterie für einen DC-Motor, aber keines dieser Bauteile (MOSFET, Diode, Batterie, Gate-Widerstand) ist in der BOM aufgeführt.
- **Fix:** MOSFET, 1N4007, 100-Ω-Widerstand und 6-V-Batteriehalter in die BOM aufnehmen.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Step 3 beschreibt die Verkabelung eines Servo (5 V, Signalpin nicht angegeben) und eines DC-Motors (GPIO 25), aber der Code in Step 4 enthält keinen Servo-Code — der Servo-Pin wird im Code nie verwendet.
- **Fix:** Den Servo-Signalpin im Code definieren und die ESP32Servo-Bibliothek tatsächlich im Code einsetzen, oder die Verkabelungsbeschreibung auf die im Code verwendeten Bauteile beschränken.

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** GPIO 34 des ESP32 DevKit V1 ist ein reiner Input-Only-Pin ohne internen ADC-fähigen Pull-Up, aber er gehört zu ADC1 — das ist korrekt. Allerdings liegt GPIO 34 am ADC1-Kanal 6 und ist tatsächlich für analogRead() geeignet. Kein Fehler hier.
- **Fix:** Kein Handlungsbedarf — dieser Befund wird zurückgezogen.

### `esp32-mqtt-publish` — MQTT: Daten in die Welt senden
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Code in Step 4 ist abgeschnitten: Die loop()-Funktion bricht mitten im Wort 'reconn' ab — der vollständige Aufruf 'reconnectMQTT()', der mqttClient.loop()-Aufruf sowie die Publish-Logik fehlen komplett. Der Sketch ist nicht kompilierbar.
- **Fix:** Den vollständigen Code einfügen, insbesondere die loop()-Funktion mit reconnectMQTT(), mqttClient.loop(), dem Intervall-Check (millis() - lastPublish >= 1000) und dem mqttClient.publish()-Aufruf.

### `esp32-webserver` — Webserver: dein ESP32 als Webseite
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Code-Block ist abgeschnitten: `WiFi.begin(ssid, p` ist unvollständig — setup(), loop() und die server.on()-Handler fehlen komplett. Der Code lässt sich so nicht kompilieren.
- **Fix:** Den vollständigen Code einfügen, inklusive `WiFi.begin(ssid, password)`, der WiFi-Verbindungsschleife, `server.on("/", handleRoot)`, `server.on("/on", handleOn)`, `server.on("/off", handleOff)`, `server.begin()` in setup() sowie `server.handleClient()` in loop().

## MAJOR (33)

### `esp32-blink-led` — Eine LED zum Blinken bringen
- **Where:** Step 7 [BUILD]
- **Category:** bom-mismatch
- **Problem:** In Schritt 7 werden zwei GND-Kabel benötigt (Kabel A: LED-Kathode zur Minus-Schiene; Kabel B: ESP32-GND zur Minus-Schiene), plus das Signal-Kabel aus Schritt 5 — das ergibt mindestens 3 Jumper-Kabel. Die Stückliste listet genau 3× Jumper-Kabel (M/M), was passt. Kein Fehler.
- **Fix:** Kein Fehler — dieser Befund wird zurückgezogen.

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste enthält nur 4 Jumper-Kabel, aber die Schaltung benötigt mindestens 5: GPIO 4 → Taster, Taster → GND-Schiene, ESP32-GND → GND-Schiene, GPIO 2 → Widerstand, LED-Kathode → GND-Schiene.
- **Fix:** Die Stückliste auf mindestens 5× Jumper-Kabel (M/M) erhöhen.

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 3 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die Funktionen `ledcSetup()` und `ledcAttachPin()` existieren in der Arduino-ESP32-Bibliothek ab Version 3.x nicht mehr; dort wird stattdessen `ledcAttach(pin, freq, resolution)` verwendet. Auf aktuellen ESP32-Arduino-Cores kompiliert der Code nicht.
- **Fix:** Entweder den Code auf `ledcAttach(LED_PIN, FREQ, RES_BITS)` und `ledcWrite(LED_PIN, v)` umstellen (Core ≥ 3.x) oder explizit darauf hinweisen, dass Core 2.x benötigt wird.

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Analogie 'wie bei Wasserfarben' ist sachlich falsch: Wasserfarben funktionieren nach subtraktiver Farbmischung, nicht nach additiver. RGB-LEDs nutzen additive Farbmischung, die dem Prinzip von Lichtquellen (z. B. Monitoren) entspricht.
- **Fix:** Analogie ersetzen, z. B. 'wie bei einem Fernseher oder Beamer, der Licht mischt' statt 'wie bei Wasserfarben'.

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Bei einer Common-Cathode-RGB-LED ist das längste Bein die gemeinsame Kathode (GND), aber es ist nicht das einzige besondere Bein — die Beschreibung 'das längste Bein (GND)' ist korrekt für Common-Cathode, jedoch wird im INTRO (Step 0) und PARTS (Step 1) korrekt 'Common-Cathode' genannt, während Step 3 das längste Bein als GND bezeichnet. Bei Standard-5mm-RGB-LEDs (Common Cathode) ist das längste Bein tatsächlich die Kathode, das ist korrekt. Kein Fehler hier — zurückgezogen.
- **Fix:** Kein Handlungsbedarf.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Das mittlere C (C4) hat eine Frequenz von 261,63 Hz, wird aber im Text als 262 Hz angegeben — das ist zwar gerundet akzeptabel, jedoch wird im Code ebenfalls 262 Hz verwendet, was korrekt ist. Allerdings wird C4 im Erklärungstext als 'mittleres C auf dem Klavier' bezeichnet und mit 262 Hz angegeben, was stimmt. Kein Fehler hier.
- **Fix:** Kein Fix nötig — 262 Hz ist eine übliche Rundung für C4.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** ledcSetup() wird mit einer initialen Frequenz von 1000 Hz aufgerufen, aber ledcWriteTone() setzt die Frequenz ohnehin selbst — der Initialwert 1000 ist irrelevant. Kritischer: ledcSetup() und ledcAttachPin() sind die alte ESP32 Arduino-API (vor Arduino-ESP32 v3.x); in neueren Versionen (v3+) sind diese Funktionen entfernt und durch ledcAttach() ersetzt, was bei vielen aktuellen Installationen zu einem Compile-Fehler führt.
- **Fix:** Einen Hinweis ergänzen, dass der Code für Arduino-ESP32 v2.x geschrieben ist, oder auf die neue API (ledcAttach / ledcWriteTone mit Pin-Argument) umstellen.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 6 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Die Frage fragt, was passiert wenn 262 Hz durch 523 Hz ersetzt wird. 523 Hz ist C5, also eine Oktave höher als C4 (262 Hz). Die Luft schwingt dabei doppelt so schnell — Antwort b ist korrekt markiert. Das ist faktisch richtig. Kein Fehler.
- **Fix:** Kein Fix nötig.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** Step 5 [SIMULATE]
- **Category:** schematic-mismatch
- **Problem:** In Step 5 wird die Konstante 'SPEED_MS' erwähnt, die im Code nicht existiert — im Code heißt sie 'STEP_MS'.
- **Fix:** In Step 5 'SPEED_MS' durch 'STEP_MS' ersetzen, damit der Hinweis mit dem tatsächlichen Konstantennamen im Code übereinstimmt.

### `esp32-servo-sweep` — Servo: Bewegung steuern
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der SG90 hat standardmäßig braune, rote und orange Adern — die Lektion beschreibt dies korrekt — jedoch wird der 5V-Pin des ESP32 DevKit V1 als Versorgung für den Servo empfohlen, obwohl dieser Pin (VIN/VBUS) je nach Board-Variante nur über eine Schutzdiode mit begrenztem Strom verfügbar ist und der SG90 im Anlauf bis zu 500–700 mA ziehen kann, was den USB-Host oder den Regler überlasten kann. Dies wird zwar im Hinweis erwähnt, aber die primäre Verkabelungsanweisung nennt '5V am ESP32' als normale Option, was für Lernende irreführend ist.
- **Fix:** Die primäre Verkabelungsanweisung sollte den Servo direkt an einer externen 5V-Quelle (z.B. USB-Netzteil) mit gemeinsamem GND empfehlen und den ESP32-5V-Pin nur als Notlösung für sehr kurze Tests nennen.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Die Beschreibung nennt 'Motor-Minus an Drain' und 'Motor-Plus an + der externen Stromquelle', aber beim N-Kanal-MOSFET (IRLZ44N) fließt der Strom von Drain nach Source — der Motor muss zwischen der externen Plus-Versorgung und dem Drain liegen, und Source geht an GND. Das ist zwar korrekt beschrieben, aber die Freilaufdioden-Beschreibung sagt 'Anode an Motor-Minus', was korrekt ist — jedoch steht im BOM 'Anode an Drain', was dasselbe meint, aber inkonsistent formuliert ist. Kritischer Fehler: Im BOM steht 'Gate über kleinen Vorwiderstand (z.B. 100 Ω) an GPIO 25', aber im BUILD-Step und im Code wird kein Gate-Vorwiderstand erwähnt oder verwendet — das Bauteil fehlt im Aufbau.
- **Fix:** Einen 100-Ω-Gate-Vorwiderstand explizit in den BUILD-Step aufnehmen und als eigenes BOM-Bauteil (1× Widerstand 100 Ω) listen, damit Lernende ihn auch einbauen.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Der BOM nennt einen 100-Ω-Gate-Vorwiderstand als Teil der MOSFET-Beschreibung ('Gate über kleinen Vorwiderstand (z.B. 100 Ω) an GPIO 25'), listet ihn aber nicht als eigenständiges Bauteil, und der BUILD-Step erwähnt ihn überhaupt nicht — der Widerstand fehlt sowohl im Aufbau als auch als separater BOM-Eintrag.
- **Fix:** Einen eigenen BOM-Eintrag '1× Widerstand 100 Ω' hinzufügen und im BUILD-Step explizit beschreiben, dass dieser zwischen GPIO 25 und Gate des MOSFET einzubauen ist.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 3 [EXPLAIN]
- **Category:** pin-wiring
- **Problem:** Im EXPLAIN-Step wird der Stromfluss als 'von Drain durch den Motor zu Source' beschrieben, was impliziert, dass der Motor zwischen Drain und Source liegt. Tatsächlich liegt der Motor zwischen der externen Versorgungsspannung (Plus) und Drain, während Source an GND liegt — der Strom fließt von Plus durch den Motor, dann durch Drain→Source zum GND.
- **Fix:** Den Satz korrigieren zu: 'Strom fließt von der externen Quelle durch den Motor zu Drain, dann durch den MOSFET (Drain→Source) nach GND.'

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Im BUILD-Schritt werden die Pins in der Reihenfolge IN1→GPIO14, IN2→GPIO25, IN3→GPIO26, IN4→GPIO27 verkabelt, aber im Code wird der Stepper-Konstruktor mit der Reihenfolge IN1_PIN, IN3_PIN, IN2_PIN, IN4_PIN aufgerufen — d.h. GPIO14, GPIO26, GPIO25, GPIO27. Der Text erwähnt zwar den 'Quirk', aber die physische Verkabelungstabelle suggeriert eine 1:1-Zuordnung IN1=14, IN2=25, IN3=26, IN4=27, was korrekt ist. Der Widerspruch entsteht dadurch, dass der Text behauptet, die Library bekomme die Pins 'in der Reihenfolge IN1, IN3, IN2, IN4', was impliziert, dass IN3 (GPIO26) als zweites Argument übergeben wird — das stimmt mit der Verkabelung überein. Die Erklärung ist jedoch verwirrend und inkonsistent formuliert, sodass Lernende die falsche Schlussfolgerung ziehen könnten, IN2 und IN3 seien im Code vertauscht zu verkabeln.
- **Fix:** Den Hinweis im BUILD-Schritt präzisieren: Die physische Verkabelung bleibt IN1→14, IN2→25, IN3→26, IN4→27; im Stepper-Konstruktor werden die Pins jedoch in der für den 28BYJ-48 korrekten Spulenreihenfolge als (IN1, IN3, IN2, IN4) = (14, 26, 25, 27) übergeben — das ist ein reiner Software-Quirk, die Kabel bleiben unverändert.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der beschriebene Spannungsteiler (1 kΩ von Echo zur Mitte, 2 kΩ von Mitte nach GND) ergibt 5 V × 2/(1+2) = 3,33 V — das ist korrekt gerechnet, aber die Widerstandsrichtung ist in der Beschreibung vertauscht: der 2-kΩ-Widerstand muss zwischen Echo-Ausgang und Mittelabgriff liegen und der 1-kΩ-Widerstand zwischen Mittelabgriff und GND, damit 5 V × 1/(2+1) = 1,67 V entstehen würden. Tatsächlich liefert die im Text genannte Anordnung (1 kΩ oben, 2 kΩ unten) 3,33 V — das Ergebnis stimmt, aber die Bauteilbezeichnung 'Echo → Mittelabgriff = 1 kΩ' und 'Mittelabgriff → GND = 2 kΩ' ist korrekt für 3,33 V. Allerdings werden im Fließtext und im payload-Feld die Widerstände widersprüchlich beschrieben: im Fließtext steht '1 kΩ (Echo → Mittelabgriff) und 2 kΩ (Mittelabgriff → GND)', im payload steht ebenfalls '1 kΩ (Echo → Mitte) + 2 kΩ (Mitte → GND)' — das ist konsistent und rechnerisch richtig (3,33 V). Kein Fehler hier — dieser Befund wird zurückgezogen.
- **Fix:** Kein Fix erforderlich — Spannungsteiler ist korrekt beschrieben.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** safety
- **Problem:** Der Text behauptet, die meisten ESP32-Boards tolerierten kurze 5-V-Pulse am GPIO; tatsächlich sind ESP32-GPIOs laut Espressif-Datenblatt nicht 5-V-tolerant, und auch kurze 5-V-Pegel können den GPIO-Eingang dauerhaft beschädigen.
- **Fix:** Den relativierenden Satz 'Die meisten ESP32-Boards vertragen kurze 5-V-Pulse am GPIO' streichen und stattdessen klar formulieren, dass der Spannungsteiler (oder ein Pegelwandler) zwingend erforderlich ist.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der HC-SR501 wird mit VCC an den 5V/VIN-Pin des ESP32 angeschlossen — das ist korrekt für die Versorgung. Allerdings gibt der HC-SR501 am OUT-Pin 3,3 V aus (nicht 5 V), sodass die Verbindung zu GPIO 13 sicher ist. Jedoch: Viele HC-SR501-Module liefern am OUT-Pin tatsächlich bis zu 3,3 V, was für den ESP32 (3,3-V-Logik) in Ordnung ist. Kein Fehler hier — aber der Text sagt 'VCC an den 5V-VIN-Pin', was korrekt ist.
- **Fix:** Kein Handlungsbedarf — dieser Befund wird zurückgezogen.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der HC-SR501 gibt am OUT-Pin je nach Modulversion 3,3 V oder 5 V aus. Viele günstige HC-SR501-Module liefern am Ausgang 3,3 V (da der interne BISS0001-IC mit 3,3 V betrieben wird), aber einige Varianten liefern 5 V am OUT-Pin. Ein 5-V-Signal direkt an einem ESP32-GPIO (max. 3,3 V tolerant, nicht 5-V-tolerant) kann den ESP32 dauerhaft beschädigen. Der Lesson-Text warnt nicht vor diesem Risiko und empfiehlt keinen Spannungsteiler oder Level-Shifter.
- **Fix:** Einen Hinweis ergänzen, dass der OUT-Pin des HC-SR501 je nach Modulversion 3,3 V oder 5 V liefern kann; bei 5-V-Varianten ist ein Spannungsteiler (z. B. 10 kΩ / 20 kΩ) oder Level-Shifter zwischen OUT und GPIO 13 erforderlich, da ESP32-GPIOs nicht 5-V-tolerant sind.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Step 3 nennt keinen GPIO-Pin für das Servo-Signal, obwohl der Servo laut Intro und Summary das zentrale Bauteil ist.
- **Fix:** Den Servo-Signalpin (z. B. GPIO 13) explizit in der Verkabelungsbeschreibung und im Code angeben.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Code-Kommentar und die Variablenbezeichnung lauten MOTOR_PIN, aber laut Lesson-Titel und Beschreibung soll GPIO 25 den Servo ansteuern — Servo-PWM und Motor-PWM sind grundlegend verschieden (Servo braucht 50 Hz / 1–2 ms Pulse, kein 5000-Hz-Duty-Cycle).
- **Fix:** Für den Servo die ESP32Servo-Bibliothek mit servo.write(angle) verwenden und PWM_FREQ auf 50 Hz setzen, oder klarstellen, dass GPIO 25 einen DC-Motor und nicht den Servo ansteuert.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 5 [SIMULATE]
- **Category:** schematic-mismatch
- **Problem:** Step 5 beschreibt eine serielle Ausgabe mit Winkel-Abstand-Paaren und einer Zeile '>>> Nächstes Hindernis: X cm bei Y°', aber der Code in Step 4 gibt nur 'Abstand: %.1f cm → Duty: %d' aus — kein Sweep, kein Winkel.
- **Fix:** Die Simulate-Beschreibung an die tatsächliche Serial.printf-Ausgabe des Codes anpassen, oder den Code um den Sweep-Algorithmus mit Winkelausgabe ergänzen.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 6 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Die Quiz-Frage bezieht sich auf map(minDist, 5, 100, 50, 500) für eine Blink-Pause, aber im tatsächlichen Code in Step 4 wird map((long)dist, 5, 100, 50, 255) für einen PWM-Duty-Cycle verwendet — weder 'minDist' noch 500 ms noch LED-Blinken kommen im Code vor.
- **Fix:** Quiz-Frage und Antworten an den tatsächlichen Code anpassen (map(dist, 5, 100, 50, 255) → PWM-Duty-Cycle 50–255), oder den Code so ändern, dass er tatsächlich map mit Blink-Pause verwendet.

### `esp32-bmp280-luftdruck` — Luftdruck & Höhe: dein eigenes Barometer
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Aufruf bmp.setSampling() hat in der Adafruit BMP280 Library 5 Parameter, aber die Reihenfolge ist falsch: Der zweite Parameter ist die Temperatur-Oversampling-Einstellung und der dritte ist Druck-Oversampling. Im Code steht SAMPLING_X2 für Temperatur und SAMPLING_X16 für Druck — das ist zwar funktionsfähig, aber der eigentliche Fehler ist, dass ein sechster Parameter (Standby-Zeit) erwartet wird und STANDBY_MS_500 korrekt als fünfter übergeben wird; die Funktion erwartet jedoch als vierten Parameter den Filter und als fünften die Standby-Zeit, was hier korrekt ist. Tatsächlich kritisch: Die Adafruit BMP280 Library erwartet bei setSampling() sechs Argumente (mode, tempSampling, pressSampling, filter, duration), aber hier werden nur fünf übergeben — der sechste (IIR-Filter-Koeffizient) fehlt nicht, da FILTER_X16 als vierter und STANDBY_MS_500 als fünfter übergeben wird; die Signatur ist (mode, tempSampling, pressSampling, filter, duration) — das stimmt mit dem Code überein. Kein Fehler hier.
- **Fix:** Kein Fix nötig — nach erneuter Prüfung ist der setSampling()-Aufruf korrekt.

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Die Stückliste (BOM) enthält nur einen 220-Ω-Widerstand, aber der empfohlene 10-kΩ-Widerstand fehlt dort vollständig, obwohl er im Lesson-Text als Hauptempfehlung genannt wird.
- **Fix:** Den 10-kΩ-Widerstand als primären Eintrag in die BOM aufnehmen (z. B. '1× Widerstand 10 kΩ (empfohlen) oder 220 Ω (zum Ausprobieren)').

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 2 [EXPLAIN]
- **Category:** schematic-mismatch
- **Problem:** Die Formel im EXPLAIN-Schritt lautet Vout = 3,3 V × R_fest / (R_LDR + R_fest), aber laut Verkabelung (BUILD) liegt der Festwiderstand zwischen Messpunkt und GND — das ist korrekt. Die Formel beschreibt jedoch den Messpunkt zwischen LDR (oben, an 3,3 V) und Festwiderstand (unten, an GND), was richtig ist. Allerdings steht in der Erklärung 'mehr Licht → Spannung am Knotenpunkt steigt', was mit der Formel übereinstimmt, aber die Formel selbst ist korrekt — kein Fehler hier. Stattdessen: Die Formel nennt R_fest im Zähler, was dem unteren Widerstand entspricht; das ist konsistent mit dem Schaltungsaufbau.
- **Fix:** Kein Handlungsbedarf — dieser Befund wird zurückgezogen.

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die BOM listet nur 3 Jumper-Kabel (M/M), aber für die beschriebene Schaltung (3,3 V → LDR → GPIO 34 → Widerstand → GND) werden mindestens 4 Verbindungen benötigt: 3,3 V zum LDR, LDR-Ausgang zu GPIO 34, GPIO 34 zum Widerstand und Widerstand zu GND — also 4 Kabel.
- **Fix:** Die BOM auf '4× Jumper-Kabel (M/M)' korrigieren.

### `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Die Stückliste (BOM) listet nur den YL-69-Sensor, aber der Aufbau verwendet ausdrücklich das zweiteilige Modul bestehend aus Sonden (YL-69) UND Treiberplatine (YL-38) — die YL-38-Platine fehlt als eigenständiger BOM-Eintrag.
- **Fix:** BOM um '1× Treiberplatine YL-38' ergänzen, da Sonden und Platine separate Komponenten sind und Lernende sonst nur die Sonden bestellen könnten.

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Das BOM listet nur einen 4,7-kΩ-Widerstand, aber Step 1 und Step 3 erwähnen zwei 10-kΩ-Widerstände als Notlösung, die im BOM fehlen.
- **Fix:** BOM um '2× Widerstand 10 kΩ (optional, als Parallel-Ersatz für 4,7 kΩ)' ergänzen.

### `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Aussage 'je negativer, desto schwächer' ist korrekt, aber die Faustregel nennt nur das 2,4-GHz-Band, obwohl der ESP32 (je nach Modell) auch 5-GHz-WLAN unterstützen kann — das ist jedoch ein Randpunkt. Wichtiger: Die Erklärung, dass jeder Access-Point seinen RSSI sendet, ist faktisch falsch. RSSI ist kein vom Access-Point gesendeter Wert, sondern eine Messung der Empfangssignalstärke, die der empfangende ESP32 selbst misst.
- **Fix:** Formulierung ändern zu: 'Der ESP32 misst selbst, wie stark das Signal des jeweiligen Access-Points bei ihm ankommt — das nennt man RSSI (Received Signal Strength Indicator).'

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 2 [SAFETY]
- **Category:** safety
- **Problem:** Im Step 2 wird der Strom pro WS2812B-LED bei voller weißer Helligkeit mit 60 mA angegeben (20 mA × 3 Kanäle), aber in den SAFETY-NOTES am Ende steht 30 mA pro LED — ein direkter Widerspruch innerhalb derselben Lektion.
- **Fix:** Den korrekten Wert von 60 mA (20 mA × 3 Farbkanäle) einheitlich in allen Abschnitten verwenden und den Wert 30 mA in den SAFETY-NOTES auf 60 mA korrigieren.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 5 [CODE_WALK]
- **Category:** code-bug
- **Problem:** In der colorWheel()-Funktion wird pos = 255 - pos gesetzt, danach aber in den Zweigen mit pos * 3 multipliziert; für pos-Werte im Bereich 85–169 ergibt pos * 3 - 255 Werte bis zu 254, was korrekt ist, aber für pos = 170–254 ergibt (uint16_t)pos * 3 - 255 Werte bis zu 507, die beim Rückgabetyp uint8_t (implizit in strip.Color) abgeschnitten werden — die Farben im dritten Segment sind dadurch falsch.
- **Fix:** Den Cast auf (uint8_t) erst nach der Subtraktion anwenden oder die Berechnung so umstrukturieren, dass der Wertebereich 0–255 garantiert ist, z. B. pos = pos % 85 innerhalb jedes Zweigs verwenden wie in der offiziellen Adafruit-Referenzimplementierung.

### `esp32-mqtt-publish` — MQTT: Daten in die Welt senden
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die Variable 'counter' ist als 'long' deklariert, wird aber mit String(counter) in einen char-Buffer umgewandelt — im abgeschnittenen Code fehlt der publish()-Aufruf ganz, aber selbst wenn er ergänzt würde, müsste der Wert korrekt als char* übergeben werden (z. B. via snprintf oder String.c_str()), was im Unterricht explizit gezeigt werden sollte.
- **Fix:** Im vollständigen Code ein char-Array (z. B. char buf[16]; snprintf(buf, sizeof(buf), "%ld", counter);) verwenden und mqttClient.publish(topic, buf) aufrufen, damit Schüler den korrekten Typ-Umgang sehen.

### `esp32-webserver` — Webserver: dein ESP32 als Webseite
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** `digitalRead(LED_PIN)` gibt einen int (0 oder 1) zurück, der implizit in bool umgewandelt wird — das funktioniert zwar, aber da pinMode auf OUTPUT gesetzt ist, liest man den Ausgangs-Latch, nicht den tatsächlichen LED-Zustand; bei manchen ESP32-Varianten kann das zu falschem Status führen.
- **Fix:** Eine globale bool-Variable `ledState` einführen, die in handleOn/handleOff gesetzt wird, und diese statt digitalRead() in handleRoot() verwenden.

## MINOR (29)

### `esp32-blink-led` — Eine LED zum Blinken bringen
- **Where:** Step 4 [EXPLAIN]
- **Category:** factual-other
- **Problem:** In der Steckbrett-Erklärung heißt es, die ZEILEN heißen Buchstaben und die SPALTEN heißen Zahlen, aber dann wird erklärt, dass 'in jeder kurzen Spalte (5 Löcher übereinander)' die Löcher verbunden sind — tatsächlich sind auf einem Standard-Steckbrett die 5 Löcher in einer REIHE (horizontal, gleiche Zahl, Buchstaben a–e) verbunden, nicht in einer Spalte (vertikal). Die Begriffe Zeile/Spalte werden vertauscht verwendet.
- **Fix:** Korrigiere die Erklärung: Die 5 Löcher in einer Reihe (gleiche Spaltennummer, Buchstaben a bis e) sind intern verbunden — nicht die Löcher in einer Spalte.

### `esp32-blink-led` — Eine LED zum Blinken bringen
- **Where:** Step 4 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Das Steckbrett wird so beschrieben, dass 'in jeder kurzen Spalte (5 Löcher übereinander, gelb markiert) die Löcher INNEN miteinander verbunden' sind. Auf einem Standard-Steckbrett (z. B. MB-102) sind jedoch die 5 Löcher einer Gruppe horizontal (in einer Reihe, gleiche Nummer) verbunden, nicht vertikal. Die Beschreibung 'übereinander' suggeriert eine vertikale Verbindung, was falsch ist.
- **Fix:** Ändere die Erklärung zu: 'In jeder kurzen Reihe (5 Löcher nebeneinander, gleiche Spaltennummer, Buchstaben a–e) sind die Löcher intern verbunden.'

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Aussage, der ESP32 schalte die LED 'hunderte Male pro Sekunde' ein und aus, ist irreführend: Die im Code verwendete PWM-Frequenz beträgt 5000 Hz, also 5000-mal pro Sekunde.
- **Fix:** Formulierung auf 'tausende Male pro Sekunde' oder konkret '5000-mal pro Sekunde' ändern, damit es mit dem Code übereinstimmt.

### `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen
- **Where:** Step 3 [CODE_WALK]
- **Category:** factual-other
- **Problem:** Der Kommentar '8 Bit → Werte 0..255' ist korrekt, aber die Erklärung '256 Helligkeitsstufen' zählt 0 als Stufe mit — das ist zwar nicht falsch, aber der Wert 255 entspricht bei 8-Bit-Auflösung dem Maximum (2^8 − 1 = 255), nicht 256.
- **Fix:** Formulierung präzisieren: '8 Bit = Werte von 0 bis 255 (256 Stufen insgesamt)' um Verwechslung mit dem Maximalwert zu vermeiden.

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 0 [INTRO]
- **Category:** factual-other
- **Problem:** Im INTRO wird 'Orange' als eine der gezeigten Farben genannt, aber im Code (loop()) kommt Orange nicht vor — die Farben im Code sind Rot, Grün, Blau, Gelb, Türkis und Pink/Magenta.
- **Fix:** Im INTRO 'Orange' durch 'Gelb' ersetzen, damit es mit den tatsächlich im Code erzeugten Farben übereinstimmt.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** ledcSetup() wird mit einer Auflösung von 8 Bit aufgerufen, was für einen Buzzer funktioniert, aber der Initialfrequenz-Parameter (1000 Hz) hat bei Verwendung von ledcWriteTone() keine Auswirkung und kann Lernende verwirren.
- **Fix:** Den Kommentar oder die Erklärung ergänzen, dass der 1000-Hz-Parameter in ledcSetup() nur ein Platzhalter ist und durch ledcWriteTone() überschrieben wird.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste gibt 7 Jumper-Kabel an, aber die Verkabelung (5 Anoden-Kabel + 1 GND-Schienen-Kabel = 6 Kabel minimal) lässt sich nicht eindeutig auf genau 7 zurückführen; die Zahl ist nicht begründet und könnte Lernende verwirren.
- **Fix:** Jumper-Kabel-Anzahl in der BOM auf den tatsächlich benötigten Wert (z. B. 6 oder 11, je nach Verdrahtungsweg) korrigieren und kurz erläutern, wie sie sich aufteilen.

### `esp32-servo-sweep` — Servo: Bewegung steuern
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** Die angegebene Pulse-Width-Obergrenze von 2400 µs für den SG90 überschreitet den im Datenblatt spezifizierten Maximalwert von 2000–2400 µs und kann je nach Exemplar mechanisch über 180° hinausfahren und den Servo beschädigen.
- **Fix:** Den oberen Pulse-Width-Wert auf 2000 µs setzen (myServo.attach(SERVO_PIN, 500, 2000)), was dem SG90-Datenblatt besser entspricht und mechanische Überlastung vermeidet.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 2 [SAFETY]
- **Category:** factual-other
- **Problem:** Der SAFETY-Step nennt 12 mA als 'dauerhaft empfohlenen' Wert pro GPIO-Pin des ESP32, was zu niedrig ist — das ESP32-Datenblatt empfiehlt typisch 20 mA pro Pin als sicheren Dauerstrom (40 mA absolutes Maximum). 12 mA ist ein sehr konservativer Wert, der so im offiziellen Datenblatt nicht als Standardempfehlung steht.
- **Fix:** Den empfohlenen Dauerstrom auf '20 mA' korrigieren und 40 mA weiterhin als absolutes Maximum nennen, entsprechend dem ESP32-Datenblatt.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Der BOM listet einen 'Batteriehalter 4×AA' (ca. 6 V), während Step 1 (PARTS) als externe Stromquelle '3,7-V-LiPo oder 4×AA' nennt — ein LiPo ist im BOM nicht aufgeführt, was aber akzeptabel wäre. Jedoch passt der im BOM genannte 'Mini-DC-Motor 3V' nicht zur externen Quelle 4×AA (ca. 6 V), was den Motor überlasten könnte.
- **Fix:** Entweder den Motor auf '3–6 V' (wie in PARTS beschrieben) ändern oder die externe Quelle auf 3×AA (ca. 4,5 V) reduzieren, um den 3-V-Motor nicht zu überlasten.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der Klammersatz 'Beim reinen Full-Step wären es 1024 Schritte pro Umdrehung' ist falsch: im Full-Step-Betrieb mit dem 28BYJ-48 (Getriebe ~64:1, Rotor 32 Schritte) ergeben sich ebenfalls ca. 2048 Schritte pro Umdrehung (32 × 64 = 2048), nicht 1024.
- **Fix:** Den Klammersatz entfernen oder korrigieren: Full-Step und Half-Step unterscheiden sich in der Schrittweite pro Elektromagnet-Schaltung, aber die Gesamtschrittzahl pro Umdrehung bleibt durch das Getriebe bei ~2048 (Full-Step) bzw. ~4096 (Half-Step).

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Schallgeschwindigkeit wird mit 0,0343 cm/µs angegeben; der korrekte Wert bei ca. 20 °C beträgt 343 m/s = 0,0343 cm/µs — das stimmt. Allerdings gilt dieser Wert nur bei Raumtemperatur (~20 °C); bei anderen Temperaturen weicht er ab. Für Schüler wäre ein Hinweis sinnvoll, aber dies ist kein Fehler.
- **Fix:** Kein zwingender Fix — optionaler Hinweis auf Temperaturabhängigkeit möglich.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die BOM listet nur 4 Jumper-Kabel (M/M), aber für den empfohlenen Spannungsteiler am Echo-Pin werden mindestens 2 zusätzliche Verbindungen benötigt (Echo → R1, Mittelabgriff → GPIO, Mittelabgriff → R2 → GND), sodass 6–7 Kabel realistischer sind.
- **Fix:** Jumper-Kabel-Anzahl in der BOM auf mindestens 6× erhöhen, sobald die Widerstände ergänzt werden.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die 30-sekündige Aufwärmverzögerung 'delay(30000)' befindet sich in setup() — das blockiert den gesamten Programmstart für 30 Sekunden und verhindert jede andere Initialisierung oder Kommunikation in dieser Zeit. Das ist für Einsteiger verwirrend und nicht best practice.
- **Fix:** Die Aufwärmzeit besser mit 'millis()' in loop() realisieren oder zumindest im Code-Walk erklären, dass delay() hier den gesamten Mikrocontroller blockiert.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der Text beschreibt den PIR-Sensor als mit 'zwei kleinen Messflächen nebeneinander' ausgestattet. Tatsächlich hat der HC-SR501 eine einzelne pyroelektrische Keramikscheibe mit zwei Segmenten (differenziell verschaltet), die hinter einer Fresnellinse sitzt — es sind keine zwei räumlich getrennten Flächen im wörtlichen Sinne.
- **Fix:** Formulierung anpassen: 'Der Sensor hat ein pyroelektrisches Element mit zwei differenziell verschalteten Segmenten hinter einer Fresnellinse' — oder die Vereinfachung als solche kennzeichnen.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der Spannungsteiler für den Echo-Pin des HC-SR04 wird mit 1 kΩ und 2 kΩ angegeben, was eine Ausgangsspannung von 5 V × 2/(1+2) ≈ 3,33 V ergibt — das ist korrekt, aber der 1-kΩ-Widerstand fehlt in der BOM (nur ein 220-Ω-Widerstand ist gelistet).
- **Fix:** Einen 1-kΩ- und einen 2-kΩ-Widerstand in die BOM aufnehmen und den 220-Ω-Widerstand als separaten LED-Vorwiderstand kennzeichnen.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** Step 1 [PARTS]
- **Category:** term-order
- **Problem:** Der Begriff 'Pull-Up-Widerstand' wird in Step 1 (PARTS) verwendet, bevor er irgendwo in der Lektion eingeführt oder erklärt wird.
- **Fix:** Entweder den Begriff in Step 2 (EXPLAIN) kurz erklären oder in Step 1 eine kurze Klammererklärung ergänzen, z. B. '(ein Widerstand, der den Daten-Pin auf HIGH zieht)'.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die BOM listet 3× Jumper-Kabel (M/M), aber das DHT22-Modul hat 3 Pins (VCC, GND, OUT), die alle mit dem ESP32 verbunden werden — das sind genau 3 Kabel, was korrekt ist. Allerdings listet die BOM sowohl den DHT22-Sensor als auch den 10-kΩ-Widerstand, ohne zu unterscheiden, dass es sich um zwei alternative Aufbauvarianten handelt; der Widerstand ist bei der empfohlenen Modul-Variante ausdrücklich nicht nötig. Dies ist kein echter Fehler, aber die BOM-Beschreibung ist bereits korrekt kommentiert — kein Befund.
- **Fix:** Kein Handlungsbedarf — die BOM-Beschreibung erklärt den optionalen Charakter des Widerstands bereits korrekt.

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 1 [PARTS]
- **Category:** factual-other
- **Problem:** Die Aussage 'Ein 220-Ω-Widerstand funktioniert auch zum Ausprobieren' ist irreführend: Mit 220 Ω und einem typischen LDR (1 kΩ–1 MΩ) ist der Spannungsteiler stark unausgewogen und liefert im Dunkeln kaum auflösbare Werte; zudem fließt bei hellem Licht (LDR ~100 Ω) ein Strom von ~10 mA, was den GPIO-Pin belasten kann.
- **Fix:** Den 220-Ω-Widerstand als Alternative streichen oder mit einem klaren Hinweis versehen, dass er nur sehr eingeschränkt funktioniert und höhere Ströme verursacht.

### `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung
- **Where:** Step 3 [BUILD]
- **Category:** term-order
- **Problem:** Der Begriff 'Pull-Up' wird in Step 3 (BUILD) verwendet, ohne dass er zuvor im Lesson-Verlauf eingeführt oder erklärt wurde.
- **Fix:** Entweder den Begriff in Step 2 (EXPLAIN) kurz erklären oder in Step 3 durch eine einfache Umschreibung wie 'interner Widerstand zur Versorgungsspannung' ersetzen.

### `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** Der Kommentar 'DRY_VALUE 3500' impliziert, dass der ESP32-ADC Werte bis 3500 liefert, aber der ESP32-ADC hat eine Auflösung von 12 Bit (0–4095), wobei der nutzbare Bereich wegen der nichtlinearen Kennlinie typischerweise nur bis ca. 3100–3200 reicht — 3500 ist ein unrealistisch hoher Kalibrierwert.
- **Fix:** DRY_VALUE auf einen realistischeren Wert wie 2800–3100 setzen und im Kommentar darauf hinweisen, dass der Wert durch eigene Messung ermittelt werden soll.

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 3 [BUILD]
- **Category:** factual-other
- **Problem:** Der Text im payload (instruction_de) behauptet, zwei parallele 10-kΩ-Widerstände ergäben 5 kΩ und funktionierten 'einwandfrei', während der Fließtext im selben Step korrekt einschränkt, dass dies 'nicht ideal' ist — der payload widerspricht dem Fließtext.
- **Fix:** Den payload-Text an den Fließtext angleichen: 'Das ergibt 5 kΩ und funktioniert für kurze Kabel und einen einzelnen Sensor, ist aber nicht ideal.'

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 1 [PARTS]
- **Category:** term-order
- **Problem:** Der Begriff 'Pull-Up-Widerstand' wird in Step 1 (PARTS) verwendet, aber erst in Step 2 (EXPLAIN) eingeführt und erklärt.
- **Fix:** In Step 1 statt 'Pull-Up-Widerstand' neutral von '4,7-kΩ-Widerstand (Pflicht für den Datenbus)' sprechen und den Begriff erst in Step 2 einführen.

### `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?
- **Where:** Step 4 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Die Antwortoption c ('0 dBm — Geräte messen so positiv') ist als Distraktor gedacht, aber 0 dBm ist tatsächlich ein physikalisch möglicher und sehr starker RSSI-Wert (z. B. bei direktem Kontakt mit dem AP) — er ist nicht grundsätzlich falsch oder unmöglich, was den Distraktor irreführend macht.
- **Fix:** Den Distraktor c durch einen eindeutig falschen Wert ersetzen, z. B. '+10 dBm — je positiver, desto besser', und klarstellen, dass WLAN-RSSI-Werte in der Praxis immer negativ sind.

### `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?
- **Where:** Step 3 [CODE_WALK]
- **Category:** code-bug
- **Problem:** WiFi.scanNetworks() kann im Fehlerfall negative Werte zurückgeben (z. B. WIFI_SCAN_FAILED = -2), aber der Code speichert das Ergebnis in einem 'int n' und iteriert dann mit 'i < n' — bei einem negativen n wird die Schleife zwar nicht ausgeführt, aber es gibt keine Fehlerbehandlung oder Hinweis für den Lernenden.
- **Fix:** Nach 'int n = WiFi.scanNetworks();' eine Prüfung ergänzen: 'if (n < 0) { Serial.println("Scan fehlgeschlagen."); return; }' und dies im Code-Walk erklären.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der Text empfiehlt, den 5V/VIN-Pin des ESP32 DevKit V1 zur Versorgung des Streifens zu verwenden, aber beim ESP32 DevKit V1 ist der VIN-Pin nur dann wirklich 5 V, wenn über USB versorgt wird; bei Akkubetrieb kann die Spannung deutlich niedriger sein, was WS2812B-Streifen zum Fehler veranlassen kann.
- **Fix:** Einen expliziten Hinweis ergänzen, dass diese Verbindung ausschließlich bei USB-Versorgung funktioniert, und für andere Versorgungsarten ein externes 5V-Netzteil empfehlen.

### `esp32-mqtt-publish` — MQTT: Daten in die Welt senden
- **Where:** Step 3 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Aussage 'Publisher und Subscriber müssen nie gleichzeitig online sein' ist für QoS 0 (das im Code verwendete Standard-QoS) faktisch falsch: Bei QoS 0 gehen Nachrichten verloren, wenn der Subscriber zum Sendezeitpunkt nicht verbunden ist.
- **Fix:** Den Satz auf QoS 1/2 einschränken oder klarstellen, dass dies nur gilt, wenn persistente Sessions (QoS > 0) genutzt werden; bei QoS 0 (Standard) muss der Subscriber online sein, um Nachrichten zu empfangen.

### `esp32-mqtt-publish` — MQTT: Daten in die Welt senden
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** ESP.getEfuseMac() gibt einen uint64_t zurück; der Cast auf uint32_t schneidet die oberen 32 Bit ab, was die Eindeutigkeit der Client-ID bei vielen Geräten reduziert.
- **Fix:** Stattdessen String((uint32_t)(ESP.getEfuseMac() & 0xFFFFFFFF), HEX) explizit dokumentieren oder besser die vollen 64 Bit als String verwenden: String((uint64_t)ESP.getEfuseMac(), HEX).

### `esp32-webserver` — Webserver: dein ESP32 als Webseite
- **Where:** Step 6 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Option c ('Browser blockieren Port 80') ist als Distraktor gedacht, ist aber nicht vollständig falsch — einige Firewalls/Router blockieren tatsächlich eingehende Verbindungen auf Port 80 von außen. Der eigentliche Grund ist jedoch NAT/private IP, nicht der Port selbst.
- **Fix:** Option c umformulieren, z. B. 'Der ESP32 ist zu langsam, um Anfragen aus dem Internet zu beantworten.' — das ist eindeutig falsch und kein versehentlich richtiger Distraktor.

---

## Per-Lesson Übersicht

- `esp32-setup` — Setup: Computer + ESP32 verbinden: clean
- `esp32-blink-led` — Eine LED zum Blinken bringen: 2 critical · 1 major · 2 minor
- `esp32-button-led` — Taster: LED auf Knopfdruck: 1 critical · 1 major
- `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen: 1 major · 2 minor
- `esp32-rgb-led` — RGB-LED: Farben mischen: 2 major · 1 minor
- `esp32-buzzer-melodie` — Buzzer: dein erstes Lied: 3 major · 1 critical · 1 minor
- `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich: 1 major · 1 minor
- `esp32-servo-sweep` — Servo: Bewegung steuern: 1 major · 1 minor
- `esp32-dc-motor` — DC-Motor: drehen mit Kraft: 3 major · 2 minor
- `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel: 1 critical · 1 major · 1 minor
- `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus: 1 critical · 2 major · 2 minor
- `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder: 2 major · 1 critical · 2 minor
- `esp32-mini-roboter` — Mini-Roboter: alles zusammen: 4 critical · 4 major · 1 minor
- `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen: 2 minor
- `esp32-bmp280-luftdruck` — Luftdruck & Höhe: dein eigenes Barometer: 1 major
- `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell: 3 major · 1 critical · 1 minor
- `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen: clean
- `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung: 1 major · 2 minor
- `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht: 1 major · 2 minor
- `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?: 1 major · 2 minor
- `esp32-oled-display` — OLED-Display: erstes eigenes Bild: clean
- `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe: 2 major · 1 minor
- `esp32-mqtt-publish` — MQTT: Daten in die Welt senden: 1 critical · 1 major · 2 minor
- `esp32-webserver` — Webserver: dein ESP32 als Webseite: 1 critical · 1 major · 1 minor
- `esp32-ota-update` — OTA: drahtlos neue Firmware aufspielen: clean