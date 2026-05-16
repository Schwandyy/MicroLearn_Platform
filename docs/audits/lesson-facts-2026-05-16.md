# Lesson-Fakten-Audit 2026-05-16

Model: `claude-sonnet-4-6` · Lessons: 25

**Total findings:** 66 (16 critical / 29 major / 21 minor)

## CRITICAL (16)

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Code verwendet die veraltete ESP32-Arduino-API (ledcSetup + ledcAttachPin), die ab ESP32-Arduino-Core v3.x entfernt wurde und auf aktuellen Installationen nicht kompiliert.
- **Fix:** Entweder den Core auf v2.x einschränken und das explizit dokumentieren, oder auf die neue API umstellen: ledcAttach(PIN_R, PWM_FREQ, PWM_RES) und ledcWrite(PIN_R, r).

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** ledcSetup() wird mit einer initialen Frequenz von 1000 Hz aufgerufen; ledcWriteTone() überschreibt diese Frequenz korrekt, aber die Auflösung von 8 Bit ist für ledcWriteTone() unproblematisch — kein Fehler hier. Jedoch referenziert Step 5 und Step 7 ein Array namens melody[], das im Code nicht existiert; das Array heißt frequenzen[].
- **Fix:** In Step 5 und Step 7 'melody[]' durch 'frequenzen[]' ersetzen, damit der Text mit dem tatsächlichen Code übereinstimmt.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die Rückwärts-Schleife lautet `for (int i = NUM_LEDS - 2; i > 0; i--)`, was i von 3 bis 1 laufen lässt — Index 0 (die erste LED) wird dabei nie eingeschaltet, obwohl das Lauflicht vollständig hin- und herpendeln soll.
- **Fix:** Die Bedingung muss `i >= 0` lauten: `for (int i = NUM_LEDS - 2; i >= 0; i--)`, damit auch die erste LED beim Rücklauf aufleuchtet.

