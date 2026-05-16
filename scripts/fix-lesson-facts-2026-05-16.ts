// Idempotente Fixes für faktische Lesson-Bugs, gefunden im Fakten-Audit
// am 2026-05-16 via `scripts/audit-lesson-facts.ts`.
//
// Alle Fixes sind re-runnable. Existierende Components/BOM/Step-Texte
// werden nur dann geändert, wenn sie noch im fehlerhaften Stand sind
// (Marker-basierte Detection).

import { PrismaClient, type LogicLevel, type LearnerLevel } from "@prisma/client";

const prisma = new PrismaClient();

type ComponentSeed = {
  slug: string;
  name: string;
  category: string;
  logicLevel: LogicLevel;
  voltageMin: number;
  voltageMax: number;
  levelHint: LearnerLevel | null;
  iconKey: string | null;
  description_de: string;
  description_en: string;
  descriptionShort_de: string;
  descriptionShort_en: string;
};

const newComponents: ComponentSeed[] = [
  {
    slug: "resistor-470ohm",
    name: "Widerstand 470 Ω",
    category: "passive",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 50,
    levelHint: "L1_BEGINNER",
    iconKey: "zap",
    description_de: "Schutz- und Vorwiderstand, 470 Ω. Wird oft als Datenleitungs-Schutz vor LEDs oder LED-Streifen geschaltet.",
    description_en: "Protection / pull resistor, 470 Ω. Often used in series with data lines feeding LEDs or LED strips.",
    descriptionShort_de: "Widerstand 470 Ω (oft als Daten-Schutzwiderstand).",
    descriptionShort_en: "470 Ω resistor (often as data-line protection).",
  },
  {
    slug: "resistor-4k7ohm",
    name: "Widerstand 4,7 kΩ",
    category: "passive",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 50,
    levelHint: "L1_BEGINNER",
    iconKey: "zap",
    description_de: "Pull-Up-Widerstand 4,7 kΩ. Standard-Wert für 1-Wire-Busse wie DS18B20.",
    description_en: "Pull-up resistor 4.7 kΩ. Standard value for 1-Wire buses like DS18B20.",
    descriptionShort_de: "4,7 kΩ — Pull-Up für 1-Wire-Sensoren.",
    descriptionShort_en: "4.7 kΩ — pull-up for 1-Wire sensors.",
  },
  {
    slug: "resistor-10k",
    name: "Widerstand 10 kΩ",
    category: "passive",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 50,
    levelHint: "L1_BEGINNER",
    iconKey: "zap",
    description_de: "Pull-Up- oder Spannungsteiler-Widerstand 10 kΩ. Standard für DHT22, LDR-Schaltungen und viele Taster-Setups.",
    description_en: "Pull-up or voltage-divider resistor 10 kΩ. Standard for DHT22, LDR circuits, and many button setups.",
    descriptionShort_de: "10 kΩ — Pull-Up für DHT22 / LDR.",
    descriptionShort_en: "10 kΩ — pull-up for DHT22 / LDR.",
  },
  {
    slug: "mosfet-irlz44n",
    name: "Logic-Level-MOSFET IRLZ44N",
    category: "actuator",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 55,
    levelHint: "L3_INTERMEDIATE",
    iconKey: "cpu",
    description_de: "N-Kanal-Logic-Level-MOSFET IRLZ44N. Schaltet Motoren und andere Verbraucher mit 3,3-V-Logiksignalen vom ESP32.",
    description_en: "N-channel logic-level MOSFET IRLZ44N. Drives motors and other loads from 3.3 V logic signals (ESP32-friendly).",
    descriptionShort_de: "Logic-Level-MOSFET zum Schalten von Motoren.",
    descriptionShort_en: "Logic-level MOSFET to switch motor loads.",
  },
  {
    slug: "diode-1n4007",
    name: "Freilaufdiode 1N4007",
    category: "passive",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 1000,
    levelHint: "L3_INTERMEDIATE",
    iconKey: "shield",
    description_de: "Freilaufdiode 1N4007. Schützt Schalttransistor und ESP32 vor Spannungsspitzen beim Abschalten induktiver Lasten wie DC-Motoren.",
    description_en: "Flyback diode 1N4007. Protects the switching transistor and ESP32 from voltage spikes when an inductive load like a DC motor is turned off.",
    descriptionShort_de: "Freilaufdiode für Motor-Schaltungen.",
    descriptionShort_en: "Flyback diode for motor circuits.",
  },
  {
    slug: "battery-holder-4xaa",
    name: "Batteriehalter 4×AA",
    category: "power",
    logicLevel: "BOTH",
    voltageMin: 0,
    voltageMax: 6,
    levelHint: "L1_BEGINNER",
    iconKey: "battery",
    description_de: "Batteriehalter für 4×AA, liefert ca. 6 V — als externe Stromquelle für Motoren oder LED-Streifen geeignet.",
    description_en: "4×AA battery holder, delivers roughly 6 V — suitable as an external supply for motors or LED strips.",
    descriptionShort_de: "4×AA-Halter, ca. 6 V externe Versorgung.",
    descriptionShort_en: "4×AA holder, ~6 V external supply.",
  },
];

async function ensureComponent(c: ComponentSeed): Promise<"created" | "exists"> {
  const existing = await prisma.component.findUnique({ where: { slug: c.slug } });
  if (existing) return "exists";
  await prisma.component.create({ data: c });
  return "created";
}

type Patch = {
  lessonSlug: string;
  sortOrder: number;
  expectsMarker?: string;
  title_de?: string;
  title_en?: string;
  body_de?: string;
  body_en?: string;
  payload?: unknown;
  reason: string;
};

