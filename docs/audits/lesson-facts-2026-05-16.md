# Lesson-Fakten-Audit 2026-05-16

Model: `claude-sonnet-4-6` · Lessons: 12

**Total findings:** 33 (7 critical / 15 major / 11 minor)

## CRITICAL (7)

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Der BUILD-Schritt beschreibt eine Common-Cathode-LED (langes Bein = GND), aber der Hinweis im payload beschreibt fälschlicherweise die Common-Cathode-Variante als 'Common-Anode-LED' und gibt an, das lange Bein an 3,3 V zu hängen — das ist die Beschreibung einer Common-Anode-LED, die aber laut BOM und PARTS-Schritt gar nicht verbaut wird.
- **Fix:** Den payload-Hinweis entweder entfernen oder klar als optionalen Hinweis für den Fall kennzeichnen, dass jemand versehentlich eine Common-Anode-LED gekauft hat; die Formulierung 'das lange Bein an 3,3 V' ist für die im Unterricht verwendete Common-Cathode-LED falsch und verwirrend.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Der BUILD-Schritt nennt GPIOs 25, 26, 27, 32, 33 für die LEDs, aber der Code im CODE_WALK-Schritt verwendet LED_PINS = {16, 17, 18, 19, 21} — das sind völlig andere Pins.
- **Fix:** Entweder den BUILD-Schritt auf GPIOs 16, 17, 18, 19, 21 korrigieren oder das Array im Code auf {25, 26, 27, 32, 33} ändern, damit beides übereinstimmt.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** GPIO 17 ist beim ESP32 DevKit V1 der TX2-Pin der zweiten UART-Schnittstelle und kann beim Booten Signale ausgeben, die den Schrittmotor unkontrolliert ansteuern; zudem ist GPIO 5 ein Strapping-Pin, der beim Booten einen definierten Pegel benötigt und durch den ULN2003-Eingang beeinflusst werden kann.
- **Fix:** Ersetze GPIO 17 und GPIO 5 durch unkritische GPIOs ohne Strapping- oder UART-Funktion, z. B. GPIO 25, 26, 27, 14.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Der Text beschreibt die Verkabelungsreihenfolge als IN1→GPIO19, IN3→GPIO5, IN2→GPIO18, IN4→GPIO17, aber der Stepper-Konstruktor im Code lautet Stepper(STEPS_PER_REV, 19, 5, 18, 17), was der Arduino-Library-Konvention (Argument 1=IN1, Argument 2=IN2, Argument 3=IN3, Argument 4=IN4) entspricht — d. h. GPIO 5 wird als IN2 und GPIO 18 als IN3 behandelt, nicht wie im Text angegeben.
- **Fix:** Entweder den Text an die Library-Konvention anpassen (IN1→19, IN2→5, IN3→18, IN4→17) oder den Konstruktoraufruf so ändern, dass er die im Text beschriebene physische Verdrahtung korrekt widerspiegelt.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der im Text beschriebene Spannungsteiler verwendet 1 kΩ und 2 kΩ, während die payload denselben Teiler mit 10 kΩ und 20 kΩ beschreibt — beide Widerstandspaare sind im selben Schritt angegeben, was direkt widersprüchlich ist.
- **Fix:** Einheitlich einen Wert verwenden; empfohlen sind 10 kΩ (Echo → Mitte) und 20 kΩ (Mitte → GND), da diese den GPIO-Eingang weniger belasten.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der ESP32 DevKit V1 liefert am VIN-Pin 5 V nur dann, wenn er selbst über USB versorgt wird — der WS2812B-Streifen wird aber direkt an VIN angeschlossen, was korrekt ist. Kritischer ist jedoch: GPIO 5 ist beim ESP32 ein Strapping-Pin, der beim Booten einen definierten Pegel benötigt; ein 470-Ω-Widerstand in der Datenleitung kann den Boot-Vorgang stören, wenn der Streifen die Leitung auf Low zieht.
- **Fix:** Verwende stattdessen einen nicht-Strapping-Pin wie GPIO 16 oder GPIO 4 für den Daten-Ausgang und passe #define PIN entsprechend im Code an.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 4 [BUILD]
- **Category:** schematic-mismatch
- **Problem:** Step 4 beschreibt die Verbindung '5V an VIN des ESP32', aber der ESP32 DevKit V1 hat keinen dedizierten 5V-Ausgangspin namens VIN für externe Verbraucher — VIN ist ein Eingang für die Versorgung des Boards, kein 5V-Ausgang für den Streifen.
- **Fix:** Klarstellen, dass der 5V-Pin des Streifens an den 5V/VIN-Pin des ESP32 angeschlossen wird, der die USB-5V durchschleift, und darauf hinweisen, dass dieser Pin nur bei USB-Versorgung 5V führt.