### `esp32-servo-sweep` — Servo: Bewegung steuern
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Die Verkabelung weist den ESP32 an, die rote Ader (5 V) direkt an den 5V-Pin des ESP32 DevKit V1 anzuschließen, aber der 5V-Pin des DevKit ist nur dann verfügbar und stabil, wenn das Board über USB versorgt wird — er ist kein geregelter 5V-Ausgang, sondern direkt mit der USB-VBUS-Leitung verbunden und kann je nach Host-USB-Port strombegrenzt sein.
- **Fix:** Klarstellen, dass der 5V-Pin des ESP32 DevKit direkt von USB-VBUS kommt und bei hohem Servo-Strombedarf nicht ausreicht; primär externe 5V-Versorgung empfehlen und den direkten Anschluss an den ESP32-5V-Pin als Notlösung kennzeichnen.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Der MOSFET (IRLZ44N), die Freilaufdiode (1N4007) und die externe Stromquelle werden im BUILD-Schritt verwendet, fehlen aber vollständig in der BOM.
- **Fix:** BOM um '1× IRLZ44N MOSFET', '1× 1N4007-Diode' und '1× externe Stromquelle (z. B. 4×AA-Batteriehalter)' ergänzen.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Die Verkabelung beschreibt 'Motor-Minus an Drain' und 'Source an GND', aber beim N-Kanal-MOSFET (IRLZ44N) muss der Strom von Drain nach Source fließen: Motor-Minus an Drain, Source an GND ist korrekt — jedoch wird der Motor-Plus an die externe Quelle angeschlossen, während Drain oben liegt. Die Beschreibung ist korrekt, aber es fehlt ein Gate-Vorwiderstand (typisch 100–470 Ω), der bei schnellen PWM-Signalen den ESP32-Pin vor Überstrom schützt.
- **Fix:** Einen Gate-Vorwiderstand (z. B. 100 Ω) zwischen GPIO 25 und dem Gate des MOSFET in Schaltplan und Verkabelungsbeschreibung ergänzen.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Der BUILD-Schritt beschreibt die Verkabelung als IN1→GPIO19, IN2→GPIO18, IN3→GPIO5, IN4→GPIO17, aber im Code wird der Stepper-Konstruktor mit der Reihenfolge (19, 5, 18, 17) aufgerufen, was IN1→19, IN3→5, IN2→18, IN4→17 entspricht — die Zuordnung von IN2 und IN3 ist im Text gegenüber dem Code vertauscht.
- **Fix:** Den BUILD-Schritt korrigieren: IN1→GPIO19, IN2→GPIO18, IN3→GPIO5, IN4→GPIO17 entweder an die Code-Reihenfolge (19, 5, 18, 17) anpassen oder den Konstruktor auf Stepper(STEPS_PER_REV, 19, 18, 5, 17) ändern und den Kommentar im Code entsprechend aktualisieren.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der Spannungsteiler für den Echo-Pin ist falsch dimensioniert: 10 kΩ + 20 kΩ ergibt 5 V × (20/(10+20)) = 3,33 V, was korrekt wäre — aber die Beschreibung nennt die Widerstände in der falschen Reihenfolge: 10 kΩ zwischen Echo und dem Mittelabgriff, 20 kΩ zwischen Mittelabgriff und GND. Tatsächlich steht im Text '10 kΩ + 20 kΩ zwischen Echo und GND, Mitte zu GPIO 18', was bedeutet, dass 10 kΩ oben (Richtung Echo/5 V) und 20 kΩ unten (Richtung GND) liegt — das ergibt am Mittelabgriff 5 V × 20/(10+20) ≈ 3,33 V. Das ist rechnerisch korrekt, aber die übliche und sichere Konvention ist 1 kΩ + 2 kΩ (oder ähnlich niederohmig), da hochohmige Teiler bei schnellen Pulsen durch parasitäre Kapazitäten die Flanken verschleifen und pulseIn() versagen lassen.
- **Fix:** Verwende niederohmigere Widerstände, z. B. 1 kΩ (oben, Richtung Echo) und 2 kΩ (unten, Richtung GND), um Signalverfälschung durch parasitäre Kapazitäten zu vermeiden.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der HC-SR04 benötigt eine 5-V-Versorgung (VCC), aber viele ESP32 DevKit V1-Boards stellen am VIN/5V-Pin nur dann 5 V bereit, wenn sie per USB gespeist werden — das wird im Text nicht erwähnt und könnte Lernende verwirren, die den ESP32 über eine andere Quelle betreiben.
- **Fix:** Ergänze einen Hinweis, dass der 5-V-Pin des ESP32 DevKit nur bei USB-Betrieb 5 V liefert und der HC-SR04 zwingend 5 V benötigt.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Code ruft 'delay(30000)' in setup() auf, was den ESP32 für 30 Sekunden blockiert und den seriellen Monitor einfriert — das ist zwar funktional, aber 'digitalWrite(LED_PIN, motion)' übergibt einen int-Wert (0 oder 1) direkt an digitalWrite, was auf dem ESP32 korrekt funktioniert. Kein echter Bug hier.
- **Fix:** Kein Handlungsbedarf.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die Formel `duration * 0.0343 / 2.0` liefert das Ergebnis in Zentimetern nur dann korrekt, wenn `duration` in Mikrosekunden vorliegt — das ist hier der Fall (pulseIn gibt µs zurück). Allerdings ist der Faktor falsch: Die Schallgeschwindigkeit beträgt ~343 m/s = 0,0343 cm/µs, die Division durch 2 ist korrekt. Tatsächlich ist die Formel rechnerisch richtig (0,0343 cm/µs / 2 = 0,01715 cm/µs), also kein Fehler hier. JEDOCH: Der Code-String im payload wird mitten im Satz abgeschnitten (`Serial.p`) — der Code ist unvollständig und kompiliert nicht.
- **Fix:** Den vollständigen Code-String im payload von Step 4 einfügen, sodass der Code syntaktisch vollständig und kompilierbar ist.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste (BOM) enthält keinen 10-kΩ-Widerstand, obwohl Step 3 explizit beschreibt, dass bei der Sensor-Variante ohne Platine ein 10-kΩ-Pull-Up-Widerstand zwischen Daten-Pin und VCC benötigt wird.
- **Fix:** Einen '1× Widerstand 10 kΩ' als optionalen Eintrag in die BOM aufnehmen (z. B. mit dem Hinweis 'nur bei Bare-Sensor-Variante nötig').

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Im BUILD-Schritt wird beschrieben: LDR-Bein an 3,3 V, anderes Bein an GPIO 34, dann Widerstand von GPIO 34 nach GND. Das ergibt einen Spannungsteiler mit LDR oben und Festwiderstand unten — der Messpunkt liegt korrekt dazwischen. Die Schaltung ist elektrisch korrekt und stimmt mit der Formel überein. Kein Fehler.
- **Fix:** Kein Handlungsbedarf.

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Die Bedingung `a.acceleration.z < 5` erkennt 'senkrecht gestellt', aber im Flachzustand ist Z ≈ 9,8 m/s² (also > 5), sodass diese Bedingung im Normalfall NICHT zutrifft — sie wird jedoch vor dem 'liegt flach'-Zweig geprüft und würde fälschlicherweise auslösen, wenn Z zwischen 0 und 5 liegt (z. B. bei 45°-Kippung), nicht bei echter Senkrecht-Stellung (Z ≈ 0).
- **Fix:** Die Bedingung sollte `a.acceleration.z < 5 && a.acceleration.z > -5` (oder besser `abs(a.acceleration.z) < 5`) lauten und zusätzlich prüfen, dass X und Y ebenfalls klein sind; alternativ die Logik umkehren: erst auf 'flach' prüfen (Z > 8), dann auf 'senkrecht' (Z < 3).

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Die Stückliste (BOM) enthält keinen 4,7-kΩ-Widerstand, obwohl dieser im Unterricht als Pflichtbauteil bezeichnet wird.
- **Fix:** Einen Eintrag '1× Widerstand 4,7 kΩ' zur BOM hinzufügen.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der ESP32 DevKit V1 liefert am VIN-Pin 5 V nur dann, wenn er selbst über USB versorgt wird — der WS2812B-Streifen wird aber mit 5 V betrieben, während die GPIO-Datenpegel des ESP32 nur 3,3 V sind. Das eigentliche Problem: Der Streifen-DIN-Eingang erwartet einen High-Pegel von mindestens 0,7 × VDD = 3,5 V, der ESP32-GPIO liefert aber nur 3,3 V. Das kann zu Kommunikationsfehlern führen, ohne dass ein Hinweis darauf gegeben wird.
- **Fix:** Einen Pegelwandler (3,3 V → 5 V) zwischen ESP32-GPIO und DIN ergänzen oder darauf hinweisen, dass in der Praxis der 470-Ω-Widerstand und kurze Leitungen oft ausreichen, aber kein garantierter Betrieb besteht.