const patches: Patch[] = [
  // esp32-blink-led Step 5 (MAJOR pin-wiring):
  {
    lessonSlug: "esp32-blink-led",
    sortOrder: 5,
    expectsMarker: "überbrückt der Widerstand zwei verschiedene Spalten",
    body_de:
      "Schau im Bild auf den gelb pulsierenden Punkt: das ist Reihe c, Spalte 4. Steck dort ein Beinchen des Widerstands rein. Das andere Beinchen steckst du in Reihe c, Spalte 7. So überbrückt der Widerstand zwei verschiedene Spalten — der Strom MUSS durch den Widerstand fließen, um von Spalte 4 nach Spalte 7 zu kommen. Das grüne Kabel verbindet GPIO 2 mit dem linken Beinchen (Spalte 4).",
    body_en:
      "Look at the yellow pulsing dot in the picture: that's row c, column 4. Plug one leg of the resistor in there. The other leg goes into row c, column 7. The resistor now bridges two DIFFERENT columns — current MUST flow through the resistor to get from column 4 to column 7. The green wire connects GPIO 2 to the left leg (column 4).",
    reason: "Behauptung 'derselben kurzen Spalte' war falsch — c4 und c7 sind verschiedene Spalten.",
  },
  // esp32-blink-led Step 7 (CRITICAL schematic-mismatch):
  {
    lessonSlug: "esp32-blink-led",
    sortOrder: 7,
    expectsMarker: "Kabel A — von der LED zur Minus-Schiene",
    title_de: "Schritt 3: Zwei GND-Kabel",
    title_en: "Step 3: Two GND wires",
    body_de:
      "Jetzt fehlen zwei Verbindungen — beide gehen zur blauen Minus-Schiene unten.\n\n**Kabel A — von der LED zur Minus-Schiene:** Nimm ein Jumper-Kabel. Ein Ende kommt in Reihe a, Spalte 9 (also die gleiche Spalte wie das kurze LED-Beinchen). Das andere Ende in die blaue Minus-Schiene ganz unten. Damit ist die LED-Kathode mit Minus verbunden.\n\n**Kabel B — vom ESP32 zur Minus-Schiene:** Nimm ein zweites Jumper-Kabel. Ein Ende an den GND-Pin am ESP32. Das andere Ende in irgendein Loch derselben blauen Minus-Schiene.\n\nJetzt fließt der Strom: GPIO 2 → Widerstand → langes LED-Beinchen → kurzes LED-Beinchen → Kabel A → Minus-Schiene → Kabel B → GND. Stromkreis geschlossen.",
    body_en:
      "Two connections are still missing — both go to the blue minus rail at the bottom.\n\n**Wire A — from the LED to the minus rail:** Grab a jumper wire. One end in row a, column 9 (the same column as the LED's short leg). The other end in the blue minus rail at the bottom. The LED cathode is now connected to minus.\n\n**Wire B — from the ESP32 to the minus rail:** Grab a second jumper wire. One end on the GND pin of the ESP32. The other end in any hole of the same blue minus rail.\n\nNow current flows: GPIO 2 → resistor → long LED leg → short LED leg → wire A → minus rail → wire B → GND. Circuit closed.",
    reason: "Step 7 hatte keine Verbindung von LED-Kathode (a9) zur Minus-Schiene — Schaltkreis war offen.",
  },
  // esp32-buzzer-melodie Step 5 (MAJOR schematic-mismatch):
  // body sprach von melody[], Code-Array heißt frequenzen[].
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 5,
    expectsMarker: "frequenzen[]",
    reason: "melody[] → frequenzen[] (Text-Code-Konsistenz in SIMULATE).",
  },
  // esp32-buzzer-melodie Step 7 (MAJOR schematic-mismatch): selbe Korrektur.
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 7,
    expectsMarker: "frequenzen[]",
    reason: "melody[] → frequenzen[] (Text-Code-Konsistenz in CELEBRATE).",
  },
  // Round 2 — esp32-stepper-motor Step 3 (CRITICAL pin-wiring + schematic-mismatch):
  // 1) GPIO 5 ist Strapping-Pin, GPIO 17 ist UART2-TX → Wechsel auf {14, 25, 26, 27}.
  // 2) Pin-Belegung als benannte Konstanten + explizit dokumentierter 28BYJ-48-Quirk.
  {
    lessonSlug: "esp32-stepper-motor",
    sortOrder: 3,
    expectsMarker: "IN1 → GPIO 14",
    body_de:
      "Steck den ULN2003-Treiber zwischen ESP32 und Motor. Verkabele die ULN2003-Platine **natürlich der Reihe nach**:\n- **IN1 → GPIO 14**\n- **IN2 → GPIO 25**\n- **IN3 → GPIO 26**\n- **IN4 → GPIO 27**\n\nVCC der Platine an den **5V-Pin** des ESP32 (kommt vom USB), GND der Platine an GND des ESP32. Den weißen Motorstecker auf die Platine — er passt nur in einer Richtung.\n\nWir nutzen bewusst GPIO 14/25/26/27, weil das vom ESP32-Bootloader unkritische Pins sind (kein Strapping, kein UART). Damit ruckelt der Motor beim Reset nicht.\n\nIm Code-Schritt siehst du, warum wir die Pins als benannte Konstanten `IN1_PIN`–`IN4_PIN` führen: die Arduino Stepper-Library bekommt sie in der Spulen-Reihenfolge IN1, IN3, IN2, IN4 — das ist eine gut dokumentierte Eigenheit des 28BYJ-48.",
    body_en:
      "Plug the ULN2003 driver between the ESP32 and the motor. Wire the ULN2003 board **straight through**:\n- **IN1 → GPIO 14**\n- **IN2 → GPIO 25**\n- **IN3 → GPIO 26**\n- **IN4 → GPIO 27**\n\nVCC of the board to the ESP32's **5V pin** (sourced from USB), GND of the board to ESP32 GND. The white motor connector fits onto the board only one way.\n\nWe deliberately pick GPIO 14/25/26/27 because those are bootloader-safe (no strapping pin, no UART). The motor won't jitter on reset.\n\nIn the code step you'll see why we keep the pins as named constants `IN1_PIN`–`IN4_PIN`: the Arduino Stepper library receives them in the coil order IN1, IN3, IN2, IN4 — a well-documented quirk of the 28BYJ-48.",
    reason: "Pin-Wechsel auf bootloader-sichere GPIOs + benannte Konstanten lösen Strapping- und Library-Konventions-Widerspruch in einem Schritt.",
  },
  // esp32-ultraschall-abstand Step 3 (CRITICAL pin-wiring):
  // 5V-Pin am ESP32 DevKit kommt von USB-VBUS — Schüler muss das wissen,
  // sonst funktioniert HC-SR04 bei alternativer Versorgung nicht.
  {
    lessonSlug: "esp32-ultraschall-abstand",
    sortOrder: 3,
    expectsMarker: "USB-Anschluss versorgt wird",
    body_de:
      "Steck Trig an GPIO 5, Echo an GPIO 18, VCC an den **5V-Pin** des ESP32 (nicht 3,3 V!) und GND an GND.\n\n**Wichtig zu 5 V:** Der 5V-Pin des ESP32 DevKit liefert nur dann 5 V, wenn der ESP32 über den **USB-Anschluss versorgt wird** — daher beim Testen immer per USB anstecken. Bei einer Akku-Versorgung über 3V3 funktioniert der HC-SR04 nicht.\n\n**Wichtig zum Echo-Pin:** Der HC-SR04 gibt am Echo-Pin **5 V** aus, der ESP32-GPIO verträgt aber nur **3,3 V**. Ohne Schutz kann das den Pin auf Dauer beschädigen. Sicher: ein Spannungsteiler aus zwei Widerständen direkt am Echo-Ausgang — z. B. **1 kΩ** (Echo → Mittelabgriff) und **2 kΩ** (Mittelabgriff → GND), der Mittelabgriff geht an GPIO 18. Das macht aus 5 V saubere 3,33 V.",
    body_en:
      "Wire Trig to GPIO 5, Echo to GPIO 18, VCC to the **5V pin** of the ESP32 (not 3.3 V!) and GND to GND.\n\n**About 5 V:** The ESP32 DevKit's 5V pin only delivers 5 V when the board is powered via **USB** — keep it plugged in while testing. On a battery feeding the 3V3 input the HC-SR04 won't work.\n\n**About the Echo pin:** The HC-SR04 outputs **5 V** on the Echo pin, but ESP32 GPIOs are only **3.3 V** tolerant. Without protection that can damage the pin over time. Safe wiring: a voltage divider at the Echo output — e.g. **1 kΩ** (Echo → middle node) and **2 kΩ** (middle node → GND), the middle node goes to GPIO 18. That brings 5 V down to a clean 3.33 V.",
    reason: "5V-Pin-Quirk und Echo-Pin-Pegelproblem waren nicht erklärt — Schüler hätten den ESP32-Pin riskieren oder gar keine Messung bekommen können.",
  },
  // Round 2 — esp32-rgb-led Step 5 SIMULATE (MAJOR factual): body widersprach Code-Farbfolge.
  {
    lessonSlug: "esp32-rgb-led",
    sortOrder: 5,
    expectsMarker: "Rot, Grün, Blau, Gelb, Türkis, Pink",
    body_de:
      "Die LED wechselt alle 0,8 Sekunden die Farbe: Rot, Grün, Blau, Gelb, Türkis, Pink — in einer Endlosschleife. Wenn deine LED die falschen Farben zeigt, prüf nochmal Step 3 (Pin-Reihenfolge R/G/B).",
    body_en:
      "The LED changes color every 0.8 s: Red, Green, Blue, Yellow, Teal, Pink — in an endless loop. If your LED shows the wrong colors, double-check the R/G/B pin order from Step 3.",
    reason: "SIMULATE-Beschreibung passte nicht zur Code-Farbsequenz (alt: Orange/Türkis/Magenta — Code hat 6 andere Farben).",
  },
  // Round 2 — esp32-lauflicht-5leds Step 3 BUILD-Hinweis bleibt — die Code-PINS müssen
  // zum BUILD-Text passen. Wir behalten die echten Hardware-Pins 25,26,27,32,33,
  // die der BUILD-Text nennt; Code-Patch unten ersetzt {16,17,18,19,21}.
  // Step 3 body braucht nur einen Hinweis zum Strom-Limit:
  {
    lessonSlug: "esp32-lauflicht-5leds",
    sortOrder: 3,
    expectsMarker: "GPIO 25, 26, 27, 32, 33",
    body_de:
      "Baue fünf identische Mini-Schaltungen nebeneinander auf dem Steckbrett:\n1. LED-Anode (langes Bein) an GPIO 25, 26, 27, 32, 33 — je eine pro LED.\n2. LED-Kathode (kurzes Bein) an einen 220-Ω-Widerstand.\n3. Anderes Ende des Widerstands an die GND-Schiene des Steckbretts.\n\nEin einziges Jumper-Kabel verbindet die GND-Schiene mit einem GND-Pin am ESP32 — eine Masse für alle fünf LEDs reicht.",
    body_en:
      "Build five identical mini-circuits side by side on the breadboard:\n1. LED anode (long leg) to GPIO 25, 26, 27, 32, 33 — one per LED.\n2. LED cathode (short leg) to a 220 Ω resistor.\n3. The other end of the resistor to the breadboard's GND rail.\n\nOne single jumper wire connects the GND rail to a GND pin on the ESP32 — a single ground works for all five LEDs.",
    reason: "Body klarer formulieren: GND-Schiene als zentrale Sammelschiene, ein Jumper reicht.",
  },
  // Round 3 — esp32-bodenfeuchte Step 1 (MAJOR factual): "Zinksonden" → Edelstahl.
  {
    lessonSlug: "esp32-bodenfeuchte",
    sortOrder: 1,
    expectsMarker: "Edelstahlsonden",
    body_de:
      "Wir nutzen das YL-69-Modul — bestehend aus zwei Edelstahlsonden und einer kleinen Treiberplatine (YL-38) mit analogem Ausgang. Ähnliche Module funktionieren genauso.",
    body_en:
      "We're using the YL-69 module — two stainless-steel probes plus a small driver board (YL-38) with an analog output. Similar modules work the same way.",
    reason: "YL-69 hat Edelstahl- (nicht Zink-) Sonden + YL-38-Treiberplatine korrekt benannt.",
  },
  // Round 3 — esp32-dc-motor Step 2 SAFETY (MAJOR factual): 12mA absolut max ist falsch.
  {
    lessonSlug: "esp32-dc-motor",
    sortOrder: 2,
    expectsMarker: "dauerhaft empfohlene 12 mA",
    body_de:
      "Ein GPIO-Pin des ESP32 sollte dauerhaft nicht mehr als 12 mA liefern (absolutes Maximum laut Datenblatt: 40 mA). Ein Motor braucht oft das Zehnfache der dauerhaft empfohlene 12 mA — der Pin würde sofort heiß werden und ausfallen. Deshalb schaltet der MOSFET den großen Motorstrom — der ESP32 steuert nur das Gate mit wenigen mA.",
    body_en:
      "An ESP32 GPIO pin should continuously supply no more than 12 mA (absolute max per datasheet: 40 mA). A motor often needs ten times the recommended 12 mA — the pin would heat up and fail. That's why the MOSFET switches the big motor current — the ESP32 only drives the gate with a few mA.",
    reason: "12mA war als 'absolutes Max' formuliert — ist aber Dauerempfehlung; absolutes Max 40 mA.",
  },
  // Round 3 — esp32-dc-motor Step 0 INTRO (MAJOR term-order): PWM wird benutzt
  // bevor es in Step 3 erklärt wird.
  {
    lessonSlug: "esp32-dc-motor",
    sortOrder: 0,
    expectsMarker: "schnellem Ein-/Ausschalten",
    body_de:
      "Dein ESP32 fährt einen DC-Motor sanft hoch, hält ihn kurz auf Vollgas — und bremst ihn wieder ab. Das geht mit ganz schnellem Ein-/Ausschalten des Stroms (Details kommen gleich in Step 3); geschaltet wird sicher über einen MOSFET.",
    body_en:
      "Your ESP32 ramps a DC motor up smoothly, holds full speed for a moment, then ramps it back down. That works by switching the current on and off very fast (we'll explain it in Step 3); the actual switching is done safely through a MOSFET.",
    reason: "PWM-Begriff war im INTRO benutzt vor Erklärung in Step 3 — durch Plain-Sprache ersetzt.",
  },
  // Round 3 — esp32-mpu6050-gyro Step 2 EXPLAIN (MAJOR factual): Beschleunigungs-Physik.
  {
    lessonSlug: "esp32-mpu6050-gyro",
    sortOrder: 2,
    expectsMarker: "Stützfläche (Normalkraft)",
    body_de:
      "DOF steht für „Degrees of Freedom“ — Freiheitsgrade. Drei davon messen Beschleunigung: vorwärts/rückwärts, links/rechts und hoch/runter. Die anderen drei messen Drehung um jede dieser Achsen.\n\nWichtig zu wissen: Ein MEMS-Beschleunigungssensor misst NICHT die Schwerkraft direkt, sondern die mechanische Gegenkraft seiner Stützfläche (Normalkraft). Liegt der Sensor flach auf dem Tisch, drückt der Tisch ihn nach oben mit ~9,8 m/s² — deshalb zeigt die Z-Achse +9,8 m/s² nach oben, obwohl die Schwerkraft eigentlich nach unten zieht.",
    body_en:
      "DOF stands for \"degrees of freedom.\" Three of them measure acceleration: forward/back, left/right, up/down. The other three measure rotation around each of those axes.\n\nWorth knowing: a MEMS accelerometer does NOT measure gravity directly. It measures the mechanical counter-force of its support (the normal force). When the sensor lies flat on the table, the table pushes it up at ~9.8 m/s² — that's why Z reads +9.8 m/s² upwards, even though gravity itself pulls down.",
    reason: "Schwerkraft-Gegenkraft-Vermischung korrigiert: Sensor misst Normalkraft.",
  },
  // Round 3 — esp32-mpu6050-gyro Step 3 (MAJOR schematic-mismatch): 5V-Warnung präziser.
  {
    lessonSlug: "esp32-mpu6050-gyro",
    sortOrder: 3,
    expectsMarker: "MPU-6050-Chip max. 3,46 V VDD",
    body_de:
      "VCC des Moduls an 3,3 V, GND an GND, SCL an GPIO 22, SDA an GPIO 21 — das sind die Standard-I²C-Pins des ESP32.\n\n**Wichtig zum Strom:** Der MPU-6050-Chip selbst verträgt am VDD max. 3,46 V (Datenblatt). Das GY-521-Breakout-Board hat zwar einen eigenen 3,3-V-Regler und vertragt deshalb auch 5 V am VCC-Pin — sicherer ist aber 3,3 V, weil dann der Chip auch im Fehlerfall (z. B. Regler defekt) nicht überspannt wird.",
    body_en:
      "Module VCC to 3.3 V, GND to GND, SCL to GPIO 22, SDA to GPIO 21 — those are the standard I²C pins on the ESP32.\n\n**About the supply:** the MPU-6050 chip itself tolerates max. 3.46 V VDD per datasheet. The GY-521 breakout has its own 3.3 V regulator and can also take 5 V on VCC, but 3.3 V is safer — even if the regulator ever fails, the chip can't be over-volted.",
    reason: "5V-Warnung präzisiert: Chip selbst max 3,46 V (Datenblatt), GY-521-Board hat Regler.",
  },
  // Round 3 — esp32-dht22-temperature Step 2 EXPLAIN (MAJOR factual): nicht 1-Wire.
  {
    lessonSlug: "esp32-dht22-temperature",
    sortOrder: 2,
    expectsMarker: "Single-Bus-Protokoll von Aosong",
    body_de:
      "Der DHT22 nutzt ein eigenes Single-Bus-Protokoll von Aosong — also EIN Datendraht, im Mikrosekundentakt geht eine Folge aus High/Low durch. Das ist NICHT dasselbe wie der „1-Wire-Bus“ von Dallas (DS18B20 nutzt den): nur der Daten-Pin-Aufbau sieht ähnlich aus. Die DHT-Library übersetzt die Bit-Folge automatisch in Temperatur und Luftfeuchte — du musst das nicht selbst programmieren.",
    body_en:
      "The DHT22 uses its own single-bus protocol by Aosong — one data wire, with high/low pulses at microsecond timing. This is NOT the same as the \"1-Wire bus\" from Dallas (used by the DS18B20): only the single-pin layout looks similar. The DHT library decodes the bit stream into temperature and humidity for you — you don't need to write that yourself.",
    reason: "DHT22 nutzt proprietäres Aosong-Single-Bus, nicht Dallas-1-Wire — Begriffsverwechslung gefixt.",
  },
  // Round 3 — esp32-ds18b20-wasser Step 2 EXPLAIN (MAJOR term-order): Pull-Up vor Erklärung.
  {
    lessonSlug: "esp32-ds18b20-wasser",
    sortOrder: 2,
    expectsMarker: "Pull-Up-Widerstand hält die Datenleitung",
    body_de:
      "1-Wire ist ein Protokoll von Dallas Semiconductor: viele Sensoren teilen sich EINE Datenleitung. Jeder Sensor hat eine einmalige ID — der ESP32 spricht sie einzeln an.\n\n**Was ist ein Pull-Up-Widerstand?** Ein Widerstand zwischen Datenleitung und VCC (also +3,3 V). Er hält die Leitung auf einem definierten HIGH-Pegel, wenn gerade niemand „spricht“ — sonst hängt die Leitung in der Luft und der Bus funktioniert nicht. Für 1-Wire ist 4,7 kΩ der Standard-Wert.",
    body_en:
      "1-Wire is a protocol from Dallas Semiconductor: several sensors share ONE data line. Every sensor has a unique ID — the ESP32 talks to each one individually.\n\n**What's a pull-up resistor?** A resistor between the data line and VCC (i.e. +3.3 V). It holds the line at a defined HIGH level when nobody is currently \"talking\" — otherwise the line floats and the bus stops working. 4.7 kΩ is the standard pull-up value for 1-Wire.",
    reason: "Pull-Up-Begriff war vor Erklärung benutzt; jetzt direkt am Ort eingeführt. Auch 'Dallas Semiconductors' → 'Dallas Semiconductor' (singular korrekt).",
  },
  // Round 3 — esp32-ds18b20-wasser Step 3 (MAJOR pin-wiring): "5kΩ funktioniert einwandfrei" abschwächen.
  {
    lessonSlug: "esp32-ds18b20-wasser",
    sortOrder: 3,
    expectsMarker: "4,7-kΩ-Widerstand als Pflicht",
    body_de:
      "Rotes Kabel des Fühlers an 3,3 V, schwarzes Kabel an GND, gelbes (Daten-)Kabel an GPIO 4. Jetzt der wichtige Part: einen **4,7-kΩ-Widerstand als Pflicht** zwischen GPIO 4 und 3,3 V ins Breadboard stecken.\n\nKein 4,7 kΩ zur Hand? Zwei 10-kΩ-Widerstände parallel ergeben rechnerisch 5 kΩ — das funktioniert für kurze Kabel und einen einzelnen Sensor, ist aber nicht ideal. Bei langen Kabeln oder mehreren Sensoren am Bus brauchst du den richtigen Wert.",
    body_en:
      "Probe red wire to 3.3 V, black wire to GND, yellow (data) wire to GPIO 4. Now the critical part: a **mandatory 4.7 kΩ resistor** between GPIO 4 and 3.3 V on the breadboard.\n\nNo 4.7 kΩ on hand? Two 10 kΩ resistors in parallel give you ~5 kΩ — works for short cables and a single sensor, but isn't ideal. With long cables or multiple sensors on the bus, use the proper value.",
    reason: "Aussage '5 kΩ funktioniert einwandfrei' war zu sorglos — abgeschwächt mit Bedingungen.",
  },
  // Round 3 — esp32-neopixel-strip Step 2 SAFETY (MAJOR safety): 30 → 60 mA pro LED.
  {
    lessonSlug: "esp32-neopixel-strip",
    sortOrder: 2,
    expectsMarker: "60 mA pro LED",
    body_de:
      "Bei VOLLER weißer Helligkeit zieht jede WS2812B-LED bis zu 60 mA (20 mA pro Farbkanal × 3). Acht LEDs auf voller weißer Helligkeit wären also bis zu 480 mA — mehr als ein normaler USB-Port liefert.\n\nDeshalb begrenzen wir im Code die Helligkeit auf 50/255 (ca. 20 %). Damit liegen wir bei rund 96 mA für 8 LEDs — locker im USB-Limit. Für größere Streifen oder dauerhaften Vollast-Betrieb brauchst du ein eigenes 5V-Netzteil.",
    body_en:
      "At FULL white brightness each WS2812B LED can draw up to 60 mA (20 mA per color channel × 3). Eight LEDs at full white would be up to 480 mA — more than a standard USB port can supply.\n\nThat's why the code caps brightness at 50/255 (~20 %). With that we land around 96 mA for 8 LEDs — comfortably within USB limits. For longer strips or sustained full brightness you'll want a dedicated 5 V power supply.",
    reason: "30 mA pro LED gilt nur für eine Farbe; bei weiß sind es 60 mA — Safety-Note korrigiert.",
  },
  // Round 3 — esp32-servo-sweep Step 3 (MAJOR pin-wiring): orange-gelb-Verwirrung.
  {
    lessonSlug: "esp32-servo-sweep",
    sortOrder: 3,
    expectsMarker: "orange (manchmal gelb)",
    body_de:
      "Der Servo hat drei Adern: braun = GND (Minus), rot = 5 V, orange (manchmal gelb) = Signal. So verbindest du es: Braun → GND am ESP32, Rot → 5V am ESP32 (oder externe 5V), orange/gelb → Pin GPIO 18 am ESP32.\n\n**Wichtig zum 5V-Pin:** Der 5V-Pin des ESP32 DevKit V1 ist direkt mit USB-VBUS verbunden — er liefert nur dann 5 V, wenn der ESP32 per USB angesteckt ist. Bei kleinen Servos wie dem SG90 reicht das für Tests; bei mehr Last oder gleichzeitiger Last (z. B. Roboter mit Sensor) lieber eine externe 5V-Quelle nutzen.\n\nGPIO ist nur ein anderes Wort für „programmierbarer Anschluss“ — also ein Pin, den du im Code ansteuern kannst.",
    body_en:
      "The servo has three wires: brown = GND (minus), red = 5 V, orange (sometimes yellow) = signal. Wiring: Brown → GND on the ESP32, Red → 5V on the ESP32 (or external 5 V), orange/yellow → GPIO 18 on the ESP32.\n\n**About the 5V pin:** the ESP32 DevKit V1's 5V pin is wired directly to USB-VBUS — it only delivers 5 V while the ESP32 is plugged into USB. For small servos like the SG90 that's fine for testing; for heavier loads or combined loads (e.g. a robot with sensor) use an external 5 V supply.\n\nGPIO is just another word for \"programmable pin\" — a pin you can drive from code.",
    reason: "SG90-Signaldraht ist primär orange (gelb nur fallweise) + 5V-Pin-Quirk + erweiterte 5V-Quelle erklärt.",
  },
  // Round 3 — esp32-stepper-motor Step 2 EXPLAIN (MAJOR factual): Half/Full-Step.
  {
    lessonSlug: "esp32-stepper-motor",
    sortOrder: 2,
    expectsMarker: "Half-Step-Modus mit 2048",
    body_de:
      "Ein normaler Motor dreht einfach durch. Ein Schrittmotor hat drinnen mehrere Elektromagnete. Die werden nacheinander angesteuert — so „klickt“ sich die Welle Schritt für Schritt weiter.\n\nDie Standard-Arduino-Stepper-Library steuert den 28BYJ-48 im **Half-Step-Modus mit 2048 Schritten pro Umdrehung** an. Das heißt: 512 Schritte = 90°. Kein Messen nötig — du zählst einfach. (Beim reinen Full-Step wären es 1024 Schritte pro Umdrehung, aber die Standard-Library macht's automatisch in Halbschritten.)",
    body_en:
      "A regular motor just spins. A stepper motor has several electromagnets inside, energized one after the other — that's how the shaft \"clicks\" forward step by step.\n\nThe standard Arduino Stepper library drives the 28BYJ-48 in **half-step mode at 2048 steps per revolution**. That means: 512 steps = 90°. No measuring needed — just count. (Pure full-step would be 1024 steps per turn, but the standard library does it in half steps automatically.)",
    reason: "Half-Step-Modus jetzt explizit benannt (2048 stimmt nur in Half-Step).",
  },
  // Round 3 — esp32-rgb-led Step 2 EXPLAIN (MAJOR term-order): PWM "von vorher" ohne vorher.
  {
    lessonSlug: "esp32-rgb-led",
    sortOrder: 2,
    expectsMarker: "PWM bedeutet: wir schalten",
    body_de:
      "Eine RGB-LED kombiniert drei farbige LEDs in einem Gehäuse: Rot, Grün, Blau. Wenn du alle drei in unterschiedlicher Stärke leuchten lässt, mischt sich die Farbe — wie bei Wasserfarben.\n\nDie Stärke regeln wir mit PWM. **PWM bedeutet: wir schalten den Pin ganz schnell ein und aus** (in dieser Lesson 5000 mal pro Sekunde). Das Auge sieht keine Blitze, sondern eine mittlere Helligkeit — je länger pro Periode „an“, desto heller die LED. Pro Farbkanal nehmen wir einen eigenen GPIO und eine eigene PWM-Stufe.",
    body_en:
      "An RGB LED combines three colored LEDs in one package: red, green, blue. Drive each at a different intensity and they mix — like watercolor paints.\n\nWe control intensity with PWM. **PWM means: we switch the pin on and off very fast** (5000 times per second in this lesson). The eye doesn't see the flicker — it sees an average brightness. Longer \"on\" per cycle = brighter LED. One GPIO and one PWM channel per color.",
    reason: "PWM 'von vorher' war Rückverweis ohne Vorher — durch Direkterklärung ersetzt.",
  },
  // Round 1 — esp32-mini-roboter Step 3 (CRITICAL pin-wiring):
  // Echo-Pegelproblematik wie Ultraschall-Lesson.
  {
    lessonSlug: "esp32-mini-roboter",
    sortOrder: 3,
    expectsMarker: "Spannungsteiler aus 1 kΩ und 2 kΩ",
    body_de:
      "Wir kombinieren die Schaltungen aus der Motor-Lesson und der Ultraschall-Lesson.\n\n**Ultraschall (Augen):** Trig → GPIO 5, Echo über einen **Spannungsteiler aus 1 kΩ und 2 kΩ** → GPIO 18 (siehe Ultraschall-Lesson, der Teiler ist Pflicht — Echo liefert 5 V, GPIO verträgt 3,3 V). VCC an 5V des ESP32 (USB!), GND an GND.\n\n**Motor (Beine):** MOSFET-Schaltung wie in der DC-Motor-Lesson. Gate an GPIO 25 (über 100 Ω-Gate-Vorwiderstand), Drain an Motor-Minus, Source an GND. Freilaufdiode 1N4007 parallel zum Motor (Kathode an Motor-Plus). Motor-Plus an externe 6V-Batterie, Batterie-Minus an gemeinsames GND mit ESP32.\n\n**Wichtig:** Beide GND-Schienen (USB und Batterie) müssen verbunden sein, sonst kennt der ESP32 keinen Bezugspunkt zum Motorstrom.",
    body_en:
      "We combine the wiring from the motor and the ultrasonic lessons.\n\n**Ultrasonic (eyes):** Trig → GPIO 5, Echo via a **1 kΩ / 2 kΩ voltage divider** → GPIO 18 (see the ultrasonic lesson — the divider is mandatory: Echo outputs 5 V, the GPIO only tolerates 3.3 V). VCC to the ESP32's 5V pin (USB!), GND to GND.\n\n**Motor (legs):** Same MOSFET wiring as in the DC motor lesson. Gate to GPIO 25 (through a 100 Ω gate resistor), Drain to motor minus, Source to GND. 1N4007 flyback diode in parallel with the motor (cathode to motor plus). Motor plus to the external 6 V battery, battery minus to the same common GND as the ESP32.\n\n**Important:** Both GND rails (USB and battery) must be tied together, otherwise the ESP32 has no reference for the motor current.",
    reason: "Echo-Pin direkt an GPIO ohne Pegelwandler war potenziell pin-zerstörend.",
  },
];