## MAJOR (15)

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 5 [SIMULATE]
- **Category:** factual-other
- **Problem:** Der SIMULATE-Schritt behauptet, die LED zeige 'erst ein warmes Orange', aber der Code in Step 4 zeigt keine Orange-Farbe — die Sequenz ist Rot, Grün, Blau, Gelb, Türkis, Pink.
- **Fix:** Die Beschreibung im SIMULATE-Schritt an die tatsächliche Code-Sequenz anpassen: 'Die LED wechselt die Farbe: Rot, Grün, Blau, Gelb, Türkis, Pink — in einer Endlosschleife.'

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 2 [EXPLAIN]
- **Category:** term-order
- **Problem:** Im EXPLAIN-Schritt (Step 2) wird PWM mit dem Verweis 'das schnelle Ein-/Ausschalten von vorher' eingeführt, obwohl PWM in keinem vorherigen Schritt dieser Lektion erklärt oder auch nur erwähnt wurde.
- **Fix:** PWM im EXPLAIN-Schritt kurz selbst erklären (z. B. 'PWM bedeutet, den Strom sehr schnell ein- und auszuschalten, um die Helligkeit zu regeln') anstatt auf eine nicht vorhandene frühere Erklärung zu verweisen.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** Step 5 [SIMULATE]
- **Category:** code-bug
- **Problem:** Im SIMULATE-Schritt wird die Konstante 'SPEED_MS' erwähnt, die im Code aber 'STEP_MS' heißt — ein Schüler, der den Namen ändert, bekommt einen Compile-Fehler.
- **Fix:** Im SIMULATE-Schritt 'SPEED_MS' durch 'STEP_MS' ersetzen, damit der Name mit der Konstante im Code übereinstimmt.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 4 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der Schaltplan beschreibt: Motor-Minus an Drain, Motor-Plus an externe Quelle — beim IRLZ44N (N-Kanal-MOSFET) muss der Drain jedoch an der Last (Motor-Plus-Seite ist an externer Quelle korrekt), aber Source muss an GND liegen und Drain an Motor-Minus. Die Beschreibung ist korrekt für den Strompfad, jedoch fehlt der im BOM genannte Gate-Vorwiderstand (100 Ω) vollständig in der Verkabelungsanleitung.
- **Fix:** Einen 100-Ω-Widerstand zwischen GPIO 25 und Gate des MOSFET in der Verkabelungsanleitung explizit erwähnen, da er im BOM aufgeführt ist.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Der BOM listet einen 100-Ω-Gate-Vorwiderstand implizit in der Beschreibung des IRLZ44N auf ('Gate über kleinen Vorwiderstand (z.B. 100 Ω) an GPIO 25'), aber der Widerstand erscheint nicht als eigener BOM-Eintrag und wird in keinem BUILD-Schritt erwähnt.
- **Fix:** Einen eigenen BOM-Eintrag '1× Widerstand 100 Ω' hinzufügen und ihn im BUILD-Schritt in die Verkabelung aufnehmen.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 1 [PARTS]
- **Category:** bom-mismatch
- **Problem:** Der BOM gibt als externe Stromquelle einen '4×AA-Batteriehalter (ca. 6 V)' an, während Step 1 (PARTS) eine '3,7-V-LiPo oder 4×AA' empfiehlt und der Motor als '3V Mini-DC-Motor' im BOM steht — 6 V überschreiten die Nennspannung des 3-V-Motors deutlich.
- **Fix:** Entweder den Motor auf einen 3–6-V-Motor anpassen oder die Stromquelle auf 2×AA (3 V) bzw. einen 3-V-kompatiblen Batteriehalter ändern, damit die Motorspannung nicht überschritten wird.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der 28BYJ-48 hat im Half-Step-Modus 4096 Schritte pro Umdrehung und im Full-Step-Modus 2048 Schritte — die Arduino Stepper-Library verwendet jedoch standardmäßig den 4-Schritt-Full-Step-Modus, bei dem der Motor tatsächlich nur 2048 Schritte pro Umdrehung macht. Die Aussage '2048 Schritte = eine volle Umdrehung' ist für den verwendeten Modus korrekt, aber die Herleitung fehlt und kann mit verbreiteten Datenblattangaben (512 Schritte × 4 Phasen × Getriebe 1:64) verwechselt werden — dies ist jedoch vertretbar.
- **Fix:** Kein Handlungsbedarf, da 2048 Schritte im Full-Step-Modus mit der Arduino Stepper-Library korrekt ist.

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 3 [BUILD]
- **Category:** safety
- **Problem:** Der 28BYJ-48 benötigt 5 V Versorgungsspannung für die ULN2003-Platine, aber viele ESP32 DevKit V1 Boards liefern am 5V-Pin nur dann 5 V, wenn sie per USB versorgt werden — bei Batteriebetrieb fehlt diese Spannung; dies wird nicht erwähnt.
- **Fix:** Einen Hinweis ergänzen, dass der 5V-Pin nur bei USB-Versorgung aktiv ist und bei anderen Stromquellen eine separate 5V-Versorgung benötigt wird.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** bom-mismatch
- **Problem:** Der Spannungsteiler am Echo-Pin erfordert zwei Widerstände, die im BOM nicht aufgeführt sind.
- **Fix:** BOM um '2× Widerstand (10 kΩ und 20 kΩ)' ergänzen, damit Lernende die benötigten Bauteile vollständig einkaufen können.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 3 [BUILD]
- **Category:** bom-mismatch
- **Problem:** Der BOM listet nur 4 Jumper-Kabel (M/M), aber für den Spannungsteiler und die vier Sensor-Pins (VCC, GND, Trig, Echo) werden mindestens 5–6 Verbindungen benötigt.
- **Fix:** Anzahl der Jumper-Kabel im BOM auf mindestens 6 erhöhen.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Das DHT22 verwendet kein 1-Wire-Protokoll (das ist das proprietäre Dallas/Maxim-Protokoll), sondern ein eigenes, inkompatibles Single-Bus-Protokoll (auch als 'Single-Wire' oder 'DHT-Protokoll' bezeichnet).
- **Fix:** Den Begriff '1-Wire-Protokoll' durch 'Single-Bus-Protokoll' oder 'eigenes serielles Protokoll' ersetzen, um keine Verwechslung mit dem Dallas 1-Wire-Standard zu erzeugen.

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Erklärung ist physikalisch irreführend: Der Sensor zeigt ~9,8 m/s² nach oben, weil er die Reaktionskraft der Unterlage (Normalkraft) misst – nicht weil die Erdanziehung ihn nach unten zieht und das die 'Gegenkraft' sei. Ein Beschleunigungssensor im freien Fall würde 0 m/s² anzeigen.
- **Fix:** Formulierung korrigieren: 'Der Sensor misst die mechanische Stützkraft, die ihn am freien Fall hindert – diese entspricht genau der Erdbeschleunigung von ~9,8 m/s²; im freien Fall würde er 0 anzeigen.'

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 5 [SIMULATE]
- **Category:** schematic-mismatch
- **Problem:** Step 5 beschreibt, dass beim Kippen 'X auf über 5 springt', aber der Code in Step 4 wertet ausschließlich die Z-Achse aus und gibt keine X-Werte aus – X wird im Code weder gelesen noch gedruckt.
- **Fix:** Entweder den Code erweitern, um X auszuwerten und die Richtung (links/rechts) zu melden, oder die Beschreibung in Step 5 so anpassen, dass nur das Z-basierte Verhalten beschrieben wird.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 2 [SAFETY]
- **Category:** factual-other
- **Problem:** Step 2 behauptet, 8 LEDs bei voller Helligkeit ziehen 'bis zu 240 mA' — tatsächlich können WS2812B-LEDs bei voller Weiß-Helligkeit (R+G+B je 20 mA) bis zu 60 mA pro LED verbrauchen, also bis zu 480 mA für 8 LEDs, nicht 240 mA.
- **Fix:** Den Maximalstrom auf 480 mA (8 × 60 mA) korrigieren und die Empfehlung für ein externes Netzteil bereits ab 8 LEDs bei voller Helligkeit aussprechen.

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** lesson-wide
- **Category:** factual-other
- **Problem:** Die Safety-Note gibt 30 mA pro LED bei voller Helligkeit an, während der korrekte Wert für WS2812B bei vollem Weiß (alle drei Kanäle maximal) bis zu 60 mA pro LED beträgt.
- **Fix:** Den Wert in der Safety-Note auf '60 mA pro LED bei voller Helligkeit (alle drei Farben gleichzeitig)' korrigieren.