## MAJOR (29)

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste enthält nur 3 Jumper-Kabel, aber die Schaltung benötigt mindestens 4: eines von GPIO 4 zum Taster, eines vom Taster zur GND-Schiene, eines von GPIO 2 zum Widerstand/LED und eines von der LED-Kathode zur GND-Schiene.
- **Fix:** BOM auf '4× Jumper-Kabel (M/M)' erhöhen (oder die Anzahl nach tatsächlichem Aufbau prüfen und anpassen).

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Step 3 beschreibt eine Common-Cathode-LED, deren langes Bein GND ist, aber der Hinweis-Payload in Step 3 spricht von einer Common-Anode-LED mit langem Bein an 3,3 V — das widerspricht der im BOM und in Step 1 genannten Common-Cathode-LED und verwirrt Lernende.
- **Fix:** Den Common-Anode-Hinweis als klar gekennzeichneten optionalen Exkurs formulieren oder in einen separaten Schritt auslagern, damit er nicht mit der Hauptverdrahtung verwechselt wird.

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 2 [EXPLAIN]
- **Category:** term-order
- **Problem:** In Step 2 wird PWM mit dem Verweis 'das schnelle Ein-/Ausschalten von vorher' eingeführt, obwohl PWM in keinem vorherigen Schritt dieser Lesson erklärt oder auch nur erwähnt wurde.
- **Fix:** PWM in Step 2 kurz eigenständig erklären (z. B. 'PWM bedeutet, den Pin sehr schnell ein- und auszuschalten, um eine mittlere Helligkeit zu erzeugen') und den Rückverweis 'von vorher' entfernen.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 5 [SIMULATE]
- **Category:** schematic-mismatch
- **Problem:** Step 5 fordert den Lernenden auf, eine Zahl in 'melody[]' zu ändern, aber das Array im Code heißt 'frequenzen[]' — der Lernende findet 'melody[]' im Code nicht und kann die Aufgabe nicht ausführen.
- **Fix:** In Step 5 'melody[]' durch 'frequenzen[]' ersetzen.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 7 [CELEBRATE]
- **Category:** schematic-mismatch
- **Problem:** Step 7 verweist erneut auf 'melody[]'-Array, das im Code nicht existiert (es heißt 'frequenzen[]').
- **Fix:** In Step 7 'melody[]' durch 'frequenzen[]' ersetzen.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** Die Notenfolge C-D-E-F-G-G-A-A (262, 294, 330, 349, 392, 392, 440, 440 Hz) entspricht nicht den ersten 8 Noten von 'Alle meine Entchen'. Die korrekte Melodie beginnt C-D-E-F-G-G (Takt 1–2), dann A-A-A-A-G (Takt 3), nicht A-A als Noten 7–8.
- **Fix:** Die Notenfolge auf die tatsächlichen ersten 8 Noten von 'Alle meine Entchen' korrigieren: C-D-E-F-G-G-A-A ist melodisch akzeptabel für die ersten zwei Takte, aber die Dauern sollten überprüft werden — alternativ klar kommunizieren, dass es sich um eine vereinfachte Version handelt.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** Step 6 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Die als korrekt markierte Antwort (b) erklärt, warum Index 4 übersprungen wird, aber der tatsächliche Code überspringt zusätzlich Index 0 — die Antwort beschreibt also nur die halbe (und im Code fehlerhafte) Logik und ist damit irreführend.
- **Fix:** Entweder den Code korrigieren (i >= 0) und die Quizfrage anpassen, oder die korrekte Antwort so formulieren, dass sie die tatsächliche Schleifenlogik (Überspringen beider Endpunkte) korrekt beschreibt.