// Globale Text-Such-Ersetzungen pro Lesson — werden zusätzlich zu den
// gezielten Patches gefahren. Idempotent über String-Suche.
type GlobalReplace = {
  lessonSlug: string;
  sortOrder: number;
  searches: Array<{ from: string; to: string }>;
  reason: string;
};

const globalReplaces: GlobalReplace[] = [
  // Round 2 — neopixel Step 4 BUILD body: GPIO 5 → GPIO 4 + 5V/VIN-Klärung.
  {
    lessonSlug: "esp32-neopixel-strip",
    sortOrder: 4,
    searches: [
      {
        from: "Streifen-Kabel 5V an VIN des ESP32, GND an GND, DIN über einen 470-Ω-Widerstand an GPIO 5. Den Widerstand einfach ins Breadboard stecken, direkt in der Datenleitung.",
        to: "Streifen-Kabel 5V an den **5V/VIN-Pin** des ESP32 (der schleift USB-5V durch — nur bei USB-Versorgung also wirklich 5 V), GND an GND, DIN über einen 470-Ω-Widerstand an **GPIO 4**. Den Widerstand einfach ins Breadboard stecken, direkt in der Datenleitung. Wir nehmen GPIO 4 statt GPIO 5, weil GPIO 5 ein Strapping-Pin ist und beim Reset Boot-Geflacker verursachen kann.",
      },
      {
        from: "Strip cable 5V to VIN on the ESP32, GND to GND, DIN through a 470 Ω resistor to GPIO 5. Push the resistor into the breadboard directly in the data line.",
        to: "Strip 5V to the ESP32's **5V/VIN pin** (it passes USB-5V through — so only really 5 V when USB-powered), GND to GND, DIN via a 470 Ω resistor to **GPIO 4**. Slot the resistor straight into the breadboard, in the data line. We use GPIO 4 instead of GPIO 5 — GPIO 5 is a strapping pin and can cause boot flicker on reset.",
      },
    ],
    reason: "GPIO 5 (Strapping) → GPIO 4 + 5V/VIN-Pin als USB-pass-through klar formuliert.",
  },
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 5,
    searches: [
      { from: "melody[]", to: "frequenzen[]" },
      { from: "Melody[]", to: "frequenzen[]" },
    ],
    reason: "melody[] → frequenzen[] in SIMULATE",
  },
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 7,
    searches: [
      { from: "melody[]", to: "frequenzen[]" },
      { from: "Melody[]", to: "frequenzen[]" },
    ],
    reason: "melody[] → frequenzen[] in CELEBRATE",
  },
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 6,
    searches: [
      { from: "524 Hz", to: "523 Hz" },
      { from: "524Hz", to: "523Hz" },
    ],
    reason: "C5 ist 523 Hz (gerundet), nicht 524 Hz",
  },
];