## MINOR (11)

### `esp32-rgb-led` — RGB-LED: Farben mischen
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Der EXPLAIN-Schritt beschreibt die Common-Cathode-LED mit 'das lange Bein der RGB-LED ist die Masse (GND)', aber bei einer Standard-RGB-LED mit Common Cathode ist das längste Bein tatsächlich die gemeinsame Kathode (GND) — das ist korrekt; jedoch hat eine 4-beinige RGB-LED kein eindeutig 'längeres' Bein wie eine einfache LED, da alle vier Beine ähnlich lang sind und das GND-Bein nur durch Position (zweites von links) identifiziert wird.
- **Fix:** Statt 'das lange Bein' präziser formulieren: 'das zweite Bein von links (das etwas längere oder durch Position markierte GND-Bein)' oder auf das Datenblatt der verwendeten LED verweisen.

### `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die Stückliste gibt 7 Jumper-Kabel an, aber für 5 LEDs (je 1 Kabel zur Anode) plus 1 gemeinsames GND-Kabel werden mindestens 6 Kabel benötigt — 7 ist plausibel, aber nicht begründet und könnte je nach Aufbau zu wenig sein.
- **Fix:** Jumper-Kabel-Anzahl auf 11 erhöhen (5× Anode, 5× Kathode/Widerstand zur GND-Schiene, 1× GND ESP32 zur Schiene) oder den Aufbau im BUILD-Schritt präzisieren, damit die Anzahl nachvollziehbar ist.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 3 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Analogie beschreibt den Strompfad als 'von Drain durch den Motor zu Source' — beim N-Kanal-MOSFET fließt der Strom korrekt von Drain nach Source, aber der Motor liegt zwischen externer Versorgung und Drain, nicht zwischen Drain und Source.
- **Fix:** Die Erklärung korrigieren: Strom fließt von der externen Quelle durch den Motor zu Drain, dann von Drain nach Source (GND) — der Motor liegt also zwischen Plus und Drain, nicht zwischen Drain und Source.