### `esp32-servo-sweep` — Servo: Bewegung steuern
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der SG90-Servo hat standardmäßig braune, rote und orange Adern — die Signalader ist orange, nicht gelb. Im Text wird sie zuerst korrekt als 'orange/gelb' bezeichnet, dann aber nur noch als 'Gelb' beschrieben, was bei einem rein orangen Kabel zur falschen Zuordnung führen kann.
- **Fix:** Konsequent 'orange (oder gelb)' schreiben, da die Signalader des SG90 typischerweise orange ist und 'Gelb' als alleinige Bezeichnung irreführend ist.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 2 [SAFETY]
- **Category:** factual-other
- **Problem:** Die Aussage 'ein GPIO-Pin des ESP32 liefert maximal 12 mA' ist falsch — das offizielle ESP32-Datenblatt gibt 40 mA als absolutes Maximum pro Pin an (empfohlen ≤ 12 mA im Dauerbetrieb). Die Formulierung vermischt Empfehlung und absolutes Maximum.
- **Fix:** Text korrigieren zu: 'Ein GPIO-Pin des ESP32 sollte dauerhaft nicht mehr als 12 mA liefern (absolutes Maximum 40 mA) — ein Motor braucht oft das Zehnfache oder mehr.'

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die BOM listet einen 'Mini-DC-Motor 3V', der BUILD-Schritt und PARTS-Schritt beschreiben aber einen Motor für 3–6 V mit externer Stromquelle (3,7-V-LiPo oder 4×AA = 6 V). Ein reiner 3-V-Motor würde an 6 V überlastet.
- **Fix:** BOM-Eintrag auf '1× Mini-DC-Motor 3–6 V' ändern, damit er zur empfohlenen Stromquelle passt.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 0 [INTRO]
- **Category:** term-order
- **Problem:** Der Begriff 'PWM' wird im INTRO (Step 0) verwendet, bevor er in Step 3 (EXPLAIN) erklärt wird.
- **Fix:** Im INTRO 'per PWM' entweder weglassen oder durch eine kurze Klammer-Erklärung ersetzen; die vollständige Einführung bleibt in Step 3.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der EXPLAIN-Schritt gibt an, dass 2048 Schritte eine volle Umdrehung ergeben und daraus 512 Schritte = 90° folgen — das gilt jedoch nur im Half-Step-Modus; im Full-Step-Modus des 28BYJ-48 sind es 2048 Schritte im Half-Step (4096 Halbschritte / 2) bzw. nur 1024 Schritte pro Umdrehung im reinen Full-Step-Modus.
- **Fix:** Klarstellen, dass die Arduino Stepper-Library den 28BYJ-48 im Full-Step-Modus mit 2048 Schritten pro Umdrehung ansteuert (was dem Hersteller-Datenblatt für den Half-Step-Modus entspricht) und dass der im Code verwendete Wert STEPS_PER_REV = 2048 mit der Library korrekt ist — oder den Modus explizit als 'Half-Step (2048)' benennen, um Verwirrung zu vermeiden.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Schallgeschwindigkeit wird mit 0,0343 cm/µs angegeben, was 343 m/s entspricht und nur bei ca. 20 °C gilt; bei anderen Temperaturen weicht der Wert ab — das wird nicht erwähnt, ist aber für ein Lernprojekt relevant.
- **Fix:** Füge einen kurzen Hinweis hinzu, dass 343 m/s die Schallgeschwindigkeit bei Raumtemperatur (~20 °C) ist und sich bei Kälte oder Wärme leicht ändert.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** bom-mismatch
- **Problem:** Der empfohlene Spannungsteiler (10 kΩ + 20 kΩ) für den Echo-Pin wird im BUILD-Schritt als sichere Option beschrieben, die beiden Widerstände fehlen jedoch vollständig in der Stückliste (BOM).
- **Fix:** Füge '2× Widerstand (1 kΩ und 2 kΩ, oder 10 kΩ und 20 kΩ)' zur BOM hinzu, oder kennzeichne den Spannungsteiler klar als optionale Erweiterung.

### `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der HC-SR501 wird mit VCC an den 5V/VIN-Pin des ESP32 angeschlossen — das ist korrekt für die Versorgung. Allerdings gibt der HC-SR501 am OUT-Pin 3,3 V aus (nicht 5 V), sodass die Verbindung zu GPIO 13 sicher ist. Jedoch: Viele HC-SR501-Module liefern am OUT-Pin tatsächlich bis zu 3,3 V, was für den ESP32 (3,3-V-Logik) in Ordnung ist. Kein Fehler hier — aber der Text sagt 'VCC an den 5V-VIN-Pin', was korrekt ist.
- **Fix:** Kein Handlungsbedarf — dieser Punkt ist korrekt.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 4 [CODE_WALK]
- **Category:** schematic-mismatch
- **Problem:** Der Code referenziert `map(minDist, 5, 100, 50, 500)` laut Quiz (Step 6), aber im sichtbaren Code-Ausschnitt in Step 4 taucht diese Funktion nicht auf — der Code ist abgeschnitten, sodass Lernende den Zusammenhang zwischen Quiz-Frage und Code nicht nachvollziehen können.
- **Fix:** Den vollständigen Code inklusive des `map()`-Aufrufs im CODE_WALK-Step anzeigen, damit die Quiz-Frage nachvollziehbar ist.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der HC-SR04 Echo-Pin gibt 5 V aus, der ESP32 GPIO ist jedoch nur 3,3-V-tolerant. Ein direkter Anschluss des Echo-Pins an GPIO 18 kann den ESP32 dauerhaft beschädigen.
- **Fix:** Einen Spannungsteiler (z. B. 1 kΩ / 2 kΩ) oder einen Pegelwandler zwischen Echo-Pin und GPIO 18 einbauen und dies in der Verkabelungsanleitung erklären.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Das DHT22 verwendet kein 1-Wire-Protokoll (wie z. B. Dallas DS18B20), sondern ein proprietäres Single-Bus-Protokoll von Aosong, das inkompatibel mit dem 1-Wire-Standard ist.
- **Fix:** Den Begriff '1-Wire-Protokoll' durch 'proprietäres Single-Bus-Protokoll' oder 'eigenes serielles Protokoll' ersetzen, um keine Verwechslung mit dem Dallas 1-Wire-Standard zu erzeugen.

### `esp32-bmp280-luftdruck` — Luftdruck & Höhe: dein eigenes Barometer
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** Der Aufruf bmp.setSampling() in der Adafruit-BMP280-Library erwartet 5 Parameter in der Reihenfolge (mode, tempSampling, pressSampling, filter, standby). Im Code werden SAMPLING_X2 für Temperatur und SAMPLING_X16 für Druck übergeben — das ist vertauscht gegenüber der Library-Signatur (erster Sampling-Parameter = Temperatur, zweiter = Druck), was zu schlechter Temperaturauflösung und übermäßigem Rauschen führt.
- **Fix:** Tausche die Reihenfolge: bmp.setSampling(MODE_NORMAL, SAMPLING_X16, SAMPLING_X2, FILTER_X16, STANDBY_MS_500) — Temperatur zuerst mit höherem Oversampling, Druck danach.

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Die Stückliste (BOM) enthält nur einen 220-Ω-Widerstand, aber der empfohlene 10-kΩ-Widerstand fehlt dort vollständig, obwohl er im Lesson-Text als bevorzugter Wert genannt wird.
- **Fix:** Den 10-kΩ-Widerstand als primären Eintrag in die BOM aufnehmen (z. B. '1× Widerstand 10 kΩ (alternativ 220 Ω zum Ausprobieren)').