// Code-Snippet-Patches — ersetzen das `code`-Feld in der step.payload-JSON.
type PayloadReplace = {
  lessonSlug: string;
  sortOrder: number;
  searches: Array<{ from: string; to: string }>;
  reason: string;
};

const payloadReplaces: PayloadReplace[] = [
  {
    lessonSlug: "esp32-buzzer-melodie",
    sortOrder: 6,
    searches: [
      { from: "524 Hz", to: "523 Hz" },
      { from: "524Hz", to: "523Hz" },
    ],
    reason: "C5 ist 523 Hz, nicht 524 — Quiz-Prompt im Payload korrigieren.",
  },
  // Round 2 — rgb-led Step 3 payload: Common-Anode-Hinweis war als Tipp formuliert,
  // las sich aber wie zur Haupt-LED gehörig → klar als Exkurs markieren.
  {
    lessonSlug: "esp32-rgb-led",
    sortOrder: 3,
    searches: [
      {
        from: "Bei einer Common-Anode-LED das lange Bein an 3,3 V hängen und die Logik umkehren: 255 = aus, 0 = voll an. Außerdem ledcWrite-Werte invertieren (255 − gewünschter Wert).",
        to: "**Nur falls du eine andere LED-Variante hast (Common-Anode statt Common-Cathode):** das lange Bein an 3,3 V hängen statt an GND und die Logik invertieren (255 = aus, 0 = voll an). Wir verwenden in dieser Lesson aber durchgehend die Common-Cathode-Version aus der Bauteilliste.",
      },
      {
        from: "For a common-anode LED connect the long leg to 3.3 V and invert the logic: 255 = off, 0 = full on. Invert your ledcWrite values accordingly (255 minus desired value).",
        to: "**Only if you happen to have a common-anode variant** (instead of the common-cathode in the BOM): connect the long leg to 3.3 V instead of GND and invert the logic (255 = off, 0 = full on). This lesson otherwise sticks with the common-cathode version.",
      },
    ],
    reason: "Common-Anode-Hinweis war als Tipp zur Haupt-LED missverständlich — klar als Exkurs für andere Variante umformulieren.",
  },
  // Round 2 — ultraschall-abstand Step 3 payload: Widerstands-Werte mit Body konsistent.
  {
    lessonSlug: "esp32-ultraschall-abstand",
    sortOrder: 3,
    searches: [
      { from: "10 kΩ + 20 kΩ zwischen Echo und GND, Mitte zu GPIO 18", to: "1 kΩ (Echo → Mitte) + 2 kΩ (Mitte → GND), Mitte zu GPIO 18" },
      { from: "10 kΩ + 20 kΩ between Echo and GND, middle to GPIO 18", to: "1 kΩ (Echo → middle) + 2 kΩ (middle → GND), middle to GPIO 18" },
    ],
    reason: "Body sagt 1k/2k, payload sagte 10k/20k — Widerspruch im selben Step beseitigt.",
  },
  // Round 2 — neopixel-strip Step 4 payload: GPIO 5 → GPIO 4 + 5V/VIN-Klärung.
  {
    lessonSlug: "esp32-neopixel-strip",
    sortOrder: 4,
    searches: [
      { from: "an GPIO 5", to: "an GPIO 4" },
      { from: "to GPIO 5", to: "to GPIO 4" },
    ],
    reason: "GPIO 5 ist Strapping-Pin → Wechsel auf GPIO 4 auch im Hinweis.",
  },
];