### `esp32-dc-motor` — DC-Motor: drehen mit Kraft
- **Where:** Step 2 [SAFETY]
- **Category:** safety
- **Problem:** Der SAFETY-Schritt gibt an, ein GPIO-Pin liefere maximal 12 mA — der ESP32-Datenblatt-Grenzwert liegt bei 40 mA pro Pin (absolutes Maximum), der empfohlene Betriebsstrom bei ca. 12 mA; die Aussage ist als Richtwert vertretbar, aber die Formulierung 'maximal 12 mA' ist technisch ungenau.
- **Fix:** Formulierung anpassen: 'Ein GPIO-Pin sollte nicht mehr als 12 mA dauerhaft liefern (absolutes Maximum 40 mA) — ein Motor braucht oft das Zehnfache oder mehr.'

### `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel
- **Where:** Step 4 [CODE_WALK]
- **Category:** factual-other
- **Problem:** Der Kommentar im Code bezeichnet den Modus als 'Full-Step', aber die Arduino Stepper-Library implementiert tatsächlich einen 4-Schritt-Sequenz-Modus, der je nach Definition als Wave-Drive oder Full-Step gilt — für Lernende ist die Bezeichnung ohne weitere Erklärung potenziell verwirrend.
- **Fix:** Den Kommentar präzisieren oder einen kurzen Hinweis ergänzen, dass die Arduino Stepper-Library eine 4-Phasen-Sequenz verwendet.

### `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus
- **Where:** Step 2 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Schallgeschwindigkeit wird mit 0,0343 cm/µs angegeben, was 343 m/s entspricht — dieser Wert gilt nur bei ca. 20 °C; für Kinder könnte der Eindruck entstehen, es sei ein fester Wert.
- **Fix:** Einen kurzen Hinweis ergänzen, dass 343 m/s die Schallgeschwindigkeit bei Raumtemperatur (~20 °C) ist und sich mit der Temperatur ändert.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** Step 3 [BUILD]
- **Category:** pin-wiring
- **Problem:** Der empfohlene Pull-Up-Widerstand für den DHT22 beträgt typischerweise 4,7 kΩ; 10 kΩ kann bei langen Leitungen oder höheren Geschwindigkeiten zu Signalproblemen führen.
- **Fix:** Den Widerstandswert auf 4,7 kΩ ändern, wie im Adafruit-Datenblatt und in der offiziellen DHT22-Dokumentation empfohlen.