### `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell
- **Where:** Step 2 [EXPLAIN]
- **Category:** schematic-mismatch
- **Problem:** Die Formel im EXPLAIN-Schritt lautet Vout = 3,3 V × R_fest / (R_LDR + R_fest), aber laut Verkabelung (BUILD) liegt der Festwiderstand zwischen Messpunkt und GND — das ist korrekt. Jedoch beschreibt der EXPLAIN-Text 'Widerstand 1 = LDR, Widerstand 2 = Festwiderstand' und die Formel zeigt R_fest im Zähler, was bedeutet: mehr Licht → R_LDR sinkt → Vout steigt. Das stimmt mit der Schaltung überein, aber die Formel ist für den Spannungsteiler am unteren Widerstand (R_fest nach GND) korrekt nur wenn R_fest der untere Widerstand ist — das ist hier der Fall, also ist die Formel richtig. Kein Fehler hier.
- **Fix:** Kein Handlungsbedarf — zur Sicherheit prüfen, ob die Beschriftung 'Widerstand 1' und 'Widerstand 2' mit der Formel konsistent erklärt wird.

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der Text behauptet, der ruhende Sensor zeige ~9,8 m/s² 'nach oben' weil die Erdanziehung ihn 'nach unten zieht' und das die 'Gegenkraft' sei — das ist physikalisch ungenau/irreführend: der Beschleunigungssensor misst die Normalkraft (Gegenkraft zur Schwerkraft), also tatsächlich +9,8 m/s² in Richtung der Stützfläche, aber die Erklärung vermischt Schwerkraft und Gegenkraft auf verwirrende Weise.
- **Fix:** Erklären, dass ein MEMS-Beschleunigungssensor keine Schwerkraft direkt misst, sondern die mechanische Gegenkraft (Normalkraft), die der Tisch auf den Sensor ausübt — deshalb zeigt er +9,8 m/s² nach oben, wenn er flach liegt.

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Der Bauschritt warnt, dass 'der ESP32-Eingang' keine 5 V verträgt, aber das GY-521-Board hat einen eigenen 3,3-V-Regler und Pegelwandler — die I²C-Leitungen des GY-521 sind bei 5-V-Versorgung bereits auf 3,3 V gepegelt; die eigentliche Gefahr bei 5 V ist der MPU-6050-Chip selbst (max. 3,46 V VDD laut Datenblatt), nicht primär der ESP32-Eingang.
- **Fix:** Die Sicherheitswarnung korrigieren: 5 V können den MPU-6050-Chip direkt beschädigen (VDD max. 3,46 V); bei Verwendung des GY-521-Boards mit eingebautem Regler ist 5 V am VCC-Pin des Boards zwar oft möglich, aber 3,3 V ist sicherer für den Chip.

### `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung
- **Where:** Step 1 [PARTS]
- **Category:** factual-other
- **Problem:** Das YL-69-Modul besteht aus zwei Edelstahlsonden (nicht Zinksonden) und einer Treiberplatine (oft als YL-38 bezeichnet).
- **Fix:** Ersetze 'Zinksonden' durch 'Edelstahlsonden' (bzw. 'Metallsonden'), da Zink als Sondenmaterial bei diesem Modul nicht korrekt ist.

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Zwei 10-kΩ-Widerstände parallel ergeben 5 kΩ, nicht wie angegeben 'einwandfrei' für 1-Wire: der Richtwert ist 4,7 kΩ, und 5 kΩ liegt zwar nahe dran, aber die Aussage, es funktioniere 'einwandfrei', ist irreführend — tatsächlich ist der Wert grenzwertig und kann bei langen Kabeln oder mehreren Sensoren zu Kommunikationsfehlern führen.
- **Fix:** Den Hinweis abschwächen: 'Das ergibt ~5 kΩ und funktioniert in den meisten Fällen, ist aber nicht ideal für lange Kabel oder mehrere Sensoren.'

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 2 [EXPLAIN]
- **Category:** term-order
- **Problem:** Der Begriff 'Pull-Up-Widerstand' wird in Step 2 (EXPLAIN) verwendet, ohne vorher eingeführt worden zu sein — Step 1 (PARTS) nennt nur '4,7-kΩ-Widerstand', ohne den Begriff Pull-Up zu erklären.
- **Fix:** In Step 1 oder zu Beginn von Step 2 kurz erklären, was ein Pull-Up-Widerstand ist (z. B. 'Ein Pull-Up-Widerstand verbindet die Datenleitung mit VCC, damit sie einen definierten HIGH-Pegel hat').