async function applyPayloadReplace(p: PayloadReplace): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: { sortOrder: p.sortOrder, lesson: { slug: p.lessonSlug } },
    select: { id: true, payload: true },
  });
  if (!step) return "missing";
  let raw = JSON.stringify(step.payload ?? {});
  let changed = false;
  for (const { from, to } of p.searches) {
    if (raw.includes(from)) {
      raw = raw.split(from).join(to);
      changed = true;
    }
  }
  if (!changed) return "skipped";
  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { payload: JSON.parse(raw) as never },
  });
  return "applied";
}

type CodePatch = {
  lessonSlug: string;
  sortOrder: number;
  expectsMarker: string;
  newCode: string;
  newLines?: Array<{ from: number; to: number; explain_de: string; explain_en: string }>;
  reason: string;
};

const codePatches: CodePatch[] = [
  // esp32-rgb-led CRITICAL: ledcSetup/ledcAttachPin sind in ESP32-Arduino-Core v3+
  // entfernt. Umstellung auf ledcAttach(pin, freq, res).
  {
    lessonSlug: "esp32-rgb-led",
    sortOrder: 4,
    expectsMarker: "ledcAttach(PIN_R, PWM_FREQ, PWM_RES)",
    newCode: `// ESP32 — RGB-LED: Farben mischen mit PWM
const int PIN_R = 25;
const int PIN_G = 26;
const int PIN_B = 27;
const int PWM_FREQ = 5000;
const int PWM_RES = 8;   // 0..255

void setup() {
  // ESP32-Arduino-Core v3+: ein Aufruf pro Pin
  ledcAttach(PIN_R, PWM_FREQ, PWM_RES);
  ledcAttach(PIN_G, PWM_FREQ, PWM_RES);
  ledcAttach(PIN_B, PWM_FREQ, PWM_RES);
}

void setColor(int r, int g, int b) {
  ledcWrite(PIN_R, r);
  ledcWrite(PIN_G, g);
  ledcWrite(PIN_B, b);
}

void loop() {
  setColor(255, 0, 0);    delay(800); // Rot
  setColor(0, 255, 0);    delay(800); // Grün
  setColor(0, 0, 255);    delay(800); // Blau
  setColor(255, 255, 0);  delay(800); // Gelb
  setColor(0, 255, 255);  delay(800); // Türkis
  setColor(255, 0, 255);  delay(800); // Pink
}`,
    newLines: [
      { from: 2, to: 4, explain_de: "Drei GPIOs für die drei Farben — einer pro Kanal.", explain_en: "Three GPIOs — one per color channel." },
      { from: 5, to: 6, explain_de: "PWM mit 5 kHz und 8 Bit Auflösung (0–255 Helligkeitsstufen).", explain_en: "PWM at 5 kHz with 8-bit resolution (0–255 brightness levels)." },
      { from: 8, to: 13, explain_de: "Ab Core v3 ein Aufruf pro Pin: ledcAttach(pin, freq, res) — kein ledcSetup mehr nötig.", explain_en: "Since Core v3 it's one call per pin: ledcAttach(pin, freq, res) — no more ledcSetup." },
      { from: 15, to: 19, explain_de: "Pro Farbe ein ledcWrite mit dem PIN als ersten Parameter.", explain_en: "One ledcWrite per color, with the PIN as first argument." },
      { from: 21, to: 28, explain_de: "loop() schaltet sechs Farben durch, jede 0,8 s.", explain_en: "loop() cycles through six colors, 0.8 s each." },
    ],
    reason: "ledcSetup/ledcAttachPin in ESP32-Arduino-Core v3+ entfernt — Code kompilierte auf aktuellen Installationen nicht mehr.",
  },
  // esp32-lauflicht-5leds CRITICAL: i > 0 lässt LED 0 beim Rücklauf weg.
  // Round 2: PINS auf {25, 26, 27, 32, 33} um zum BUILD-Text zu passen.
  {
    lessonSlug: "esp32-lauflicht-5leds",
    sortOrder: 4,
    expectsMarker: "LED_PINS[NUM_LEDS] = {25, 26, 27, 32, 33}",
    newCode: `// ESP32 — 5 LEDs jagen sich (Lauflicht)
const int NUM_LEDS = 5;
const int LED_PINS[NUM_LEDS] = {25, 26, 27, 32, 33};
const int STEP_MS = 120;

void setup() {
  for (int i = 0; i < NUM_LEDS; i++) {
    pinMode(LED_PINS[i], OUTPUT);
  }
}

void allOff() {
  for (int i = 0; i < NUM_LEDS; i++) {
    digitalWrite(LED_PINS[i], LOW);
  }
}

void loop() {
  // hin (0 → 4)
  for (int i = 0; i < NUM_LEDS; i++) {
    allOff();
    digitalWrite(LED_PINS[i], HIGH);
    delay(STEP_MS);
  }
  // zurück (3 → 0): wir starten bei 3 (NUM_LEDS-2), weil 4 schon eben leuchtete
  for (int i = NUM_LEDS - 2; i >= 0; i--) {
    allOff();
    digitalWrite(LED_PINS[i], HIGH);
    delay(STEP_MS);
  }
}`,
    reason: "for-Schleife `i > 0` ließ LED 0 beim Rücklauf weg — Lauflicht pendelte nicht vollständig.",
  },
  // esp32-mpu6050-gyro CRITICAL: if (z < 5) triggert bei 45°-Kippung.
  // Korrekt: fabs(z) < 3 (echt senkrecht) — und vorher auf 'flach' prüfen.
  {
    lessonSlug: "esp32-mpu6050-gyro",
    sortOrder: 4,
    expectsMarker: "fabs(z) < 3.0",
    newCode: `// ESP32 — MPU-6050: Lage erkennen
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <math.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  if (!mpu.begin()) {
    Serial.println("Sensor nicht gefunden");
    while (1) delay(10);
  }
}

void loop() {
  sensors_event_t a, g, t;
  mpu.getEvent(&a, &g, &t);

  float z = a.acceleration.z;
  // Erst auf 'flach' prüfen (Z ≈ ±9,8), dann auf 'senkrecht' (|Z| ≈ 0).
  if (z > 8.0) {
    Serial.println("liegt flach (Oberseite oben)");
  } else if (z < -8.0) {
    Serial.println("liegt flach (Unterseite oben)");
  } else if (fabs(z) < 3.0) {
    Serial.println("senkrecht gestellt");
  } else {
    Serial.println("gekippt");
  }

  delay(500);
}`,
    reason: "if (z < 5) triggerte bei 45°-Kippung. Neue Logik: erst flach (z > 8) prüfen, dann senkrecht (|z| < 3).",
  },
  // Round 2 — esp32-stepper-motor Code: Pin-Wechsel + benannte Konstanten.
  {
    lessonSlug: "esp32-stepper-motor",
    sortOrder: 4,
    expectsMarker: "const int IN1_PIN = 14;",
    newCode: `// ESP32 — 28BYJ-48 Schrittmotor mit ULN2003
#include <Stepper.h>

// Bootloader-sichere Pins: kein Strapping, kein UART.
const int IN1_PIN = 14;
const int IN2_PIN = 25;
const int IN3_PIN = 26;
const int IN4_PIN = 27;

// 28BYJ-48 mit Standard-Stepper-Library: die Library will die Spulen-
// Pins in der Reihenfolge IN1, IN3, IN2, IN4 — gut dokumentierter Quirk.
const int STEPS_PER_REV = 2048;
Stepper myStepper(STEPS_PER_REV, IN1_PIN, IN3_PIN, IN2_PIN, IN4_PIN);

void setup() {
  Serial.begin(115200);
  myStepper.setSpeed(10);  // ca. 10 U/min — ruhig und zuverlässig
  Serial.println("Stepper bereit.");
}

void loop() {
  Serial.println("90 Grad vorwaerts");
  myStepper.step(512);    // 512 Schritte = 90 Grad
  delay(1000);

  Serial.println("90 Grad zurueck");
  myStepper.step(-512);   // negatives Vorzeichen = Rueckwaerts
  delay(1000);
}`,
    newLines: [
      { from: 2, to: 2, explain_de: "Eingebaute Stepper-Library — keine Installation nötig.", explain_en: "Built-in Stepper library — no install needed." },
      { from: 4, to: 8, explain_de: "Pin-Belegung als benannte Konstanten: IN1=14, IN2=25, IN3=26, IN4=27. So passt der Code zum physischen Anschluss am ULN2003.", explain_en: "Named pin constants: IN1=14, IN2=25, IN3=26, IN4=27 — code matches the ULN2003 wiring 1:1." },
      { from: 12, to: 13, explain_de: "2048 Schritte pro Umdrehung. Beim Library-Konstruktor übergeben wir die Pins in der Reihenfolge IN1, IN3, IN2, IN4 — das ist die Spulen-Aktivierungsreihenfolge des 28BYJ-48.", explain_en: "2048 steps per revolution. We hand the library the pins in IN1, IN3, IN2, IN4 order — that's the 28BYJ-48's coil activation sequence." },
      { from: 15, to: 19, explain_de: "setup(): Library mit 10 U/min initialisieren.", explain_en: "setup(): initialize at 10 RPM." },
      { from: 21, to: 29, explain_de: "loop(): 512 Schritte vorwärts (= 90°), dann 512 Schritte zurück.", explain_en: "loop(): 512 steps forward (= 90°), then 512 steps back." },
    ],
    reason: "Pin-Wechsel auf bootloader-sichere GPIOs + benannte Konstanten, Spulen-Reihenfolge im Konstruktor klar dokumentiert.",
  },
  // Round 2 — esp32-neopixel-strip Code: GPIO 5 → GPIO 4 (kein Strapping-Pin).
  {
    lessonSlug: "esp32-neopixel-strip",
    sortOrder: 5,
    expectsMarker: "#define PIN      4",
    newCode: `#include <Adafruit_NeoPixel.h>

// GPIO 4 ist bootloader-sicher (kein Strapping-Pin).
#define PIN      4
#define NUM_LEDS 8

Adafruit_NeoPixel strip(NUM_LEDS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  strip.begin();
  strip.setBrightness(50);
  strip.show();
}

uint32_t colorWheel(uint8_t pos) {
  pos = 255 - pos;
  if (pos < 85)  return strip.Color(255 - (uint16_t)pos * 3, 0,                          (uint16_t)pos * 3);
  if (pos < 170) return strip.Color(0,                       (uint16_t)pos * 3 - 255,    255 - (uint16_t)pos * 3);
                 return strip.Color((uint16_t)pos * 3 - 255, 255 - (uint16_t)pos * 3,    0);
}

void loop() {
  static uint8_t hueOffset = 0;
  for (int i = 0; i < NUM_LEDS; i++) {
    uint8_t hue = hueOffset + (i * (256 / NUM_LEDS));
    strip.setPixelColor(i, colorWheel(hue));
  }
  strip.show();
  hueOffset++;
  delay(20);
}`,
    newLines: [
      { from: 1, to: 6, explain_de: "Library laden, GPIO 4 als Daten-Pin definieren (kein Strapping-Pin → kein Boot-Geflacker), Streifen-Objekt erzeugen.", explain_en: "Load the library, use GPIO 4 as data pin (no strapping pin → no boot flicker), create the strip object." },
      { from: 8, to: 13, explain_de: "setup(): Streifen starten, Helligkeit auf 50/255 begrenzen, alle LEDs aus.", explain_en: "setup(): start the strip, cap brightness at 50/255, blank all LEDs." },
      { from: 15, to: 20, explain_de: "colorWheel() rechnet jeden Wert 0–255 in eine RGB-Farbe um. Die uint16_t-Casts verhindern den 8-Bit-Überlauf bei pos * 3.", explain_en: "colorWheel() converts each value 0–255 into an RGB color. The uint16_t casts avoid the 8-bit overflow on pos * 3." },
      { from: 22, to: 31, explain_de: "Loop schiebt einen wandernden Regenbogen über alle LEDs.", explain_en: "Loop scrolls a moving rainbow across all LEDs." },
    ],
    reason: "GPIO 5 ist Strapping-Pin (kann Boot stören) + colorWheel-uint8_t-Überlauf gefixt durch uint16_t-Casts.",
  },
  // esp32-mini-roboter CRITICAL: Code im payload mitten in Serial.p abgeschnitten.
  {
    lessonSlug: "esp32-mini-roboter",
    sortOrder: 4,
    expectsMarker: "// ESP32 — Mini-Roboter: Abstand messen & Geschwindigkeit anpassen",
    newCode: `// ESP32 — Mini-Roboter: Abstand messen & Geschwindigkeit anpassen
const int TRIG_PIN = 5;
const int ECHO_PIN = 18;
const int MOTOR_PIN = 25;
const int PWM_FREQ = 5000;
const int PWM_RES = 8;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  ledcAttach(MOTOR_PIN, PWM_FREQ, PWM_RES);
}

float measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return 999.0; // timeout = nichts in Reichweite
  return duration * 0.0343f / 2.0f;
}

void loop() {
  float dist = measureDistanceCm();
  // Bei <5 cm: Stop. Bei >100 cm: volle Kraft.
  int duty = (int) constrain(map((long)dist, 5, 100, 50, 255), 0, 255);
  if (dist < 5.0) duty = 0;
  ledcWrite(MOTOR_PIN, duty);
  Serial.printf("Abstand: %.1f cm  →  Duty: %d\\n", dist, duty);
  delay(100);
}`,
    reason: "Code-Snippet war mitten in `Serial.p` abgeschnitten — kompilierte nicht.",
  },
];

