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
  // esp32-stepper-motor Step 3 (CRITICAL schematic-mismatch):
  // Code-Konstruktor erwartet Pin-Reihenfolge (19, 5, 18, 17) — das ist
  // (IN1, IN3, IN2, IN4) wegen Spulen-Sequenz beim 28BYJ-48. Text muss diese
  // Reihenfolge erklären, damit der Motor wirklich dreht.
  {
    lessonSlug: "esp32-stepper-motor",
    sortOrder: 3,
    expectsMarker: "ULN2003-Platine korrekt mit Reihenfolge IN1, IN3, IN2, IN4",
    body_de:
      "Steck den ULN2003-Treiber zwischen ESP32 und Motor. **Achtung — die Reihenfolge ist ungewöhnlich**, weil die Arduino Stepper-Library die Spulen des 28BYJ-48 in einer bestimmten Sequenz ansteuert.\n\nVerbinde die ULN2003-Platine korrekt mit Reihenfolge IN1, IN3, IN2, IN4:\n- **IN1 → GPIO 19**\n- **IN3 → GPIO 5**\n- **IN2 → GPIO 18**\n- **IN4 → GPIO 17**\n\nVCC der Platine an den **5V-Pin** des ESP32 (kommt vom USB), GND der Platine an GND des ESP32. Den weißen Motorstecker auf die Platine — er passt nur in einer Richtung.\n\nWenn du IN2 und IN3 vertauschst, dreht sich der Motor falsch oder gar nicht. Das ist eine häufige Stolperfalle.",
    body_en:
      "Plug the ULN2003 driver between the ESP32 and the motor. **Heads up — the order is unusual** because the Arduino Stepper library drives the 28BYJ-48 coils in a specific sequence.\n\nWire the ULN2003 board in the order IN1, IN3, IN2, IN4:\n- **IN1 → GPIO 19**\n- **IN3 → GPIO 5**\n- **IN2 → GPIO 18**\n- **IN4 → GPIO 17**\n\nVCC of the board to the ESP32's **5V pin** (sourced from USB), GND of the board to ESP32 GND. The white motor connector fits onto the board only one way.\n\nIf you swap IN2 and IN3 the motor turns the wrong way or not at all. It's a common trap.",
    reason: "Text-Reihenfolge passte nicht zum Code — Motor lief falsch oder gar nicht.",
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
  // esp32-mini-roboter Step 3 (CRITICAL pin-wiring):
  // gleiche Echo-Pegelproblematik wie Ultraschall-Lesson.
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
  {
    lessonSlug: "esp32-lauflicht-5leds",
    sortOrder: 4,
    expectsMarker: "for (int i = NUM_LEDS - 2; i >= 0; i--)",
    newCode: `// ESP32 — 5 LEDs jagen sich (Lauflicht)
const int NUM_LEDS = 5;
const int LED_PINS[NUM_LEDS] = {16, 17, 18, 19, 21};
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
  if (p.expectsMarker && step.body_de.includes(p.expectsMarker)) return "skipped";

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
  let de = step.body_de;
  let en = step.body_en;
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