### `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?
- **Where:** Step 4 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Die Antwortoption c ('0 dBm — Geräte messen so positiv') ist faktisch falsch dargestellt: 0 dBm ist tatsächlich der höchste (stärkste) RSSI-Wert, den ein WLAN-Gerät messen kann, und würde auf exzellenten Empfang hindeuten — stärker als -50 dBm. Damit ist Option c ebenfalls eine korrekte Antwort auf die Frage, was den Distractor unbeabsichtigt richtig macht.
- **Fix:** Option c sollte so formuliert werden, dass sie eindeutig falsch ist, z. B. '+10 dBm — je positiver, desto besser' mit einer Erklärung, dass WLAN-RSSI-Werte in der Praxis immer negativ sind, oder die Option durch einen klar falschen Wert wie '-30 dBm ist schlechter als -90 dBm' ersetzen.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste (BOM) enthält keinen 470-Ω-Widerstand, obwohl dieser in Schritt 4 (BUILD) und im Code-Schritt als notwendiges Bauteil für die Datenleitung beschrieben wird.
- **Fix:** Den Eintrag '1× Widerstand 470 Ω' zur BOM hinzufügen.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 2 [SAFETY]
- **Category:** safety
- **Problem:** Die Safety-Note gibt 30 mA pro LED bei voller Helligkeit an, Schritt 2 rechnet aber mit 240 mA / 8 LEDs = 30 mA pro LED — das stimmt nur für weiß (R+G+B je 20 mA = 60 mA pro LED). Der korrekte Maximalwert für eine WS2812B-LED bei voller weißer Helligkeit beträgt ca. 60 mA, nicht 30 mA.
- **Fix:** Den Wert in der Safety-Note auf '60 mA pro LED bei voller weißer Helligkeit (alle drei Kanäle an)' korrigieren und die Gesamtrechnung für 8 LEDs auf 480 mA anpassen.

## MINOR (21)

### `esp32-button-led` — Taster: LED auf Knopfdruck
- **Where:** Step 5 [BUILD]
- **Category:** pin-wiring
- **Problem:** In Schritt 3 wird beschrieben, dass der Widerstand von GPIO 2 zur LED-Anode führt, was bedeutet, dass der Widerstand zwischen GPIO-Pin und LED liegt — das ist korrekt. Allerdings fehlt die explizite Erwähnung, dass die GND-Schiene auch tatsächlich mit dem GND-Pin des ESP32 verbunden sein muss; diese Verbindung wird in keinem Schritt beschrieben.
- **Fix:** Einen BUILD-Schritt oder einen Hinweis ergänzen, der erklärt, dass die blaue Minus-Schiene mit einem GND-Pin des ESP32 verbunden werden muss, und dieses Kabel in der BOM berücksichtigen.

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 1 [PARTS]
- **Category:** factual-other
- **Problem:** Step 1 beschreibt die Pinreihenfolge einer Common-Cathode-RGB-LED als 'R, GND, G, B', was der gängigen Pinbelegung (R, GND, G, B von links nach rechts bei 5-mm-LEDs) entspricht, aber als 'vier Beine: R, GND, G, B' formuliert ist — das längste Bein ist tatsächlich die gemeinsame Kathode (GND), liegt aber an zweiter Position, nicht am Ende; die Beschreibung könnte Lernende beim Identifizieren der Pins verwirren.
- **Fix:** Klarstellen, dass das längste Bein (GND/Kathode) an zweiter Stelle von links sitzt, und eine kleine Skizze oder Beschriftung der Pinreihenfolge ergänzen.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Das mittlere C (C4) hat eine Standardfrequenz von 261,63 Hz, wird aber im Lesson-Text als 262 Hz angegeben — das ist zwar gerundet korrekt, aber im Code wird ebenfalls 262 Hz verwendet, was konsistent ist. Kein Fehler hier.
- **Fix:** Kein Handlungsbedarf — 262 Hz ist eine akzeptable Rundung für C4.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** In der Code-Erklärung (lines, explain_en) steht '262 Hz is a C' und die Melodie wird als 'Twinkle Twinkle' bezeichnet, obwohl die Lesson durchgehend 'Alle meine Entchen' als Titel verwendet — das ist inkonsistent und irreführend.
- **Fix:** In der englischen Erklärung 'Twinkle Twinkle' durch 'Alle meine Entchen' ersetzen, da es sich um dieselbe Melodie handelt und der Kontext einheitlich sein sollte.

### `esp32-buzzer-melodie` — Buzzer: dein erstes Lied
- **Where:** Step 6 [QUIZ]
- **Category:** quiz-wrong
- **Problem:** Die Frage nennt '524 Hz' als doppelten Wert von 262 Hz, aber die korrekte Oktave über C4 (262 Hz) ist C5 = 523,25 Hz ≈ 523 Hz, nicht 524 Hz. 524 Hz ist kein standardisierter Notenwert.
- **Fix:** Den Wert '524 Hz' in der Frage durch '523 Hz' oder '524 Hz' mit dem Hinweis ersetzen, dass es sich um eine Annäherung handelt — oder den Wert auf 523 Hz korrigieren.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste nennt 7 Jumper-Kabel, aber für 5 LEDs (je 1 Anode-Kabel zu GPIO) plus 1 GND-Schienen-Kabel werden mindestens 6 Kabel benötigt; 7 ist plausibel, aber die Begründung fehlt und könnte Lernende verwirren.
- **Fix:** Anzahl der Jumper-Kabel im BOM auf 6 korrigieren (5× GPIO-Anode + 1× GND zum Steckbrett) oder eine kurze Erklärung ergänzen, wofür das 7. Kabel verwendet wird.