async function applyStepPatch(p: Patch): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: {
      sortOrder: p.sortOrder,
      lesson: { slug: p.lessonSlug },
    },
    select: { id: true, body_de: true },
  });
  if (!step) return "missing";
  if (p.expectsMarker && (step.body_de ?? "").includes(p.expectsMarker)) return "skipped";

  const data: Record<string, unknown> = {};
  if (p.title_de) data.title_de = p.title_de;
  if (p.title_en) data.title_en = p.title_en;
  if (p.body_de) data.body_de = p.body_de;
  if (p.body_en) data.body_en = p.body_en;
  if (p.payload !== undefined) data.payload = p.payload as never;
  if (Object.keys(data).length === 0) return "skipped";
  await prisma.lessonStep.update({ where: { id: step.id }, data });
  return "applied";
}

async function applyGlobalReplace(g: GlobalReplace): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: { sortOrder: g.sortOrder, lesson: { slug: g.lessonSlug } },
    select: { id: true, body_de: true, body_en: true },
  });
  if (!step) return "missing";
  let de = step.body_de ?? "";
  let en = step.body_en ?? "";
  let changed = false;
  for (const { from, to } of g.searches) {
    if (de.includes(from)) {
      de = de.split(from).join(to);
      changed = true;
    }
    if (en.includes(from)) {
      en = en.split(from).join(to);
      changed = true;
    }
  }
  if (!changed) return "skipped";
  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { body_de: de, body_en: en },
  });
  return "applied";
}