### `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen
- **Where:** lesson-wide
- **Category:** bom-mismatch
- **Problem:** Die BOM listet 3× Jumper-Kabel (M/M), aber das DHT22-Modul hat 3 Pins (VCC, GND, OUT), was genau 3 Kabel erfordert — bei Verwendung des Steckbretts werden jedoch typischerweise auch M/M-Kabel für die Verbindung ESP32↔Steckbrett benötigt, sodass 3 Kabel knapp bemessen sein können.
- **Fix:** Die Anzahl der Jumper-Kabel auf mindestens 6× erhöhen, um sowohl die Sensor-Seite als auch die ESP32-Seite des Steckbretts vollständig zu verbinden.

### `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen
- **Where:** Step 3 [BUILD]
- **Category:** factual-other
- **Problem:** Die Aussage 'der ESP32-Eingang verträgt keine 5 V' ist als Begründung für die 3,3-V-Versorgung des GY-521 irreführend: Die VCC-Versorgungsleitung des Moduls ist kein Eingang des ESP32; der eigentliche Grund ist, dass der MPU-6050-Chip selbst nur 3,3 V verträgt und die I²C-Leitungen sonst auf 5-V-Pegel liegen könnten.
- **Fix:** Begründung präzisieren: 'Mit 3,3 V stellst du sicher, dass der MPU-6050-Chip nicht überspannt wird und die I²C-Signale auf ESP32-kompatiblem 3,3-V-Pegel bleiben.'

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 3 [EXPLAIN]
- **Category:** factual-other
- **Problem:** Die Beschreibung 'Daisy-Chain' ist für WS2812B nicht ganz korrekt — WS2812B verwendet ein Single-Wire-Protokoll mit integriertem Schieberegister, kein klassisches Daisy-Chain-Protokoll wie bei SPI-basierten LEDs.
- **Fix:** Die Erklärung anpassen: 'Jede LED empfängt die Daten, nimmt sich die ersten 24 Bit für sich und leitet den Rest an die nächste LED weiter — das nennt sich Kaskadierung.'

### `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe
- **Where:** Step 5 [CODE_WALK]
- **Category:** code-bug
- **Problem:** In der colorWheel-Funktion kann bei pos-Werten nahe 85 oder 170 ein Überlauf bei der Multiplikation 'pos * 3' auftreten, da pos ein uint8_t ist und pos*3 den Wertebereich von uint8_t (255) überschreiten kann, bevor die Zuweisung an strip.Color() erfolgt.
- **Fix:** pos in der Berechnung explizit nach int casten: '(int)pos * 3', um einen impliziten uint8_t-Überlauf zu vermeiden.

---

## Per-Lesson Übersicht

- `esp32-button-led` — Taster: LED auf Knopfdruck: clean
- `esp32-rgb-led` — RGB-LED: Farben mischen: 1 critical · 2 major · 1 minor
- `esp32-buzzer-melodie` — Buzzer: dein erstes Lied: clean
- `esp32-lauflicht-5leds` — Lauflicht: 5 LEDs jagen sich: 1 critical · 1 major · 1 minor
- `esp32-dc-motor` — DC-Motor: drehen mit Kraft: 3 major · 2 minor
- `esp32-stepper-motor` — Schrittmotor: präzise auf den Winkel: 2 major · 2 critical · 1 minor
- `esp32-ultraschall-abstand` — Ultraschall: messen wie eine Fledermaus: 1 critical · 2 major · 1 minor
- `esp32-mini-roboter` — Mini-Roboter: alles zusammen: clean
- `esp32-dht22-temperature` — Temperatur & Luftfeuchte messen: 1 major · 2 minor
- `esp32-mpu6050-gyro` — Gyroskop: Lage im Raum erkennen: 2 major · 1 minor
- `esp32-ds18b20-wasser` — Wassertemperatur: DS18B20 wasserdicht: clean
- `esp32-neopixel-strip` — NeoPixel: jeder LED ihre Farbe: 2 critical · 2 major · 2 minor