### `esp32-servo-sweep` — Servo: Bewegung steuern
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** Die Pulse-Width-Grenzen 500–2400 µs im attach()-Aufruf weichen von den SG90-Standardwerten (600–2400 µs laut Datenblatt) ab; 500 µs kann beim SG90 mechanischen Anschlag oder Überlastung verursachen.
- **Fix:** Den Minimalwert auf 600 µs korrigieren: myServo.attach(SERVO_PIN, 600, 2400);

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 3 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Analogie beschreibt den Stromfluss als 'von Drain durch den Motor zu Source', aber beim N-Kanal-MOSFET in dieser Schaltung sitzt der Motor zwischen externer Versorgung und Drain — der Strom fließt von der externen Quelle durch den Motor, dann von Drain nach Source zu GND. Die Reihenfolge in der Beschreibung ist umgekehrt.
- **Fix:** Formulierung korrigieren zu: 'Strom fließt von der externen Quelle durch den Motor, dann von Drain nach Source zu GND.'

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der ESP32 DevKit V1 liefert am 5V-Pin nur dann zuverlässig 5 V, wenn er per USB versorgt wird; der Hinweis 'USB-Versorgung reicht für den 28BYJ-48' ist zwar grundsätzlich richtig, verschweigt aber, dass der 5V-Pin des ESP32 direkt vom USB-VBUS kommt und bei Betrieb über den 3,3-V-Regulator (z. B. über den 3V3-Pin) keine 5 V liefert.
- **Fix:** Explizit darauf hinweisen, dass VCC der ULN2003-Platine an den 5V-Pin (VBUS) des ESP32 angeschlossen werden muss und nicht an den 3V3-Pin.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 4 [CODE_WALK]
- **Category:** code-bug
- **Problem:** pulseIn(ECHO_PIN, HIGH) hat ohne Timeout-Parameter einen Standard-Timeout von 1 Sekunde; liegt kein Objekt im Messbereich, blockiert die Funktion 1 Sekunde lang, was den 500-ms-Takt des loop() deutlich stört.
- **Fix:** Verwende pulseIn(ECHO_PIN, HIGH, 30000UL) um den Timeout auf 30 ms (entspricht ~5 m Reichweite) zu begrenzen und füge eine Prüfung auf duration == 0 hinzu.

### `esp32-mini-roboter` — Mini-Roboter: alles zusammen
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Für den empfohlenen Spannungsteiler am Echo-Pin (5 V → 3,3 V) werden zusätzliche Widerstände benötigt, die nicht in der Stückliste aufgeführt sind.
- **Fix:** Zwei Widerstände (z. B. 1 kΩ und 2 kΩ) für den Spannungsteiler am Echo-Pin in die BOM aufnehmen.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** Step 1 [PARTS]
- **Category:** term-order
- **Problem:** Der Begriff 'Pull-Up-Widerstand' wird in Step 1 (PARTS) verwendet, ohne dass er vorher oder an dieser Stelle erklärt wird; die Zielgruppe (9–14 Jahre) kennt diesen Begriff möglicherweise nicht.
- **Fix:** In Step 1 oder Step 2 eine kurze Erklärung ergänzen: 'Ein Pull-Up-Widerstand hält die Datenleitung auf einem definierten HIGH-Pegel, wenn kein Signal gesendet wird.'

### `esp32-bmp280-luftdruck` — Luftdruck & Höhe: dein eigenes Barometer
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** readAltitude(1013.25) berechnet die Höhe relativ zum Meeresspiegel-Referenzdruck 1013,25 hPa (ISA-Standardatmosphäre). Ohne Anpassung an den aktuellen QNH-Druck kann die angezeigte Höhe um viele Meter vom tatsächlichen Wert abweichen — das wird im Unterricht nicht erwähnt und kann Lernende irreführen.
- **Fix:** Ergänze einen Hinweis, dass 1013.25 nur ein Standardwert ist und für genaue Höhenmessung der aktuelle Luftdruck auf Meereshöhe (QNH) eingesetzt werden sollte.

### `esp32-bmp280-luftdruck` — Luftdruck & Höhe: dein eigenes Barometer
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste nennt 4× Jumper-Kabel (M/M), aber der BMP280 wird mit VCC, GND, SDA und SCL angeschlossen — das sind genau 4 Verbindungen. Viele BMP280-Breakout-Boards haben jedoch auch einen CSB- und SDO-Pin, die für den I²C-Betrieb auf feste Pegel gelegt werden müssen; diese Verbindungen fehlen in Stückliste und Verkabelungsanleitung.
- **Fix:** Weise darauf hin, dass CSB an VCC (für I²C-Modus) und SDO an GND oder VCC (zur Adresswahl 0x76/0x77) angeschlossen werden sollte, und passe die Jumper-Anzahl ggf. auf 6 an.

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 5 [SIMULATE]
- **Category:** factual-other
- **Problem:** Der Text sagt, bei Flachlage zeige 'Z etwa 9,8' — je nach Ausrichtung des GY-521-Boards kann der Wert auch negativ (~-9,8) sein, abhängig davon, welche Seite oben liegt.
- **Fix:** Ergänzen, dass Z ≈ +9,8 gilt, wenn die Oberseite des Sensors nach oben zeigt, und Z ≈ -9,8, wenn die Unterseite nach oben zeigt.