async function applyCodePatch(c: CodePatch): Promise<"applied" | "skipped" | "missing"> {
  const step = await prisma.lessonStep.findFirst({
    where: { sortOrder: c.sortOrder, lesson: { slug: c.lessonSlug } },
    select: { id: true, payload: true },
  });
  if (!step) return "missing";
  const payload = (step.payload ?? {}) as Record<string, unknown>;
  const existingCode = typeof payload.code === "string" ? payload.code : "";
  if (existingCode.includes(c.expectsMarker)) return "skipped";

  const nextPayload: Record<string, unknown> = { ...payload, code: c.newCode };
  if (c.newLines) nextPayload.lines = c.newLines;
  await prisma.lessonStep.update({
    where: { id: step.id },
    data: { payload: nextPayload as never },
  });
  return "applied";
}

type BomFix = {
  lessonSlug: string;
  componentSlug: string;
  targetQuantity: number;
  noteDe?: string;
  noteEn?: string;
  reason: string;
};

const bomFixes: BomFix[] = [
  // esp32-blink-led: 2 → 3 Jumper-Kabel
  {
    lessonSlug: "esp32-blink-led",
    componentSlug: "jumper-wires-mm",
    targetQuantity: 3,
    reason: "Schaltung braucht 3 Kabel (GPIO→R, LED-Kathode→Minus, GND→Minus), BOM listete 2.",
  },
  // esp32-button-led: 3 → 4 Jumper-Kabel
  {
    lessonSlug: "esp32-button-led",
    componentSlug: "jumper-wires-mm",
    targetQuantity: 4,
    reason: "Button-Schaltung braucht 4 Kabel (Taster×2, LED-Strang×1, GND-Schiene×1), BOM listete 3.",
  },
  // esp32-dht22-temperature: 10kΩ Pull-Up
  {
    lessonSlug: "esp32-dht22-temperature",
    componentSlug: "resistor-10k",
    targetQuantity: 1,
    noteDe: "Pull-Up zwischen Daten-Pin und VCC. Bei Bare-Sensor zwingend; bei DHT22-Modul mit eingebautem Pull-Up nicht nötig.",
    noteEn: "Pull-up between data pin and VCC. Required for the bare sensor; not needed for DHT22 modules that include one.",
    reason: "DHT22 Pull-Up-Widerstand 10 kΩ fehlte in BOM.",
  },
  // esp32-ds18b20-wasser: 4,7kΩ Pull-Up (Pflicht)
  {
    lessonSlug: "esp32-ds18b20-wasser",
    componentSlug: "resistor-4k7ohm",
    targetQuantity: 1,
    noteDe: "Pflicht — 1-Wire-Bus braucht einen Pull-Up zwischen Daten und VCC.",
    noteEn: "Required — the 1-Wire bus needs a pull-up between data and VCC.",
    reason: "DS18B20 4,7 kΩ Pull-Up fehlte komplett in BOM (Pflicht-Bauteil).",
  },
  // esp32-neopixel-strip: 470Ω
  {
    lessonSlug: "esp32-neopixel-strip",
    componentSlug: "resistor-470ohm",
    targetQuantity: 1,
    noteDe: "Schutzwiderstand zwischen ESP32-Datenleitung und DIN des Streifens — verhindert Spikes.",
    noteEn: "Series resistor between the ESP32 data line and the strip's DIN — softens spikes.",
    reason: "NeoPixel-Schutzwiderstand 470 Ω fehlte in BOM.",
  },
  // esp32-dc-motor: MOSFET, Diode, Batteriehalter
  {
    lessonSlug: "esp32-dc-motor",
    componentSlug: "mosfet-irlz44n",
    targetQuantity: 1,
    noteDe: "Schaltet den Motorstrom — Gate über kleinen Vorwiderstand (z.B. 100 Ω) an GPIO 25.",
    noteEn: "Switches the motor current — drive the gate through a small resistor (e.g. 100 Ω) from GPIO 25.",
    reason: "IRLZ44N fehlte in BOM, im BUILD aber verwendet.",
  },
  {
    lessonSlug: "esp32-dc-motor",
    componentSlug: "diode-1n4007",
    targetQuantity: 1,
    noteDe: "Freilaufdiode parallel zum Motor — Kathode an Plus, Anode an Drain.",
    noteEn: "Flyback diode in parallel with the motor — cathode to plus, anode to drain.",
    reason: "1N4007 fehlte in BOM, im BUILD aber verwendet.",
  },
  {
    lessonSlug: "esp32-dc-motor",
    componentSlug: "battery-holder-4xaa",
    targetQuantity: 1,
    noteDe: "Externe Stromquelle für den Motor (ca. 6 V).",
    noteEn: "External power source for the motor (~6 V).",
    reason: "Externe Stromquelle fehlte in BOM, im BUILD aber verwendet.",
  },
];