### `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste nennt 3 Jumper-Kabel (M/M), aber für die Verbindung VCC, GND und AO werden genau 3 Kabel benötigt — das stimmt zwar, jedoch ist der DO-Pin laut Schritt 3 unverbunden, was korrekt ist. Allerdings hat das YL-69-Modul typischerweise 4 Pins (VCC, GND, AO, DO), und die Platine (YL-38) ist ein separates Bauteil, das in der Stückliste nicht explizit als eigene Komponente aufgeführt ist, obwohl es im Text als 'kleine Platine' erwähnt wird — dies ist aber üblicherweise im Modul enthalten und daher akzeptabel.
- **Fix:** Kein zwingender Handlungsbedarf; ggf. klarstellen, dass 'YL-69' das Gesamtmodul (Sonden + Platine YL-38) bezeichnet.

### `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung
- **Where:** Step 2 [EXPLAIN]
- **Category:** term-order
- **Problem:** Der Begriff 'ADC' wird in Schritt 2 (EXPLAIN) im keyPoint verwendet, ohne vorher im Lesson-Text eingeführt oder erklärt worden zu sein.
- **Fix:** Entweder 'ADC' in Schritt 2 kurz erklären (z. B. 'ADC = Analog-Digital-Wandler') oder den Begriff erst in Schritt 4 (CODE_WALK) einführen, wo analogRead() erklärt wird.

### `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der 1-Wire-Bus wurde von Dallas Semiconductor entwickelt, das Unternehmen heißt jedoch korrekt 'Dallas Semiconductor' (nicht 'Dallas Semiconductors' im Plural).
- **Fix:** 'Dallas Semiconductors' zu 'Dallas Semiconductor' korrigieren.

### `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Aussage 'je negativer, desto schwächer' ist korrekt, aber die Faustregel nennt nur das 2,4-GHz-Band, obwohl der ESP32 (je nach Modell) auch 5-GHz-WLAN unterstützen kann — der Standard-ESP32 unterstützt jedoch nur 2,4 GHz, daher ist dies kein Fehler.
- **Fix:** Keine Änderung erforderlich — die Aussage ist für den Standard-ESP32 korrekt.

### `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?
- **Where:** Step 3 [CODE_WALK]
- **Category:** code-bug
- **Problem:** WiFi.scanNetworks() wird in loop() ohne asynchronen Modus aufgerufen und blockiert den Loop für mehrere Sekunden; bei einem Scan-Fehler gibt die Funktion WIFI_SCAN_FAILED (-2) oder WIFI_SCAN_RUNNING (-1) zurück, was zu einer negativen Schleifenanzahl und undefiniertem Verhalten führt.
- **Fix:** Den Rückgabewert von scanNetworks() auf negative Werte prüfen, z. B. 'if (n < 0) { Serial.println("Scan fehlgeschlagen"); return; }' vor der for-Schleife einfügen.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 5 [CODE_WALK]
- **Category:** code-bug
- **Problem:** In der colorWheel()-Funktion kann der Ausdruck 'pos * 3' bei uint8_t-Arithmetik überlaufen (z. B. pos=85 → 85*3=255, pos=86 → 258 wird zu 2), da pos als uint8_t deklariert ist und die Multiplikation in 8-Bit-Arithmetik stattfindet.
- **Fix:** Den Parameter pos in colorWheel() als uint8_t belassen, aber die Zwischenberechnungen explizit in uint16_t casten: z. B. '(uint16_t)pos * 3', um unbeabsichtigte Überläufe zu vermeiden.

---

## Per-Lesson Übersicht

- `esp32-setup` — Setup: Computer + ESP32 verbinden: clean
- `esp32-blink-led` — Eine LED zum Blinken bringen: clean
- `esp32-button-led` — Taster: LED auf Knopfdruck: 1 major · 1 minor
- `esp32-pwm-fade` — Helligkeit steuern: LED weich dimmen: clean
- `esp32-rgb-led` — RGB-LED: Farben mischen: 1 critical · 2 major · 1 minor
- `esp32-buzzer-melodie` — Buzzer: dein erstes Lied: 3 minor · 1 critical · 3 major
- `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich: 1 critical · 1 major · 1 minor
- `esp32-servo-sweep` — Servo: Bewegung steuern: 1 major · 1 critical · 1 minor
- `esp32-dc-motor` — DC-Motor: drehen mit Kraft: 2 critical · 3 major · 1 minor
- `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel: 1 critical · 1 major · 1 minor
- `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus: 2 critical · 2 major · 1 minor
- `esp32-pir-bewegung` — PIR: dein eigener Bewegungsmelder: 1 major · 1 critical
- `esp32-mini-roboter` — Mini-Roboter: alles zusammen: 1 critical · 2 major · 1 minor
- `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen: 1 major · 1 critical · 1 minor
- `esp32-bmp280-luftdruck` — Luftdruck & Höhe: dein eigenes Barometer: 1 major · 2 minor
- `esp32-ldr-lichtsensor` — Lichtsensor: dunkel ↔ hell: 2 major · 1 critical
- `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen: 1 critical · 2 major · 1 minor
- `esp32-bodenfeuchte` — Bodenfeuchte: Pflanzenwarnung: 1 major · 2 minor
- `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht: 1 critical · 2 major · 1 minor
- `esp32-wifi-scan` — WLAN scannen: Welche Netze sind in Reichweite?: 2 minor · 1 major
- `esp32-oled-display` — OLED-Display: erstes eigenes Bild: clean
- `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe: 1 critical · 2 major · 1 minor
- `esp32-mqtt-publish` — MQTT: Daten in die Welt senden: clean
- `esp32-webserver` — Webserver: dein ESP32 als Webseite: clean
- `esp32-ota-update` — OTA: drahtlos neue Firmware aufspielen: clean