async function applyBomFix(b: BomFix): Promise<"applied" | "skipped" | "missing"> {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: b.lessonSlug },
    select: { id: true },
  });
  if (!lesson) return "missing";
  const component = await prisma.component.findUnique({
    where: { slug: b.componentSlug },
    select: { id: true },
  });
  if (!component) return "missing";

  const existing = await prisma.bOMItem.findFirst({
    where: { lessonId: lesson.id, componentId: component.id },
    select: { id: true, quantity: true },
  });
  if (existing) {
    if (existing.quantity === b.targetQuantity) return "skipped";
    await prisma.bOMItem.update({
      where: { id: existing.id },
      data: { quantity: b.targetQuantity },
    });
    return "applied";
  }
  await prisma.bOMItem.create({
    data: {
      lessonId: lesson.id,
      componentId: component.id,
      quantity: b.targetQuantity,
      note_de: b.noteDe ?? null,
      note_en: b.noteEn ?? null,
    },
  });
  return "applied";
}

async function main() {
  let appliedCount = 0;
  let skippedCount = 0;
  let missingCount = 0;
  const bump = (status: "applied" | "skipped" | "missing") => {
    if (status === "applied") appliedCount++;
    else if (status === "skipped") skippedCount++;
    else missingCount++;
  };

  console.log("\n=== components ===");
  for (const c of newComponents) {
    const status = await ensureComponent(c);
    console.log(`component ${c.slug}: ${status}`);
    bump(status === "created" ? "applied" : "skipped");
  }

  console.log("\n=== step patches ===");
  for (const p of patches) {
    const status = await applyStepPatch(p);
    console.log(`step ${p.lessonSlug}#${p.sortOrder}: ${status} — ${p.reason}`);
    bump(status);
  }

  console.log("\n=== global replacements ===");
  for (const g of globalReplaces) {
    const status = await applyGlobalReplace(g);
    console.log(`replace ${g.lessonSlug}#${g.sortOrder}: ${status} — ${g.reason}`);
    bump(status);
  }

  console.log("\n=== payload replacements ===");
  for (const p of payloadReplaces) {
    const status = await applyPayloadReplace(p);
    console.log(`payload ${p.lessonSlug}#${p.sortOrder}: ${status} — ${p.reason}`);
    bump(status);
  }

  console.log("\n=== code patches ===");
  for (const c of codePatches) {
    const status = await applyCodePatch(c);
    console.log(`code ${c.lessonSlug}#${c.sortOrder}: ${status} — ${c.reason}`);
    bump(status);
  }

  console.log("\n=== bom fixes ===");
  for (const b of bomFixes) {
    const status = await applyBomFix(b);
    console.log(`bom ${b.lessonSlug}/${b.componentSlug} → ${b.targetQuantity}: ${status} — ${b.reason}`);
    bump(status);
  }

  console.log(
    `\nSummary: ${appliedCount} applied, ${skippedCount} skipped, ${missingCount} missing`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
