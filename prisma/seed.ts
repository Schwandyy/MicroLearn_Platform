import { PrismaClient, Prisma } from "@prisma/client";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { LessonContent, LessonSpec } from "./lessons/types";

const prisma = new PrismaClient();

// Diese Lessons werden inline weiter unten geseedet; der Generator-Loader
// muss sie überspringen, damit nichts doppelt läuft.
const INLINE_LESSON_SLUGS = new Set([
  "esp32-blink-led",
  "esp32-button-led",
  "esp32-pwm-fade",
  "esp32-servo-sweep",
  "esp32-dht22-temperature",
  "esp32-wifi-scan",
]);

interface GeneratedLessonPair {
  spec: LessonSpec;
  content: LessonContent;
}

async function loadGeneratedLessons(): Promise<GeneratedLessonPair[]> {
  const specsDir = path.join(__dirname, "lessons", "specs");
  const contentDir = path.join(__dirname, "lessons", "content");
  const pairs: GeneratedLessonPair[] = [];
  let specFiles: string[];
  try {
    specFiles = await fs.readdir(specsDir);
  } catch {
    return [];
  }
  for (const f of specFiles) {
    if (!f.endsWith(".json")) continue;
    const spec = JSON.parse(
      await fs.readFile(path.join(specsDir, f), "utf-8"),
    ) as LessonSpec;
    if (INLINE_LESSON_SLUGS.has(spec.slug)) continue;
    const contentPath = path.join(contentDir, `${spec.slug}.json`);
    try {
      const raw = await fs.readFile(contentPath, "utf-8");
      const content = JSON.parse(raw) as LessonContent;
      pairs.push({ spec, content });
    } catch {
      console.log(`  ⏭  ${spec.slug} (Spec da, Content fehlt — Generator noch nicht gelaufen)`);
    }
  }
  return pairs;
}

async function main() {
  console.log("🌱 Seeding MicroLearn dev data…");

  // -----------------------------------------------------------------------
  // Boards
  // -----------------------------------------------------------------------
  const boards = [
    {
      slug: "esp32-devkit-v1",
      name: "ESP32 DevKit V1",
      manufacturer: "Espressif",
      family: "ESP32",
      iconKey: "Cpu",
      imageUrl: "/parts/esp32-devkit.svg",
      logicLevel: "V3_3" as const,
      voltageMin: 3.0,
      voltageMax: 3.6,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART", "WIFI", "BLE", "MQTT"] as const,
      description_de:
        "Beliebter Dual-Core-Mikrocontroller mit WiFi und Bluetooth. 3,3 V Logikpegel — beim Anschluss von 5 V-Sensoren Pegelwandler verwenden.",
      description_en:
        "Popular dual-core MCU with WiFi and Bluetooth. 3.3 V logic level — use level shifters for 5 V sensors.",
      descriptionShort_de: "Mini-Computer mit WLAN & Bluetooth.",
      descriptionShort_en: "Tiny computer with WiFi & Bluetooth.",
    },
    {
      slug: "arduino-uno-r3",
      name: "Arduino Uno R3",
      manufacturer: "Arduino",
      family: "AVR",
      iconKey: "CircuitBoard",
      imageUrl: null,
      logicLevel: "V5" as const,
      voltageMin: 4.5,
      voltageMax: 5.5,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART"] as const,
      description_de:
        "Klassisches Einstiegsboard, robust und gut dokumentiert. 5 V Logikpegel.",
      description_en:
        "The classic beginner board — robust, well documented. 5 V logic level.",
      descriptionShort_de: "Der klassische Einsteiger-Computer.",
      descriptionShort_en: "The classic beginner computer.",
    },
    {
      slug: "raspberry-pi-pico",
      name: "Raspberry Pi Pico",
      manufacturer: "Raspberry Pi Foundation",
      family: "RP2040",
      iconKey: "CircuitBoard",
      imageUrl: null,
      logicLevel: "V3_3" as const,
      voltageMin: 1.8,
      voltageMax: 5.5,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART"] as const,
      description_de:
        "Günstig, Dual-Core ARM Cortex-M0+, programmierbar mit MicroPython oder C/C++.",
      description_en:
        "Affordable dual-core ARM Cortex-M0+, programmable with MicroPython or C/C++.",
      descriptionShort_de: "Günstiger Mini-Computer aus Großbritannien.",
      descriptionShort_en: "Affordable tiny computer from the UK.",
    },
    {
      slug: "esp8266-nodemcu",
      name: "ESP8266 NodeMCU",
      manufacturer: "Espressif",
      family: "ESP8266",
      iconKey: "Cpu",
      imageUrl: null,
      logicLevel: "V3_3" as const,
      voltageMin: 3.0,
      voltageMax: 3.6,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART", "WIFI", "MQTT"] as const,
      description_de:
        "WiFi-Klassiker für IoT-Einsteiger. 3,3 V Logikpegel.",
      description_en: "The classic WiFi IoT entry board. 3.3 V logic level.",
      descriptionShort_de: "WLAN-Klassiker für IoT-Einsteiger.",
      descriptionShort_en: "WiFi classic for IoT beginners.",
    },
    {
      slug: "arduino-nano",
      name: "Arduino Nano",
      manufacturer: "Arduino",
      family: "AVR",
      iconKey: "CircuitBoard",
      imageUrl: null,
      logicLevel: "V5" as const,
      voltageMin: 4.5,
      voltageMax: 5.5,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART"] as const,
      description_de:
        "Kompakte Uno-Variante, ideal für Steckbrett-Projekte.",
      description_en:
        "Compact Uno variant — perfect for breadboard projects.",
      descriptionShort_de: "Kleiner Arduino fürs Steckbrett.",
      descriptionShort_en: "Tiny Arduino for breadboards.",
    },
  ];

  for (const b of boards) {
    await prisma.board.upsert({
      where: { slug: b.slug },
      create: b as never,
      update: b as never,
    });
  }
  console.log(`  ✓ ${boards.length} boards`);

  // -----------------------------------------------------------------------
  // Components (mit Kindersprache + Bild)
  // -----------------------------------------------------------------------
  const components = [
    {
      slug: "led-red-5mm",
      name: "LED rot 5 mm",
      category: "actuator",
      iconKey: "Lightbulb",
      imageUrl: "/parts/led-red.svg",
      logicLevel: "BOTH" as const,
      voltageMin: 1.8,
      voltageMax: 2.2,
      protocols: ["GPIO"] as const,
      description_de: "Standard-LED, leuchtet rot wenn Strom fließt.",
      description_en: "Standard red LED, lights up when current flows.",
      descriptionShort_de: "Kleines Lämpchen, das leuchtet.",
      descriptionShort_en: "Tiny lamp that lights up.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "resistor-220ohm",
      name: "Widerstand 220 Ω",
      category: "passive",
      iconKey: "Zap",
      imageUrl: "/parts/resistor-220.svg",
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 50,
      protocols: ["GPIO"] as const,
      description_de:
        "Begrenzt den Strom, damit die LED nicht durchbrennt.",
      description_en:
        "Limits current so the LED doesn't burn out.",
      descriptionShort_de: "Bremse für Strom — schützt die LED.",
      descriptionShort_en: "A brake for the current — protects the LED.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "breadboard-half",
      name: "Steckbrett MB-102",
      category: "tool",
      iconKey: "Grid3x3",
      imageUrl: "/parts/breadboard.svg",
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 50,
      protocols: ["GPIO"] as const,
      description_de:
        "830 Kontakte zum Stecken — Bauteile und Drähte ohne Löten verbinden.",
      description_en:
        "830-contact plug-in board — connect parts and wires without soldering.",
      descriptionShort_de: "830 Löcher zum Stecken, ohne Löten.",
      descriptionShort_en: "830 holes to plug into — no soldering.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "jumper-wires-mm",
      name: "Jumper-Kabel (M/M)",
      category: "tool",
      iconKey: "Cable",
      imageUrl: "/parts/jumper-wires.svg",
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 50,
      protocols: ["GPIO"] as const,
      description_de: "Bunte Steckkabel zum Verbinden der Bauteile.",
      description_en: "Colored jumper wires to connect parts.",
      descriptionShort_de: "Bunte Kabel mit Steckern.",
      descriptionShort_en: "Colored cables with pins.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "tact-switch-6mm",
      name: "Taster (Mikroschalter 6 mm)",
      category: "input",
      iconKey: "MousePointerClick",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 50,
      protocols: ["GPIO"] as const,
      description_de:
        "Kleiner Druckknopf zum Einstecken ins Steckbrett. Schließt einen Kontakt, solange du draufdrückst.",
      description_en:
        "Tiny push button for the breadboard. Closes a contact while you press it.",
      descriptionShort_de: "Druckknopf zum Reinstecken.",
      descriptionShort_en: "Push-button you plug in.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "potentiometer-10k",
      name: "Potentiometer 10 kΩ",
      category: "input",
      iconKey: "CircleDot",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 50,
      protocols: ["GPIO", "ADC"] as const,
      description_de:
        "Drehknopf, der einen Wert zwischen 0 und 100 % liefert. Mit dem ESP32 kann er als analoger Eingang dienen.",
      description_en:
        "A rotary knob that gives a value between 0 and 100 %. With the ESP32 it works as an analog input.",
      descriptionShort_de: "Drehknopf für analoge Eingaben.",
      descriptionShort_en: "Rotary knob for analog input.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "servo-sg90",
      name: "Servo SG90",
      category: "actuator",
      iconKey: "RotateCw",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 4.8,
      voltageMax: 6.0,
      protocols: ["GPIO", "PWM"] as const,
      description_de:
        "Kleiner Stellmotor, der sich zwischen 0° und 180° drehen lässt. Für Roboterarme, Klappen, Anzeigen.",
      description_en:
        "Small actuator that rotates between 0° and 180°. For robot arms, flaps, dials.",
      descriptionShort_de: "Motor, der sich auf Winkel dreht.",
      descriptionShort_en: "Motor that rotates to an angle.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "dht22-sensor",
      name: "DHT22 Temperatur- & Feuchte-Sensor",
      category: "sensor",
      iconKey: "Thermometer",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 3.3,
      voltageMax: 5.5,
      protocols: ["GPIO"] as const,
      description_de:
        "Misst Lufttemperatur (-40 bis 80 °C) und Luftfeuchte (0–99 %). Per einem Datendraht am ESP32.",
      description_en:
        "Measures air temperature (-40 to 80 °C) and humidity (0–99 %). One data wire to the ESP32.",
      descriptionShort_de: "Misst Wärme + Feuchte.",
      descriptionShort_en: "Measures warmth + humidity.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "led-rgb-5mm",
      name: "RGB-LED 5 mm (Common Cathode)",
      category: "actuator",
      iconKey: "Lightbulb",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 1.8,
      voltageMax: 3.3,
      protocols: ["GPIO", "PWM"] as const,
      description_de:
        "Drei LEDs (rot, grün, blau) in einem Gehäuse mit gemeinsamer Masse. Über PWM lassen sich beliebige Farben mischen.",
      description_en:
        "Three LEDs (red, green, blue) in one housing with a common cathode. PWM lets you mix any color.",
      descriptionShort_de: "Drei LEDs in einem — alle Farben.",
      descriptionShort_en: "Three LEDs in one — any color.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "buzzer-passive",
      name: "Passiver Piezo-Buzzer",
      category: "actuator",
      iconKey: "Volume2",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 1.5,
      voltageMax: 5.0,
      protocols: ["GPIO", "PWM"] as const,
      description_de:
        "Piezo-Lautsprecher ohne eigene Tonerzeugung. Der ESP32 gibt PWM-Signale aus — daraus werden Melodien.",
      description_en:
        "Piezo speaker without its own oscillator. The ESP32 outputs PWM signals — those become melodies.",
      descriptionShort_de: "Piept — alle Töne möglich.",
      descriptionShort_en: "Beeps — any tone possible.",
      levelHint: "L1_BEGINNER" as const,
    },
    {
      slug: "dc-motor-3v",
      name: "Mini-DC-Motor 3V",
      category: "actuator",
      iconKey: "Fan",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 3.0,
      voltageMax: 6.0,
      protocols: ["GPIO", "PWM"] as const,
      description_de:
        "Kleiner Gleichstrommotor — dreht sich, sobald Strom fließt. Wird NIE direkt am GPIO betrieben (zu viel Strom) — immer über H-Brücke oder Transistor.",
      description_en:
        "Small DC motor — spins as soon as current flows. NEVER drive directly from GPIO (too much current) — always use an H-bridge or transistor.",
      descriptionShort_de: "Dreht sich. Braucht Treiber.",
      descriptionShort_en: "Spins. Needs a driver.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "stepper-28byj48-uln2003",
      name: "Schrittmotor 28BYJ-48 + ULN2003-Treiber",
      category: "actuator",
      iconKey: "RotateCw",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 5.0,
      voltageMax: 12.0,
      protocols: ["GPIO"] as const,
      description_de:
        "Schrittmotor mit 4096 Schritten pro Umdrehung, kommt im Set mit ULN2003-Treiberplatine. Bewegt sich auf den genauen Winkel.",
      description_en:
        "Stepper motor with 4096 steps per revolution, ships with ULN2003 driver board. Moves to a precise angle.",
      descriptionShort_de: "Dreht sich auf genauen Winkel.",
      descriptionShort_en: "Rotates to a precise angle.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "ultrasonic-hc-sr04",
      name: "Ultraschall-Abstandssensor HC-SR04",
      category: "sensor",
      iconKey: "Ruler",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 5.0,
      voltageMax: 5.0,
      protocols: ["GPIO"] as const,
      description_de:
        "Misst Entfernungen zwischen 2 cm und 4 m mit Ultraschall — wie eine Fledermaus. Zwei Pins: Trigger und Echo.",
      description_en:
        "Measures distance from 2 cm to 4 m using ultrasonic pulses — like a bat. Two pins: trigger and echo.",
      descriptionShort_de: "Misst Abstand wie eine Fledermaus.",
      descriptionShort_en: "Measures distance like a bat.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "pir-hc-sr501",
      name: "PIR-Bewegungsmelder HC-SR501",
      category: "sensor",
      iconKey: "Eye",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 5.0,
      voltageMax: 12.0,
      protocols: ["GPIO"] as const,
      description_de:
        "Passiver Infrarot-Sensor — bemerkt warme bewegliche Körper (Mensch, Tier). Liefert ein einfaches High-Signal, wenn er Bewegung erkennt.",
      description_en:
        "Passive infrared sensor — detects warm moving bodies (humans, animals). Outputs a simple high signal on motion.",
      descriptionShort_de: "Sieht Bewegung.",
      descriptionShort_en: "Sees motion.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "bmp280-sensor",
      name: "BMP280 Luftdruck- & Temperatursensor",
      category: "sensor",
      iconKey: "Mountain",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 1.8,
      voltageMax: 3.6,
      protocols: ["I2C", "SPI"] as const,
      description_de:
        "Misst Luftdruck (300–1100 hPa) und Temperatur. Über I²C oder SPI mit nur 2 Leitungen am ESP32. Aus dem Druck lässt sich die Höhe berechnen.",
      description_en:
        "Measures air pressure (300–1100 hPa) and temperature. Connects via I²C or SPI with just 2 wires. Pressure lets you derive altitude.",
      descriptionShort_de: "Druck + Temperatur, I²C.",
      descriptionShort_en: "Pressure + temperature, I²C.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "photoresistor-ldr",
      name: "Fotowiderstand (LDR)",
      category: "sensor",
      iconKey: "SunMedium",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 5.0,
      protocols: ["ADC"] as const,
      description_de:
        "Sein Widerstand wird kleiner, je mehr Licht draufscheint. Mit einem Spannungsteiler liest der ESP32 daraus den Helligkeitswert.",
      description_en:
        "Its resistance drops as more light hits it. Combined with a voltage divider, the ESP32 reads a brightness value.",
      descriptionShort_de: "Misst Helligkeit.",
      descriptionShort_en: "Measures brightness.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "mpu6050-sensor",
      name: "MPU-6050 Gyroskop & Beschleunigungssensor",
      category: "sensor",
      iconKey: "Compass",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 2.3,
      voltageMax: 3.4,
      protocols: ["I2C"] as const,
      description_de:
        "6 Achsen: 3-Achsen-Beschleunigung + 3-Achsen-Rotation. Mit I²C — Grundlage für Drohnen, Self-Balancing-Roboter, Bewegungserkennung.",
      description_en:
        "6 axes: 3-axis acceleration + 3-axis rotation. I²C. Foundation for drones, self-balancing robots, motion detection.",
      descriptionShort_de: "Misst Lage + Bewegung.",
      descriptionShort_en: "Measures orientation + motion.",
      levelHint: "L3_INTERMEDIATE" as const,
    },
    {
      slug: "soil-moisture-yl69",
      name: "Bodenfeuchte-Sensor YL-69",
      category: "sensor",
      iconKey: "Sprout",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 3.3,
      voltageMax: 5.0,
      protocols: ["ADC"] as const,
      description_de:
        "Zwei Metallstifte in der Erde — je feuchter, desto besser leitet sie. Der ESP32 liest das als analogen Wert. Perfekt für Pflanzen-Bewässerung.",
      description_en:
        "Two metal probes in soil — the wetter, the better it conducts. The ESP32 reads it as an analog value. Perfect for plant watering.",
      descriptionShort_de: "Misst Erdfeuchte.",
      descriptionShort_en: "Measures soil moisture.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "ds18b20-waterproof",
      name: "DS18B20 Wassertemperatur-Sensor (wasserdicht)",
      category: "sensor",
      iconKey: "Thermometer",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 3.0,
      voltageMax: 5.5,
      protocols: ["ONEWIRE"] as const,
      description_de:
        "Wasserdichter Temperatursensor an einem 1m-Kabel. Per 1-Wire-Bus — mehrere Sensoren an einer einzigen GPIO-Leitung möglich.",
      description_en:
        "Waterproof temperature sensor on a 1m cable. One-Wire bus — multiple sensors share a single GPIO line.",
      descriptionShort_de: "Wasserdichter Temp-Fühler.",
      descriptionShort_en: "Waterproof temp probe.",
      levelHint: "L2_NOVICE" as const,
    },
    {
      slug: "oled-ssd1306",
      name: "OLED-Display 128×64 (SSD1306, I²C)",
      category: "actuator",
      iconKey: "Monitor",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 3.3,
      voltageMax: 5.0,
      protocols: ["I2C"] as const,
      description_de:
        "128×64 Pixel monochromes OLED-Display. Über I²C mit nur 4 Drähten — zeigt Text, Werte, kleine Grafiken oder einfache Animationen.",
      description_en:
        "128×64 pixel monochrome OLED display. I²C with just 4 wires — shows text, values, small graphics or basic animations.",
      descriptionShort_de: "Mini-Bildschirm.",
      descriptionShort_en: "Tiny screen.",
      levelHint: "L3_INTERMEDIATE" as const,
    },
    {
      slug: "neopixel-strip-ws2812b",
      name: "NeoPixel-LED-Streifen WS2812B",
      category: "actuator",
      iconKey: "Sparkles",
      imageUrl: null,
      logicLevel: "BOTH" as const,
      voltageMin: 4.5,
      voltageMax: 5.5,
      protocols: ["GPIO"] as const,
      description_de:
        "Adressierbare RGB-LEDs in Reihe — jede einzeln per Datenleitung steuerbar. Eine Datenleitung für Dutzende von LEDs.",
      description_en:
        "Addressable RGB LEDs in series — each one individually controlled via one data line. One pin for dozens of LEDs.",
      descriptionShort_de: "Viele bunte LEDs, einzeln steuerbar.",
      descriptionShort_en: "Many colored LEDs, individually controllable.",
      levelHint: "L3_INTERMEDIATE" as const,
    },
  ];
  for (const c of components) {
    await prisma.component.upsert({
      where: { slug: c.slug },
      create: c as never,
      update: c as never,
    });
  }
  console.log(`  ✓ ${components.length} components`);

  // -----------------------------------------------------------------------
  // Affiliate programs — alle 4 aktiv (Admin kann später deaktivieren)
  // Tracking-IDs werden über Env-Vars geladen, hier Defaults für Dev
  // -----------------------------------------------------------------------
  const programs = [
    {
      merchant: "AZ_DELIVERY" as const,
      displayName: "AZ-Delivery",
      urlTemplate: "https://www.az-delivery.de/products/{slug}",
      trackingId: process.env.AFFILIATE_AZ_REF ?? null,
      isActive: true,
    },
    {
      merchant: "AMAZON_DE" as const,
      displayName: "Amazon",
      urlTemplate: "https://www.amazon.de/s?k={slug}&tag={trackingId}",
      trackingId: process.env.AFFILIATE_AMAZON_TAG ?? "microlearn-21",
      isActive: true,
    },
    {
      merchant: "BERRYBASE" as const,
      displayName: "BerryBase",
      urlTemplate: "https://www.berrybase.de/search?sSearch={slug}",
      trackingId: process.env.AFFILIATE_BERRYBASE_REF ?? null,
      isActive: true,
    },
    {
      merchant: "REICHELT" as const,
      displayName: "Reichelt",
      urlTemplate: "https://www.reichelt.de/index.html?ACTION=446&LA=0&q={slug}",
      trackingId: process.env.AFFILIATE_REICHELT_REF ?? null,
      isActive: true,
    },
  ];
  for (const p of programs) {
    await prisma.affiliateProgram.upsert({
      where: { merchant: p.merchant },
      create: p,
      update: p,
    });
  }
  console.log(`  ✓ ${programs.length} affiliate programs (all active)`);

  const azProgram = await prisma.affiliateProgram.findUniqueOrThrow({
    where: { merchant: "AZ_DELIVERY" },
  });
  const amazonProgram = await prisma.affiliateProgram.findUniqueOrThrow({
    where: { merchant: "AMAZON_DE" },
  });
  const berryProgram = await prisma.affiliateProgram.findUniqueOrThrow({
    where: { merchant: "BERRYBASE" },
  });
  const reicheltProgram = await prisma.affiliateProgram.findUniqueOrThrow({
    where: { merchant: "REICHELT" },
  });

  const ledComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "led-red-5mm" },
  });
  const resComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "resistor-220ohm" },
  });
  const bbComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "breadboard-half" },
  });
  const wireComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "jumper-wires-mm" },
  });
  const buttonComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "tact-switch-6mm" },
  });
  const potiComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "potentiometer-10k" },
  });
  const servoComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "servo-sg90" },
  });
  const dhtComp = await prisma.component.findUniqueOrThrow({
    where: { slug: "dht22-sensor" },
  });
  const esp32Board = await prisma.board.findUniqueOrThrow({
    where: { slug: "esp32-devkit-v1" },
  });

  // -----------------------------------------------------------------------
  // Affiliate-Direktlinks — KURATIERT (keine Auto-Discovery mehr).
  // Pro Bauteil und Anbieter werden hier nur ECHTE Einzelteile mit echten
  // Preisen gepflegt. Wo ein Anbieter kein passendes Einzelteil führt
  // (z.B. AZ-Delivery hat nur Widerstands-Sortimente, keine 220-Ohm-Einzel),
  // wird dort GAR KEIN Link gesetzt — lieber weniger Anbieter als
  // irreführende Sets/eBooks.
  // -----------------------------------------------------------------------
  type Merchant = "AZ_DELIVERY" | "AMAZON_DE" | "BERRYBASE" | "REICHELT";

  interface ManualLink {
    /** Volle, geprüfte Direkt-URL. */
    url: string;
    /** Aktueller Brutto-Stückpreis in Cent (EUR). */
    priceCents: number;
    /** Optionales Hinweis-Label, z.B. „65er M/M-Set". */
    packLabel_de?: string;
    packLabel_en?: string;
  }

  interface PartLinkConfig {
    componentId?: string;
    boardId?: string;
    label: string;
    /** Stückzahl pro Pack — wird für Pro-Stück-Anzeige genutzt. */
    pieces?: number;
    links: Partial<Record<Merchant, ManualLink>>;
  }

  // Hinweis: Preise sind ein Snapshot — können mit der Zeit drift,
  // wir markieren sie clientseitig als „ca."-Wert.
  const partConfigs: PartLinkConfig[] = [
    {
      boardId: esp32Board.id,
      label: "ESP32 DevKit V1",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/esp32-developmentboard",
          priceCents: 1099,
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B071P98VTG",
          priceCents: 1199,
        },
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/nodemcu_esp32_wifi-_und_bluetooth-modul-219897",
          priceCents: 899,
        },
      },
    },
    {
      componentId: bbComp.id,
      label: "Steckbrett MB-102 (830 Kontakte)",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/breadboard",
          priceCents: 599,
        },
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/experimentier-steckboard_830_kontakte-282600",
          priceCents: 499,
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B07LFD4LT6",
          priceCents: 599,
        },
      },
    },
    {
      componentId: ledComp.id,
      label: "LED rot 5 mm",
      links: {
        // AZ-Delivery hat KEINE 5mm-Einzel-LED — nur 11€-Sortimente. Lieber weglassen.
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/flat-led_5mm_rot_350_mcd_120_-363941",
          priceCents: 9,
        },
        AMAZON_DE: {
          // 100er Set rot/grün/gelb/blau/weiß — günstigste Einzelpreis-Quelle
          url: "https://www.amazon.de/dp/B01N7OXKEJ",
          priceCents: 599,
          packLabel_de: "100er-Set",
          packLabel_en: "100-pack",
        },
      },
    },
    {
      componentId: resComp.id,
      label: "Widerstand 220 Ω",
      links: {
        // AZ-Delivery hat KEINEN 220-Ohm-Einzelwiderstand (das „Resistor Kit
        // 525 Stück" ist tatsächlich nur ein kostenloses eBook). → weglassen.
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/widerstand_metallschicht_220_ohm_0207_0_6_0_1_-12875",
          priceCents: 10,
        },
        AMAZON_DE: {
          // Sortiment 600 Stück 30 Werte
          url: "https://www.amazon.de/dp/B07X9XPF4N",
          priceCents: 999,
          packLabel_de: "600er-Set, 30 Werte",
          packLabel_en: "600-pack, 30 values",
        },
      },
    },
    {
      componentId: wireComp.id,
      label: "Jumper-Kabel (M/M)",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/steckbrucken-m-m-jumper-kabel",
          priceCents: 449,
          packLabel_de: "65er M/M-Set",
          packLabel_en: "65× M/M set",
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B01EV70C78",
          priceCents: 699,
          packLabel_de: "120er Set (M/M, M/F, F/F)",
          packLabel_en: "120-pack (M/M, M/F, F/F)",
        },
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/entwicklerboards_-_steckbrueckenkabel_10cm_3x_40_kabel-280594",
          priceCents: 459,
          packLabel_de: "3× 40 Kabel (10 cm)",
          packLabel_en: "3× 40 wires (10 cm)",
        },
      },
    },
    {
      componentId: buttonComp.id,
      label: "Taster (Mikroschalter 6 mm)",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/mikroschalter-taster-set-180-stuck",
          priceCents: 899,
          packLabel_de: "180er Set, verschiedene Größen",
          packLabel_en: "180-pack, various sizes",
        },
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/kurzhubtaster_printmontage_1_schliesser_6_x_6_x_4_3_mm-360041",
          priceCents: 12,
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B07ZNDFNXR",
          priceCents: 699,
          packLabel_de: "100er Set",
          packLabel_en: "100-pack",
        },
      },
    },
    {
      componentId: potiComp.id,
      label: "Potentiometer 10 kΩ",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/3296w-trimmer-potentiometer-set-12-werte-60-stuck-500-bis-1m-hochprazise-lineare-potentiometer-fur-elektronikprojekte-enthalt-1k-10k-100k-ohm-und-mehr",
          priceCents: 1499,
          packLabel_de: "60er Trimmer-Sortiment, inkl. 10 kΩ",
          packLabel_en: "60-pack trimmer assortment, incl. 10 kΩ",
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B07Z2BJW7S",
          priceCents: 899,
          packLabel_de: "10er Set Drehpoti 10 kΩ",
          packLabel_en: "10-pack rotary 10 kΩ",
        },
      },
    },
    {
      componentId: servoComp.id,
      label: "Servo SG90",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/az-delivery-micro-servo-sg90",
          priceCents: 599,
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B07TQGN1CM",
          priceCents: 1199,
          packLabel_de: "5er-Set",
          packLabel_en: "5-pack",
        },
      },
    },
    {
      componentId: dhtComp.id,
      label: "DHT22 Sensor",
      links: {
        AZ_DELIVERY: {
          url: "https://www.az-delivery.de/products/dht22",
          priceCents: 949,
        },
        REICHELT: {
          url: "https://www.reichelt.de/de/de/shop/produkt/arduino_-_temp_feuchte_pro_praezise_dht22_am2302-191250",
          priceCents: 999,
        },
        AMAZON_DE: {
          url: "https://www.amazon.de/dp/B0B4N5KN4F",
          priceCents: 899,
        },
      },
    },
  ];

  function appendTrackingTag(
    url: string,
    merchant: Merchant,
    trackingId: string | null,
  ): string {
    if (!trackingId) return url;
    const sep = url.includes("?") ? "&" : "?";
    const param: Record<Merchant, string> = {
      AMAZON_DE: "tag",
      AZ_DELIVERY: "ref",
      BERRYBASE: "ref",
      REICHELT: "PROVID",
    };
    return `${url}${sep}${param[merchant]}=${encodeURIComponent(trackingId)}`;
  }

  const programByMerchant: Record<Merchant, typeof azProgram> = {
    AZ_DELIVERY: azProgram,
    AMAZON_DE: amazonProgram,
    BERRYBASE: berryProgram,
    REICHELT: reicheltProgram,
  };

  // Alle alten AffiliateLinks für diese Bauteile wegwerfen (Stale Links aus
  // früheren Discovery-Läufen). So bleibt die DB sauber.
  const allOwnerIds = partConfigs
    .map((p) => p.componentId ?? p.boardId)
    .filter((v): v is string => Boolean(v));
  await prisma.affiliateLink.deleteMany({
    where: {
      OR: [
        { componentId: { in: allOwnerIds } },
        { boardId: { in: allOwnerIds } },
      ],
    },
  });

  let directLinks = 0;
  for (const part of partConfigs) {
    for (const [merchant, link] of Object.entries(part.links) as Array<
      [Merchant, ManualLink]
    >) {
      const program = programByMerchant[merchant];
      const trackedUrl = appendTrackingTag(link.url, merchant, program.trackingId);
      const ownerId = part.componentId ?? part.boardId!;
      const id = `${program.id}-${ownerId}`;
      directLinks += 1;
      await prisma.affiliateLink.upsert({
        where: { id },
        create: {
          id,
          programId: program.id,
          productUrl: trackedUrl,
          productSlug: link.url,
          priceCents: link.priceCents,
          currency: "EUR",
          packageNote_de: link.packLabel_de ?? null,
          packageNote_en: link.packLabel_en ?? null,
          componentId: part.componentId ?? null,
          boardId: part.boardId ?? null,
          lastSyncedAt: new Date(),
        },
        update: {
          productUrl: trackedUrl,
          productSlug: link.url,
          priceCents: link.priceCents,
          currency: "EUR",
          packageNote_de: link.packLabel_de ?? null,
          packageNote_en: link.packLabel_en ?? null,
          lastSyncedAt: new Date(),
        },
      });
      console.log(
        `    ✓ ${merchant.padEnd(12)} ${part.label.padEnd(36)} ${(link.priceCents / 100).toFixed(2)} €`,
      );
    }
  }
  console.log(
    `  ✓ ${directLinks} kuratierte Affiliate-Direktlinks mit Preisen`,
  );

  // -----------------------------------------------------------------------
  // Learning paths (4-Pfad-Konzept: Licht / Bewegung / Sensoren / IoT)
  // -----------------------------------------------------------------------
  // Cleanup alter Pfad-Slugs (cascade löscht zugehörige Courses + Lessons —
  // diese werden im selben Run frisch neu geseedet).
  await prisma.learningPath.deleteMany({
    where: {
      slug: {
        in: ["esp32-basics", "arduino-first-projects", "iot-with-mqtt", "embedded-rtos"],
      },
    },
  });

  const paths = [
    {
      slug: "mein-erstes-licht",
      level: "L1_BEGINNER" as const,
      estimatedHours: 4,
      sortOrder: 1,
      title_de: "Mein erstes Licht",
      title_en: "My First Light",
      summary_de:
        "LED, Taster, PWM, RGB, Buzzer, Lauflicht — sechs Mini-Projekte vom ersten Blinken bis zum mehrfarbigen Lichtspiel.",
      summary_en:
        "LED, button, PWM, RGB, buzzer, light chase — six mini projects from first blink to multi-color light play.",
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "bewegung-robotik",
      level: "L2_NOVICE" as const,
      estimatedHours: 6,
      sortOrder: 2,
      title_de: "Bewegung & Robotik",
      title_en: "Motion & Robotics",
      summary_de:
        "Servo, DC-Motor, Schrittmotor, Ultraschall, PIR — alles, was sich bewegt oder Bewegung erkennt. Endet mit einem Mini-Roboter.",
      summary_en:
        "Servo, DC motor, stepper, ultrasonic, PIR — everything that moves or detects motion. Ends with a mini robot.",
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "welt-der-sensoren",
      level: "L2_NOVICE" as const,
      estimatedHours: 6,
      sortOrder: 3,
      title_de: "Welt der Sensoren",
      title_en: "World of Sensors",
      summary_de:
        "Temperatur, Luftdruck, Licht, Lage, Bodenfeuchte, Wassertemperatur — sechs Sensoren, sechs Projekte, eine fertige Wetterstation.",
      summary_en:
        "Temperature, pressure, light, orientation, soil moisture, water temperature — six sensors, six projects, one complete weather station.",
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "anzeige-iot",
      level: "L3_INTERMEDIATE" as const,
      estimatedHours: 8,
      sortOrder: 4,
      title_de: "Anzeige & IoT",
      title_en: "Display & IoT",
      summary_de:
        "WLAN, OLED, NeoPixel, MQTT, Webserver, OTA — vom ersten Pixel auf dem Display bis zum vernetzten Smart-Home-Sensor.",
      summary_en:
        "WiFi, OLED, NeoPixel, MQTT, web server, OTA — from your first pixel on a display to a networked smart-home sensor.",
      isPublished: true,
      publishedAt: new Date(),
    },
  ];
  for (const p of paths) {
    await prisma.learningPath.upsert({
      where: { slug: p.slug },
      create: p,
      update: p,
    });
  }
  console.log(`  ✓ ${paths.length} learning paths`);

  // Starter badge
  await prisma.badge.upsert({
    where: { slug: "first-step" },
    create: {
      slug: "first-step",
      category: "MILESTONE",
      xpReward: 25,
      title_de: "Erster Schritt",
      title_en: "First Step",
      description_de: "Du hast deinen Einstufungstest abgeschlossen.",
      description_en: "You completed your placement quiz.",
    },
    update: {},
  });
  console.log("  ✓ starter badge");

  // -----------------------------------------------------------------------
  // Courses (1 pro Pfad)
  // -----------------------------------------------------------------------
  const pathLicht = await prisma.learningPath.findUniqueOrThrow({
    where: { slug: "mein-erstes-licht" },
  });
  const pathBewegung = await prisma.learningPath.findUniqueOrThrow({
    where: { slug: "bewegung-robotik" },
  });
  const pathSensoren = await prisma.learningPath.findUniqueOrThrow({
    where: { slug: "welt-der-sensoren" },
  });
  const pathAnzeige = await prisma.learningPath.findUniqueOrThrow({
    where: { slug: "anzeige-iot" },
  });

  const courseDefs = [
    {
      pathId: pathLicht.id,
      slug: "erste-lichter",
      title_de: "Erste Lichter mit dem ESP32",
      title_en: "First lights with the ESP32",
      summary_de: "Sechs Mini-Projekte rund um LED, Taster und Buzzer.",
      summary_en: "Six mini projects with LEDs, buttons and buzzers.",
    },
    {
      pathId: pathBewegung.id,
      slug: "bewegung-und-robotik",
      title_de: "Bewegung & Robotik",
      title_en: "Motion & Robotics",
      summary_de: "Motoren, Servos und Bewegungssensoren — sechs Projekte.",
      summary_en: "Motors, servos and motion sensors — six projects.",
    },
    {
      pathId: pathSensoren.id,
      slug: "sensoren-grundlagen",
      title_de: "Sensoren-Grundlagen",
      title_en: "Sensor fundamentals",
      summary_de: "Sechs der wichtigsten Sensoren in der Hobby-Elektronik.",
      summary_en: "Six of the most important sensors in hobby electronics.",
    },
    {
      pathId: pathAnzeige.id,
      slug: "anzeige-und-iot",
      title_de: "Anzeige & IoT",
      title_en: "Display & IoT",
      summary_de:
        "Vom OLED bis zum MQTT-Sensor — wie der ESP32 mit der Welt redet.",
      summary_en:
        "From OLED to MQTT sensor — how the ESP32 talks to the world.",
    },
  ];

  const courseBySlug = new Map<string, { id: string }>();
  let courseIndex = 0;
  for (const c of courseDefs) {
    courseIndex += 1;
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        pathId: c.pathId,
        sortOrder: courseIndex,
        title_de: c.title_de,
        title_en: c.title_en,
        summary_de: c.summary_de,
        summary_en: c.summary_en,
        isPublished: true,
        publishedAt: new Date(),
      },
      update: {
        pathId: c.pathId,
        title_de: c.title_de,
        title_en: c.title_en,
        summary_de: c.summary_de,
        summary_en: c.summary_en,
      },
    });
    courseBySlug.set(c.slug, course);
  }
  function getCourse(slug: string): { id: string } {
    const c = courseBySlug.get(slug);
    if (!c) throw new Error(`Course not seeded: ${slug}`);
    return c;
  }
  const courseLicht = getCourse("erste-lichter");
  const courseBewegung = getCourse("bewegung-und-robotik");
  const courseSensoren = getCourse("sensoren-grundlagen");
  const courseAnzeige = getCourse("anzeige-und-iot");

  // Alias für die existierende Blink-Lesson (lebt im Licht-Kurs)
  const course = courseLicht;

  // Delete existing steps + BOM if lesson exists, then upsert
  const existingLesson = await prisma.lesson.findUnique({
    where: { slug: "esp32-blink-led" },
  });
  if (existingLesson) {
    await prisma.lessonStep.deleteMany({ where: { lessonId: existingLesson.id } });
    await prisma.bOMItem.deleteMany({ where: { lessonId: existingLesson.id } });
  }

  const blinkLesson = await prisma.lesson.upsert({
    where: { slug: "esp32-blink-led" },
    create: {
      slug: "esp32-blink-led",
      courseId: course.id,
      sortOrder: 1,
      kind: "PROJECT",
      xpReward: 100,
      estimatedMinutes: 15,
      title_de: "Eine LED zum Blinken bringen",
      title_en: "Make an LED blink",
      summary_de:
        "Wir bringen ein kleines rotes Lämpchen mit dem ESP32 zum Blinken — Schritt für Schritt.",
      summary_en:
        "We'll make a tiny red lamp blink with the ESP32 — step by step.",
      body_de: "Step-Player-Lesson, siehe Steps.",
      body_en: "Step-player lesson, see steps.",
      safetyNotes_de:
        "Wichtig: Steck die LED NIE direkt in den ESP32 ohne Widerstand — sonst geht sie kaputt. Wir benutzen einen 220-Ω-Widerstand als Bremse.",
      safetyNotes_en:
        "Important: NEVER plug the LED directly into the ESP32 without a resistor — it would burn out. We use a 220 Ω resistor as a brake.",
      codeSnippet: null,
      isPublished: true,
      publishedAt: new Date(),
      recommendedBoards: { connect: [{ id: esp32Board.id }] },
    },
    update: {
      kind: "PROJECT",
      xpReward: 100,
      estimatedMinutes: 15,
      summary_de:
        "Wir bringen ein kleines rotes Lämpchen mit dem ESP32 zum Blinken — Schritt für Schritt.",
      summary_en:
        "We'll make a tiny red lamp blink with the ESP32 — step by step.",
      isPublished: true,
    },
  });

  // BOM
  await prisma.bOMItem.createMany({
    data: [
      {
        lessonId: blinkLesson.id,
        boardId: esp32Board.id,
        quantity: 1,
      },
      {
        lessonId: blinkLesson.id,
        componentId: bbComp.id,
        quantity: 1,
      },
      {
        lessonId: blinkLesson.id,
        componentId: ledComp.id,
        quantity: 1,
      },
      {
        lessonId: blinkLesson.id,
        componentId: resComp.id,
        quantity: 1,
      },
      {
        lessonId: blinkLesson.id,
        componentId: wireComp.id,
        quantity: 2,
      },
    ],
  });

  // attach affiliate links to BOM-Items
  const bomItems = await prisma.bOMItem.findMany({
    where: { lessonId: blinkLesson.id },
    include: { component: true, board: true },
  });
  for (const bi of bomItems) {
    const partId = bi.componentId ?? bi.boardId;
    if (!partId) continue;
    const link = await prisma.affiliateLink.findFirst({
      where: bi.componentId
        ? { componentId: bi.componentId, programId: azProgram.id }
        : { boardId: bi.boardId!, programId: azProgram.id },
    });
    if (link) {
      await prisma.bOMItem.update({
        where: { id: bi.id },
        data: { affiliateLinkId: link.id },
      });
    }
  }

  // Steps — child-friendly, one idea per screen
  const blinkCode = `// ESP32 — Eine LED blinken lassen
const int LED_PIN = 2;   // Wir benutzen GPIO 2

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);  // LED an
  delay(500);                   // 0,5 Sekunden warten
  digitalWrite(LED_PIN, LOW);   // LED aus
  delay(500);                   // 0,5 Sekunden warten
}`;

  await prisma.lessonStep.createMany({
    data: [
      {
        lessonId: blinkLesson.id,
        sortOrder: 0,
        kind: "INTRO",
        title_de: "Was bauen wir?",
        title_en: "What are we building?",
        body_de:
          "Eine LED, die blinkt — wie ein Herzschlag. Du brauchst keine Vorkenntnisse.",
        body_en:
          "A blinking LED — like a heartbeat. No prior knowledge needed.",
        payload: { coverPrompt: "blinking red LED on a breadboard, friendly cartoon style" },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 1,
        kind: "PARTS",
        title_de: "Das brauchst du",
        title_en: "What you need",
        body_de:
          "Wenn du etwas davon nicht hast, kannst du es direkt bei AZ-Delivery bestellen.",
        body_en:
          "If you don't have something yet, you can order it from AZ-Delivery.",
        payload: Prisma.JsonNull,
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 2,
        kind: "SAFETY",
        title_de: "Wichtig zur Sicherheit",
        title_en: "Safety first",
        body_de:
          "Steck die LED NIE direkt an den ESP32. Der Widerstand muss immer dazwischen — er ist die Bremse für den Strom.",
        body_en:
          "Never plug the LED directly into the ESP32. Always use the resistor in between — it's the brake for the current.",
        payload: Prisma.JsonNull,
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 3,
        kind: "EXPLAIN",
        title_de: "Was ist ein GPIO?",
        title_en: "What is a GPIO?",
        body_de:
          "Schau dir den ESP32 an: links und rechts sind viele kleine Metall-Stifte. Das nennt man Pins. Jeder Pin hat eine Nummer, die direkt daneben aufs Board gedruckt ist. GPIO bedeutet einfach: „dieser Pin kann Strom rein- oder rausgeben\". Wir benutzen Pin Nummer 2 — daran schließen wir gleich die LED an.",
        body_en:
          "Look at your ESP32: there are little metal pins along both sides. Each pin has a number printed right next to it on the board. GPIO simply means: \"this pin can let current in or out\". We'll use pin number 2 — that's where we'll connect the LED.",
        payload: {
          keyPoint_de:
            "Wichtig: Such auf deinem Board nach „D2\" oder „GPIO2\". Da kommt gleich das grüne Kabel ran.",
          keyPoint_en:
            "Important: find \"D2\" or \"GPIO2\" on your board — that's where the green wire goes.",
          highlightPin: "GPIO2",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 4,
        kind: "EXPLAIN",
        title_de: "Wie funktioniert das Steckbrett?",
        title_en: "How does the breadboard work?",
        body_de:
          "Schau dir das Bild an: Das Steckbrett hat Löcher in einem Raster. Die Löcher in einer kurzen Spalte (5 Löcher übereinander, gelb markiert) sind innen miteinander verbunden — du kannst dort mehrere Beinchen reinstecken und sie sind elektrisch eins. Oben läuft die rote Plus-Schiene durch, unten die blaue Minus-Schiene — jeweils über das ganze Brett.",
        body_en:
          "Look at the picture: the breadboard has holes in a grid. Holes in a short column (5 holes in a stack, highlighted yellow) are internally connected — you can plug multiple legs into them and they are electrically one. The red plus-rail runs across the top, the blue minus-rail across the bottom.",
        payload: {
          showBreadboardExplainer: true,
          keyPoint_de:
            "Merk dir: gleiche kurze Spalte = verbunden. Rote Schiene oben = Plus, blaue Schiene unten = Minus.",
          keyPoint_en:
            "Remember: same short column = connected. Red rail on top = plus, blue rail at the bottom = minus.",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 5,
        kind: "BUILD",
        title_de: "Schritt 1: Widerstand stecken",
        title_en: "Step 1: Plug in the resistor",
        body_de:
          "Schau im Bild auf den gelb pulsierenden Punkt: das ist Reihe c, Spalte 4. Steck dort ein Beinchen des Widerstands rein. Das andere Beinchen steckst du in Reihe c, Spalte 7. Beide Löcher sind in derselben kurzen Spalte → der Strom kann durchfließen. Das grüne Kabel verbindet GPIO 2 mit dem linken Beinchen.",
        body_en:
          "Look at the yellow pulsing dot in the picture: that's row c, column 4. Plug one leg of the resistor there. Put the other leg into row c, column 7. Both holes are in the same short column → current can flow through. The green wire connects GPIO 2 to the left leg.",
        payload: {
          instruction_de:
            "Der Widerstand hat keine Richtung — egal wie rum du ihn steckst. Buchstaben (a–e) stehen am linken Rand, Zahlen (1–14) oben am Brett.",
          instruction_en:
            "The resistor has no direction — either way works. Letters (a–e) are along the left edge, numbers (1–14) at the top of the board.",
          ledColor: "red",
          highlightWires: ["signal"],
          buildStage: 1,
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 6,
        kind: "BUILD",
        title_de: "Schritt 2: LED stecken",
        title_en: "Step 2: Plug in the LED",
        body_de:
          "Die LED hat zwei verschieden lange Beinchen. Das LANGE Beinchen (= Plus) steckst du in Reihe c, Spalte 7 — also dieselbe kurze Spalte wie das rechte Widerstandsbeinchen. Das KURZE Beinchen (= Minus) steckst du in Reihe a, Spalte 9. Die LED steht jetzt aufrecht zwischen zwei Löchern — nicht in die Löcher des Widerstands oder Kabels.",
        body_en:
          "The LED has two legs of different length. The LONG leg (= plus) goes into row c, column 7 — the same short column as the right leg of the resistor. The SHORT leg (= minus) goes into row a, column 9. The LED stands upright between two holes — not into the resistor or wire holes.",
        payload: {
          instruction_de:
            "Lang = Plus (+), Kurz = Minus (−). Vertauscht: LED bleibt dunkel. Im Bild siehst du die zwei pulsierenden Ziellöcher.",
          instruction_en:
            "Long = plus (+), short = minus (−). Swapped: LED stays dark. The picture shows the two pulsing target holes.",
          ledColor: "red",
          buildStage: 2,
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 7,
        kind: "BUILD",
        title_de: "Schritt 3: GND verbinden",
        title_en: "Step 3: Connect GND",
        body_de:
          "Nimm ein Jumper-Kabel. Das eine Ende steckst du an den GND-Pin am ESP32. Das andere Ende in irgendein Loch der blauen Minus-Schiene ganz unten (das pulsierende Loch im Bild). Damit fließt der Strom: GPIO 2 → Widerstand → LED → Minus-Schiene → GND → Stromkreis geschlossen.",
        body_en:
          "Grab a jumper wire. Plug one end into the GND pin on the ESP32. Plug the other end into any hole on the blue minus rail at the bottom (the pulsing hole in the picture). Now current can flow: GPIO 2 → resistor → LED → minus rail → GND → circuit closed.",
        payload: {
          instruction_de:
            "GND = Minus. Ohne diese Verbindung passiert nichts — Strom braucht einen Rückweg.",
          instruction_en:
            "GND = minus. Without this connection nothing happens — current needs a way back.",
          ledColor: "red",
          highlightWires: ["gnd"],
          buildStage: 3,
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 8,
        kind: "EXPLAIN",
        title_de: "Warum überhaupt ein Widerstand?",
        title_en: "Why do we even need a resistor?",
        body_de:
          "Eine LED ist wie ein dünner Strohhalm: wenn zu viel Strom durchfließt, wird sie sofort kaputt. Der Widerstand ist eine Bremse — er sorgt dafür, dass nur so viel Strom durchkommt, wie die LED verträgt. Ohne Widerstand: PUFF — die LED ist hin (manchmal nach einer Sekunde, manchmal nach zwei Wochen).",
        body_en:
          "An LED is like a thin straw: too much current flowing through and it dies instantly. The resistor is a brake — it limits the current to what the LED can handle. Without it: POP — the LED is gone (sometimes after one second, sometimes after two weeks).",
        payload: {
          keyPoint_de:
            "Faustregel: An jede LED am ESP32 gehört ein Widerstand. Für unsere LED reichen 220 Ω.",
          keyPoint_en:
            "Rule of thumb: every LED on the ESP32 needs a resistor. 220 Ω is fine for our LED.",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 9,
        kind: "SETUP",
        title_de: "Bevor du Code schreibst: das brauchst du am Computer",
        title_en: "Before you write code: what you need on your computer",
        body_de:
          "Den Code schreiben und auf den ESP32 hochladen geht NUR am Computer (Windows, Mac oder Linux) — am Handy oder Tablet leider nicht. Hier ist alles, was du brauchst:",
        body_en:
          "Writing the code and uploading it to the ESP32 only works on a computer (Windows, Mac, or Linux) — phones and tablets won't work. Here's what you need:",
        payload: {
          platformNotice_de:
            "Du brauchst einen Computer mit USB-Port. Smartphone/Tablet funktionieren leider nicht.",
          platformNotice_en:
            "You need a computer with a USB port. Phones and tablets don't work for this.",
          checklist: [
            {
              iconKey: "download",
              label_de: "Arduino IDE installieren",
              label_en: "Install the Arduino IDE",
              hint_de:
                "Das ist das Programm, in das du den Code reinkopierst und mit dem du ihn auf den ESP32 hochlädst. Komplett kostenlos.",
              hint_en:
                "This is the program where you paste the code and upload it to the ESP32. Completely free.",
              link: {
                label_de: "Arduino IDE herunterladen",
                label_en: "Download the Arduino IDE",
                url: "https://www.arduino.cc/en/software",
              },
            },
            {
              iconKey: "usb",
              label_de: "USB-Treiber CP210x installieren",
              label_en: "Install the CP210x USB driver",
              hint_de:
                "Damit dein Computer den ESP32 über USB überhaupt erkennt. Auf manchen Macs/PCs schon vorhanden — wenn der ESP32 später nicht in der Arduino IDE auftaucht, fehlt dieser Treiber.",
              hint_en:
                "So your computer can recognize the ESP32 via USB. Some Macs/PCs already have it — if the ESP32 doesn't show up in the Arduino IDE later, this driver is missing.",
              link: {
                label_de: "CP210x-Treiber bei Silicon Labs",
                label_en: "CP210x driver from Silicon Labs",
                url: "https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers",
              },
            },
            {
              iconKey: "monitor",
              label_de: "ESP32-Boards-Paket in Arduino IDE hinzufügen",
              label_en: "Add the ESP32 boards package to the Arduino IDE",
              hint_de:
                "Arduino IDE öffnen → Datei → Einstellungen → unter „Zusätzliche Boardverwalter-URLs\" eintragen: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json — dann Werkzeuge → Board → Boardverwalter → „esp32\" suchen → Installieren.",
              hint_en:
                "Open Arduino IDE → File → Preferences → in \"Additional Board Manager URLs\" enter: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json — then Tools → Board → Boards Manager → search \"esp32\" → Install.",
            },
            {
              iconKey: "cable",
              label_de: "ESP32 per USB-Kabel anschließen",
              label_en: "Plug in your ESP32 via USB cable",
              hint_de:
                "Manche USB-Kabel sind nur „Ladekabel\" und übertragen keine Daten — wenn dein PC den ESP32 nicht erkennt, ist oft das Kabel das Problem. Probier ein anderes.",
              hint_en:
                "Some USB cables are charge-only and don't carry data — if your PC doesn't recognize the ESP32, the cable is often the issue. Try another one.",
            },
            {
              iconKey: "check",
              label_de: "In Arduino IDE: Board und Port auswählen",
              label_en: "In the Arduino IDE: select board and port",
              hint_de:
                "Werkzeuge → Board → ESP32 Arduino → „ESP32 Dev Module\". Danach Werkzeuge → Port → den richtigen Port wählen (am Mac meist /dev/cu.SLAB_USBtoUART oder ähnlich, am PC ein COM-Port).",
              hint_en:
                "Tools → Board → ESP32 Arduino → \"ESP32 Dev Module\". Then Tools → Port → pick the correct port (on Mac usually /dev/cu.SLAB_USBtoUART or similar, on PC a COM port).",
            },
          ],
          keyPoint_de:
            "Wenn alles installiert ist, brauchst du das nur EINMAL einrichten — für alle zukünftigen Projekte ist es dann da.",
          keyPoint_en:
            "Once installed, this is a one-time setup — it'll be ready for all your future projects.",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 10,
        kind: "CODE_WALK",
        title_de: "Der Code — Zeile für Zeile",
        title_en: "The code — line by line",
        body_de:
          "Klicke auf eine Zeile, dann erklärt sie sich selbst.",
        body_en: "Tap a line and it'll explain itself.",
        payload: {
          code: blinkCode,
          lines: [
            {
              from: 2,
              to: 2,
              explain_de:
                "Wir geben dem Anschluss einen Namen, damit wir ihn später leicht wiederfinden: LED_PIN = 2.",
              explain_en:
                "We give the pin a name so we can find it easily later: LED_PIN = 2.",
            },
            {
              from: 4,
              to: 6,
              explain_de:
                "setup() läuft EINMAL beim Start. Wir sagen dem ESP32: „GPIO 2 ist ein Ausgang.\"",
              explain_en:
                "setup() runs ONCE at start. We tell the ESP32: \"GPIO 2 is an output.\"",
            },
            {
              from: 8,
              to: 13,
              explain_de:
                "loop() läuft IMMER. Hier: LED an → 0,5 s warten → LED aus → 0,5 s warten. Das ergibt das Blinken.",
              explain_en:
                "loop() runs FOREVER. Here: LED on → wait 0.5 s → LED off → wait 0.5 s. That's the blinking.",
            },
          ],
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 11,
        kind: "SIMULATE",
        title_de: "So sollte es aussehen",
        title_en: "Here's what should happen",
        body_de:
          "Hier ist eine Vorschau: drück auf „Simulation starten\". Wenn deine echte LED genauso blinkt, hast du alles richtig gemacht.",
        body_en:
          "Here's a preview: hit \"Start simulator\". If your real LED blinks the same way, you nailed it.",
        payload: {
          expectedBehavior_de: "Die LED blinkt im halben Sekundentakt.",
          expectedBehavior_en: "The LED blinks every half second.",
          animation: "blink",
          ledColor: "red",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 12,
        kind: "QUIZ",
        title_de: "Kurze Frage",
        title_en: "Quick question",
        body_de: "Warum brauchen wir den Widerstand?",
        body_en: "Why do we need the resistor?",
        payload: {
          prompt_de: "Warum brauchen wir den Widerstand?",
          prompt_en: "Why do we need the resistor?",
          options: [
            {
              key: "a",
              label_de: "Damit die LED bunt wird",
              label_en: "To make the LED colorful",
            },
            {
              key: "b",
              label_de:
                "Damit nicht zu viel Strom durch die LED fließt — sie schützt die LED",
              label_en:
                "To stop too much current flowing through the LED — it protects the LED",
            },
            {
              key: "c",
              label_de: "Damit die LED schneller blinkt",
              label_en: "To make the LED blink faster",
            },
          ],
          correctKey: "b",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 13,
        kind: "CELEBRATE",
        title_de: "Geschafft!",
        title_en: "Done!",
        body_de:
          "Du hast gerade dein erstes ESP32-Projekt gebaut. Klasse!",
        body_en:
          "You just built your first ESP32 project. Awesome!",
        payload: { xpAward: 100 },
      },
    ],
  });

  console.log("  ✓ demo lesson: 14 step-player steps");

  // -----------------------------------------------------------------------
  // Helper: Lesson + BOM + Steps + Affiliate-Linking in einem Rutsch
  // -----------------------------------------------------------------------
  type BomSeed = { componentId?: string; boardId?: string; quantity: number };
  type StepSeed = {
    kind: import("@prisma/client").StepKind;
    title_de: string;
    title_en: string;
    body_de: string;
    body_en: string;
    payload?: Record<string, unknown> | null;
  };

  async function seedLesson(input: {
    slug: string;
    sortOrder: number;
    courseId: string;
    title_de: string;
    title_en: string;
    summary_de: string;
    summary_en: string;
    estimatedMinutes: number;
    xpReward: number;
    safetyNotes_de?: string | null;
    safetyNotes_en?: string | null;
    recommendedBoardId: string;
    bom: BomSeed[];
    steps: StepSeed[];
  }) {
    const existing = await prisma.lesson.findUnique({ where: { slug: input.slug } });
    if (existing) {
      await prisma.lessonStep.deleteMany({ where: { lessonId: existing.id } });
      await prisma.bOMItem.deleteMany({ where: { lessonId: existing.id } });
    }

    const lesson = await prisma.lesson.upsert({
      where: { slug: input.slug },
      create: {
        slug: input.slug,
        courseId: input.courseId,
        sortOrder: input.sortOrder,
        kind: "PROJECT",
        xpReward: input.xpReward,
        estimatedMinutes: input.estimatedMinutes,
        title_de: input.title_de,
        title_en: input.title_en,
        summary_de: input.summary_de,
        summary_en: input.summary_en,
        body_de: "Step-Player-Lesson, siehe Steps.",
        body_en: "Step-player lesson, see steps.",
        safetyNotes_de: input.safetyNotes_de ?? null,
        safetyNotes_en: input.safetyNotes_en ?? null,
        isPublished: true,
        publishedAt: new Date(),
        recommendedBoards: { connect: [{ id: input.recommendedBoardId }] },
      },
      update: {
        sortOrder: input.sortOrder,
        xpReward: input.xpReward,
        estimatedMinutes: input.estimatedMinutes,
        title_de: input.title_de,
        title_en: input.title_en,
        summary_de: input.summary_de,
        summary_en: input.summary_en,
        safetyNotes_de: input.safetyNotes_de ?? null,
        safetyNotes_en: input.safetyNotes_en ?? null,
        isPublished: true,
        recommendedBoards: { set: [{ id: input.recommendedBoardId }] },
      },
    });

    await prisma.bOMItem.createMany({
      data: input.bom.map((b) => ({
        lessonId: lesson.id,
        componentId: b.componentId ?? null,
        boardId: b.boardId ?? null,
        quantity: b.quantity,
      })),
    });

    // Affiliate-Link je BOM-Item auf den AZ-Link setzen (Fallback der Anzeige)
    const bomItems = await prisma.bOMItem.findMany({
      where: { lessonId: lesson.id },
    });
    for (const bi of bomItems) {
      const link = await prisma.affiliateLink.findFirst({
        where: bi.componentId
          ? { componentId: bi.componentId, programId: azProgram.id }
          : { boardId: bi.boardId!, programId: azProgram.id },
      });
      if (link) {
        await prisma.bOMItem.update({
          where: { id: bi.id },
          data: { affiliateLinkId: link.id },
        });
      }
    }

    await prisma.lessonStep.createMany({
      data: input.steps.map((s, i) => ({
        lessonId: lesson.id,
        sortOrder: i,
        kind: s.kind,
        title_de: s.title_de,
        title_en: s.title_en,
        body_de: s.body_de,
        body_en: s.body_en,
        payload: (s.payload ?? Prisma.JsonNull) as never,
      })),
    });

    console.log(`  ✓ lesson "${input.title_de}" (${input.steps.length} steps)`);
  }

  // -----------------------------------------------------------------------
  // Lesson 2 — Taster lesen
  // -----------------------------------------------------------------------
  await seedLesson({
    slug: "esp32-button-led",
    courseId: courseLicht.id,
    sortOrder: 2,
    title_de: "Taster: LED auf Knopfdruck",
    title_en: "Button: light an LED on press",
    summary_de:
      "Du steckst einen kleinen Taster ein und programmierst den ESP32 so, dass die LED nur leuchtet, solange du draufdrückst.",
    summary_en:
      "Plug in a small push-button and program the ESP32 so the LED only lights up while you press it.",
    estimatedMinutes: 12,
    xpReward: 80,
    recommendedBoardId: esp32Board.id,
    bom: [
      { boardId: esp32Board.id, quantity: 1 },
      { componentId: bbComp.id, quantity: 1 },
      { componentId: ledComp.id, quantity: 1 },
      { componentId: resComp.id, quantity: 1 },
      { componentId: buttonComp.id, quantity: 1 },
      { componentId: wireComp.id, quantity: 3 },
    ],
    steps: [
      {
        kind: "INTRO",
        title_de: "Was bauen wir?",
        title_en: "What are we building?",
        body_de:
          "Ein Taster. Solange du draufdrückst, leuchtet die LED. Loslassen → LED aus. Die Grundlage für ALLE Bedienungen — von Tastatur bis Lichtschalter.",
        body_en:
          "A push-button. While you press, the LED is on. Release → off. The basis for ALL controls — from keyboards to light switches.",
      },
      {
        kind: "PARTS",
        title_de: "Das brauchst du",
        title_en: "What you need",
        body_de:
          "Die gleichen Teile wie beim Blinken — plus einen kleinen Taster.",
        body_en: "Same parts as the blink lesson — plus a small push-button.",
      },
      {
        kind: "EXPLAIN",
        title_de: "Was ist ein „digitaler Eingang\"?",
        title_en: "What is a \"digital input\"?",
        body_de:
          "Ein GPIO-Pin kann nicht nur Strom RAUSgeben (wie bei der LED), er kann auch HÖREN: liegt da gerade Spannung an oder nicht? Das ist ein digitaler Eingang. Der Taster verbindet GPIO mit Strom, wenn du drückst.",
        body_en:
          "A GPIO pin can not only OUTPUT current (like for the LED), it can also LISTEN: is there voltage right now or not? That's a digital input. The button connects GPIO to power when pressed.",
        payload: {
          keyPoint_de:
            "Wir benutzen den ESP32-internen „Pull-Up\": der Pin liegt von selbst auf HIGH und geht nur beim Drücken auf LOW.",
          keyPoint_en:
            "We use the ESP32's internal pull-up: the pin sits at HIGH by itself and only goes LOW when pressed.",
        },
      },
      {
        kind: "BUILD",
        title_de: "Schritt 1: Taster stecken",
        title_en: "Step 1: Plug in the button",
        body_de:
          "Steck den Taster so ins Steckbrett, dass er die Mittenlücke überbrückt. Die beiden linken Beinchen kommen in Reihe e + f, Spalte 10. Die beiden rechten Beinchen in Reihe e + f, Spalte 12.",
        body_en:
          "Plug the button across the middle gap of the breadboard. Left pins into rows e + f, column 10. Right pins into rows e + f, column 12.",
        payload: {
          instruction_de:
            "Wenn du den Taster drückst, werden die linken und rechten Beinchen leitend verbunden.",
          instruction_en:
            "When you press, the left and right pins become electrically connected.",
        },
      },
      {
        kind: "BUILD",
        title_de: "Schritt 2: Taster verkabeln",
        title_en: "Step 2: Wire the button",
        body_de:
          "Ein Kabel vom GPIO 4 zu einem linken Tasterbeinchen. Ein zweites Kabel vom rechten Tasterbeinchen in die blaue Minus-Schiene unten. Damit ist klar: Drücken = GPIO 4 mit Masse verbunden = der Pin liest LOW.",
        body_en:
          "One wire from GPIO 4 to a left button leg. Second wire from a right button leg to the blue minus rail. Result: press = GPIO 4 connected to ground = pin reads LOW.",
        payload: {
          instruction_de:
            "GPIO 4 ist nur eine Wahl — du könntest auch GPIO 5, 12 oder ähnlich nehmen. Wichtig: derselbe Pin, den wir im Code benutzen.",
          instruction_en:
            "GPIO 4 is just a choice — GPIO 5, 12 etc. would also work. What matters: the same pin we use in the code.",
        },
      },
      {
        kind: "BUILD",
        title_de: "Schritt 3: LED-Schaltung wie vorher",
        title_en: "Step 3: LED circuit like before",
        body_de:
          "LED + Widerstand wie bei der Blink-Lesson — Widerstand von GPIO 2 zur LED-Anode (lang, +), LED-Kathode (kurz, −) über ein Kabel an die blaue Minus-Schiene.",
        body_en:
          "LED + resistor like in the blink lesson — resistor from GPIO 2 to the LED anode (long leg, +), LED cathode (short, −) via wire to the blue minus rail.",
        payload: { buildStage: "all" },
      },
      {
        kind: "CODE_WALK",
        title_de: "Der Code — Zeile für Zeile",
        title_en: "The code — line by line",
        body_de: "Klicke auf eine Zeile, dann erklärt sie sich selbst.",
        body_en: "Tap a line to see what it does.",
        payload: {
          code: `// ESP32 — Taster + LED
const int BTN_PIN = 4;
const int LED_PIN = 2;

void setup() {
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);  // internen Pull-Up aktivieren
}

void loop() {
  int state = digitalRead(BTN_PIN);
  if (state == LOW) {              // gedrückt → LOW (wegen Pull-Up)
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }
}`,
          lines: [
            {
              from: 2,
              to: 3,
              explain_de:
                "Wir geben Taster und LED jeweils einen Namen — so vermeiden wir Tippfehler in Pin-Nummern.",
              explain_en:
                "We name the button pin and the LED pin so we don't mistype numbers later.",
            },
            {
              from: 5,
              to: 8,
              explain_de:
                "setup(): LED ist Ausgang. INPUT_PULLUP für den Taster aktiviert den internen Widerstand — Pin liegt von selbst auf HIGH.",
              explain_en:
                "setup(): LED is output. INPUT_PULLUP enables the internal resistor — pin sits at HIGH by itself.",
            },
            {
              from: 10,
              to: 16,
              explain_de:
                "Im loop fragen wir ständig: ist der Pin LOW? Wenn ja → LED an. Sonst → LED aus.",
              explain_en:
                "In loop we constantly ask: is the pin LOW? If yes → LED on. Otherwise → off.",
            },
          ],
        },
      },
      {
        kind: "QUIZ",
        title_de: "Kurze Frage",
        title_en: "Quick question",
        body_de: "Warum benutzen wir INPUT_PULLUP?",
        body_en: "Why do we use INPUT_PULLUP?",
        payload: {
          prompt_de:
            "Warum benutzen wir bei pinMode INPUT_PULLUP statt einfach INPUT?",
          prompt_en:
            "Why do we use INPUT_PULLUP at pinMode instead of just INPUT?",
          options: [
            {
              key: "a",
              label_de:
                "Damit der Pin nicht „herumflattert\" — er liegt fest auf HIGH, bis der Taster ihn auf LOW zieht.",
              label_en:
                "So the pin doesn't \"float\" — it sits firmly at HIGH until the button pulls it to LOW.",
            },
            {
              key: "b",
              label_de: "Damit der ESP32 mehr Strom durchlässt.",
              label_en: "So the ESP32 lets more current through.",
            },
            {
              key: "c",
              label_de: "Damit die LED heller wird.",
              label_en: "To make the LED brighter.",
            },
          ],
          correctKey: "a",
        },
      },
      {
        kind: "CELEBRATE",
        title_de: "Geschafft!",
        title_en: "Done!",
        body_de:
          "Du hast eine Eingabe gelesen und auf eine Ausgabe reagiert — das ist die Basis jeder interaktiven Schaltung.",
        body_en:
          "You read an input and reacted with an output — the foundation of every interactive circuit.",
        payload: { xpAward: 80 },
      },
    ],
  });

  // -----------------------------------------------------------------------
  // Lesson 3 — LED dimmen mit PWM
  // -----------------------------------------------------------------------
  await seedLesson({
    slug: "esp32-pwm-fade",
    courseId: courseLicht.id,
    sortOrder: 3,
    title_de: "Helligkeit steuern: LED weich dimmen",
    title_en: "Brightness control: smoothly fade an LED",
    summary_de:
      "Statt nur AN/AUS lassen wir die LED stufenlos heller und dunkler werden — mit PWM (das gleiche Prinzip, das auch Lautstärke regelt).",
    summary_en:
      "Instead of just ON/OFF we make the LED gradually brighter and darker — with PWM (the same trick that controls volume).",
    estimatedMinutes: 10,
    xpReward: 80,
    recommendedBoardId: esp32Board.id,
    bom: [
      { boardId: esp32Board.id, quantity: 1 },
      { componentId: bbComp.id, quantity: 1 },
      { componentId: ledComp.id, quantity: 1 },
      { componentId: resComp.id, quantity: 1 },
      { componentId: wireComp.id, quantity: 2 },
    ],
    steps: [
      {
        kind: "INTRO",
        title_de: "Was bauen wir?",
        title_en: "What are we building?",
        body_de:
          "Eine LED, die langsam heller wird und dann wieder dunkler. Wie ein „Atem\". Hardware-seitig wie Blink, aber der Code wird klüger.",
        body_en:
          "An LED that slowly brightens and then dims. Like \"breathing\". Same hardware as blink, the code gets smarter.",
      },
      {
        kind: "PARTS",
        title_de: "Das brauchst du",
        title_en: "What you need",
        body_de:
          "Genau dieselben Teile wie bei der Blink-Lesson — nichts Neues nötig.",
        body_en: "Exactly the same parts as in the blink lesson — nothing new needed.",
      },
      {
        kind: "EXPLAIN",
        title_de: "Was ist PWM?",
        title_en: "What is PWM?",
        body_de:
          "Pulsweitenmodulation. Der ESP32 schaltet die LED so schnell EIN/AUS, dass dein Auge kein Flackern mehr sieht — nur Helligkeit. Je länger ON-Zeit pro Pulszyklus, desto heller wirkt die LED. Das geht von 0 (dauerhaft aus) bis 255 (dauerhaft an).",
        body_en:
          "Pulse-width modulation. The ESP32 toggles the LED so fast that your eye doesn't see flicker — just brightness. The longer the ON-time per pulse, the brighter the LED looks. Range: 0 (always off) to 255 (always on).",
        payload: {
          keyPoint_de:
            "Beim ESP32 kann fast JEDER GPIO PWM. Wir nehmen GPIO 2, damit nichts umgesteckt werden muss.",
          keyPoint_en:
            "On the ESP32, almost EVERY GPIO can do PWM. We stick with GPIO 2 — no rewiring needed.",
        },
      },
      {
        kind: "CODE_WALK",
        title_de: "Der Code — Zeile für Zeile",
        title_en: "The code — line by line",
        body_de: "Klick auf eine Zeile.",
        body_en: "Tap a line.",
        payload: {
          code: `// ESP32 — LED weich dimmen
const int LED_PIN = 2;
const int CHANNEL = 0;        // PWM-Kanal (0..15)
const int FREQ = 5000;        // Hz — schnell genug, kein Flackern
const int RES_BITS = 8;       // 8 Bit → Werte 0..255

void setup() {
  ledcSetup(CHANNEL, FREQ, RES_BITS);
  ledcAttachPin(LED_PIN, CHANNEL);
}

void loop() {
  // Heller werden
  for (int v = 0; v <= 255; v++) {
    ledcWrite(CHANNEL, v);
    delay(5);
  }
  // Dunkler werden
  for (int v = 255; v >= 0; v--) {
    ledcWrite(CHANNEL, v);
    delay(5);
  }
}`,
          lines: [
            {
              from: 2,
              to: 5,
              explain_de:
                "Konstanten: welcher Pin, welcher PWM-Kanal, Pulsrate und Auflösung. 8 Bit = 256 Helligkeitsstufen.",
              explain_en:
                "Constants: which pin, which PWM channel, pulse rate, resolution. 8 bits = 256 brightness levels.",
            },
            {
              from: 7,
              to: 10,
              explain_de:
                "Setup: PWM-Kanal konfigurieren und an unseren Pin koppeln. Danach kann der ESP32 das selbständig.",
              explain_en:
                "Setup: configure the PWM channel and attach our pin. From here the ESP32 handles it autonomously.",
            },
            {
              from: 12,
              to: 22,
              explain_de:
                "Loop: zwei for-Schleifen. Erst von 0 hoch auf 255 (heller), dann von 255 runter auf 0 (dunkler). Das ergibt den Atem-Effekt.",
              explain_en:
                "Loop: two for-loops. First 0 up to 255 (brighter), then 255 down to 0 (dimmer). Result: the breathing effect.",
            },
          ],
        },
      },
      {
        kind: "SIMULATE",
        title_de: "So sollte es aussehen",
        title_en: "Here's what should happen",
        body_de: "Probier es im Simulator: die LED atmet.",
        body_en: "Try it in the simulator: the LED breathes.",
        payload: {
          expectedBehavior_de: "Die LED wird langsam heller und dann wieder dunkler — wie ein Atem.",
          expectedBehavior_en: "The LED slowly brightens and dims — like breathing.",
          animation: "fade",
          ledColor: "red",
        },
      },
      {
        kind: "QUIZ",
        title_de: "Kurze Frage",
        title_en: "Quick question",
        body_de: "Wie macht PWM eine LED dunkler, ohne die Spannung zu ändern?",
        body_en: "How does PWM dim an LED without changing the voltage?",
        payload: {
          prompt_de:
            "Wie macht PWM eine LED dunkler, ohne die Spannung zu ändern?",
          prompt_en:
            "How does PWM dim an LED without changing the voltage?",
          options: [
            {
              key: "a",
              label_de:
                "Schaltet die LED sehr schnell EIN und AUS — kürzer EIN = dunkler.",
              label_en:
                "Switches the LED on/off very fast — shorter ON = dimmer.",
            },
            {
              key: "b",
              label_de: "Reduziert die Anzahl der Elektronen.",
              label_en: "Reduces the number of electrons.",
            },
            {
              key: "c",
              label_de: "Schaltet auf 1,5 V herunter statt 3,3 V.",
              label_en: "Drops to 1.5 V instead of 3.3 V.",
            },
          ],
          correctKey: "a",
        },
      },
      {
        kind: "CELEBRATE",
        title_de: "Geschafft!",
        title_en: "Done!",
        body_de:
          "Mit PWM kannst du jetzt nicht nur LEDs dimmen — auch Motoren langsamer drehen oder Servos ansteuern (kommt gleich).",
        body_en:
          "With PWM you can now not only dim LEDs — also slow down motors or drive servos (coming up).",
        payload: { xpAward: 80 },
      },
    ],
  });

  // -----------------------------------------------------------------------
  // Lesson 4 — Servo bewegen
  // -----------------------------------------------------------------------
  await seedLesson({
    slug: "esp32-servo-sweep",
    courseId: courseBewegung.id,
    sortOrder: 1,
    title_de: "Servo: Bewegung steuern",
    title_en: "Servo: control movement",
    summary_de:
      "Ein Servo ist ein Mini-Motor, der sich auf einen genauen Winkel dreht. Wir lassen ihn von 0° nach 180° fahren — wie ein Wischer.",
    summary_en:
      "A servo is a tiny motor that rotates to a precise angle. We sweep it from 0° to 180° — like a windshield wiper.",
    estimatedMinutes: 12,
    xpReward: 90,
    safetyNotes_de:
      "Kleine Servos (SG90) ziehen kurzzeitig spitzenartig Strom. Wenn der ESP32 beim Drehen rebootet, versorge den Servo separat über 5 V (z.B. USB-Netzteil) und verbinde nur GND mit dem ESP32 — nicht den 5V-Pin direkt.",
    safetyNotes_en:
      "Small servos (SG90) draw spike currents. If the ESP32 reboots during motion, power the servo separately from 5 V (e.g. USB power supply) and connect only GND back to the ESP32 — not the 5V pin directly.",
    recommendedBoardId: esp32Board.id,
    bom: [
      { boardId: esp32Board.id, quantity: 1 },
      { componentId: bbComp.id, quantity: 1 },
      { componentId: servoComp.id, quantity: 1 },
      { componentId: wireComp.id, quantity: 3 },
    ],
    steps: [
      {
        kind: "INTRO",
        title_de: "Was bauen wir?",
        title_en: "What are we building?",
        body_de:
          "Ein Servo, der von links nach rechts und zurück fährt. Damit kannst du Klappen öffnen, Roboterarme bewegen oder Zeiger einer Anzeige steuern.",
        body_en:
          "A servo sweeping left to right and back. With this you can open flaps, move robot arms, or drive dial pointers.",
      },
      {
        kind: "PARTS",
        title_de: "Das brauchst du",
        title_en: "What you need",
        body_de: "Ein kleiner SG90 Servo — günstig und ideal zum Lernen.",
        body_en: "A tiny SG90 servo — cheap and perfect to learn with.",
      },
      {
        kind: "SAFETY",
        title_de: "Wichtig zur Sicherheit",
        title_en: "Safety first",
        body_de:
          "Der Servo läuft offiziell mit 5 V. Beim Anlaufen zieht er kurz viel Strom — manche ESP32-Module rebooten dann. Wenn das passiert: Servo direkt am USB-Netzteil oder einer 5V-Batterie versorgen, GND aber mit dem ESP32 verbinden.",
        body_en:
          "The servo officially runs on 5 V. At startup it briefly draws a lot of current — some ESP32 modules reboot. If that happens: power the servo from a USB adapter or 5V battery directly, but tie GND back to the ESP32.",
      },
      {
        kind: "BUILD",
        title_de: "Verkabelung",
        title_en: "Wiring",
        body_de:
          "Der Servo hat drei Adern: braun = GND (Minus), rot = 5 V, orange/gelb = Signal. Braun → GND am ESP32, Rot → 5V am ESP32 (oder externe 5V), Gelb → GPIO 18 am ESP32.",
        body_en:
          "The servo has three wires: brown = GND, red = 5 V, orange/yellow = signal. Brown → ESP32 GND, red → ESP32 5V (or external 5V), yellow → ESP32 GPIO 18.",
        payload: {
          instruction_de:
            "Falls dein ESP32 beim Servo-Start abstürzt: rote Ader an USB-Netzteil 5V, braune Ader gemeinsam mit ESP32-GND verbinden.",
          instruction_en:
            "If your ESP32 crashes at servo start: red wire to USB-PSU 5V, brown wire to common ground with the ESP32.",
        },
      },
      {
        kind: "CODE_WALK",
        title_de: "Der Code — Zeile für Zeile",
        title_en: "The code — line by line",
        body_de: "Bibliothek „ESP32Servo\" verwendet — in Arduino IDE einmal installieren.",
        body_en: "Uses the \"ESP32Servo\" library — install it once in the Arduino IDE.",
        payload: {
          code: `// ESP32 — Servo sweep
#include <ESP32Servo.h>

Servo myServo;
const int SERVO_PIN = 18;

void setup() {
  myServo.attach(SERVO_PIN, 500, 2400);  // Min/Max Pulse-Width (µs)
}

void loop() {
  for (int a = 0; a <= 180; a++) {
    myServo.write(a);
    delay(15);
  }
  for (int a = 180; a >= 0; a--) {
    myServo.write(a);
    delay(15);
  }
}`,
          lines: [
            {
              from: 2,
              to: 5,
              explain_de:
                "Bibliothek einbinden, Servo-Objekt anlegen, Pin festlegen.",
              explain_en:
                "Include library, create servo object, set the pin.",
            },
            {
              from: 7,
              to: 9,
              explain_de:
                "setup(): Servo an den Pin koppeln, mit Pulse-Width-Grenzen (500–2400 µs) für den SG90.",
              explain_en:
                "setup(): attach the servo to the pin with pulse-width limits (500–2400 µs) for the SG90.",
            },
            {
              from: 11,
              to: 19,
              explain_de:
                "Loop: erst von 0° nach 180° fahren, dann zurück. Jede Iteration 15 ms — sonst zu schnell.",
              explain_en:
                "Loop: sweep 0°→180°, then back. 15 ms per step — otherwise too fast.",
            },
          ],
        },
      },
      {
        kind: "QUIZ",
        title_de: "Kurze Frage",
        title_en: "Quick question",
        body_de: "Warum kann es passieren, dass der ESP32 beim Servo-Start rebootet?",
        body_en: "Why can the ESP32 reboot when the servo starts?",
        payload: {
          prompt_de: "Warum kann es passieren, dass der ESP32 beim Servo-Start rebootet?",
          prompt_en: "Why can the ESP32 reboot when the servo starts?",
          options: [
            {
              key: "a",
              label_de: "Weil der Servo kurzzeitig viel Strom zieht und der ESP32-USB nicht genug liefert.",
              label_en: "Because the servo briefly pulls a lot of current and the ESP32 USB can't supply it.",
            },
            {
              key: "b",
              label_de: "Weil der Code falsch geschrieben ist.",
              label_en: "Because the code is written incorrectly.",
            },
            {
              key: "c",
              label_de: "Weil GPIO 18 nicht für Servos geeignet ist.",
              label_en: "Because GPIO 18 isn't suitable for servos.",
            },
          ],
          correctKey: "a",
        },
      },
      {
        kind: "CELEBRATE",
        title_de: "Geschafft!",
        title_en: "Done!",
        body_de:
          "Du steuerst jetzt physische Bewegung mit Code. Roboter, Klappen, Zeiger — alles möglich.",
        body_en:
          "You now control physical motion with code. Robots, flaps, dials — all on the table.",
        payload: { xpAward: 90 },
      },
    ],
  });

  // -----------------------------------------------------------------------
  // Lesson 5 — DHT22 Temperatur & Feuchte
  // -----------------------------------------------------------------------
  await seedLesson({
    slug: "esp32-dht22-temperature",
    courseId: courseSensoren.id,
    sortOrder: 1,
    title_de: "Temperatur & Luftfeuchte messen",
    title_en: "Measure temperature & humidity",
    summary_de:
      "Mit dem DHT22-Sensor liest der ESP32 Temperatur und Feuchte aus der Luft — Grundlage für jedes Raumklima-, Wetter- oder Gewächshaus-Projekt.",
    summary_en:
      "With the DHT22 sensor the ESP32 reads air temperature and humidity — foundation for any climate, weather or greenhouse project.",
    estimatedMinutes: 15,
    xpReward: 100,
    recommendedBoardId: esp32Board.id,
    bom: [
      { boardId: esp32Board.id, quantity: 1 },
      { componentId: bbComp.id, quantity: 1 },
      { componentId: dhtComp.id, quantity: 1 },
      { componentId: wireComp.id, quantity: 3 },
    ],
    steps: [
      {
        kind: "INTRO",
        title_de: "Was bauen wir?",
        title_en: "What are we building?",
        body_de:
          "Ein digitales Thermometer + Feuchtemesser. Werte erscheinen alle 2 Sekunden im seriellen Monitor der Arduino IDE.",
        body_en:
          "A digital thermometer + humidity meter. Values appear every 2 seconds in the Arduino IDE serial monitor.",
      },
      {
        kind: "PARTS",
        title_de: "Das brauchst du",
        title_en: "What you need",
        body_de:
          "Wir empfehlen die Modul-Variante (3-Pin-Platine) — die hat den Pull-Up-Widerstand bereits eingebaut.",
        body_en:
          "We recommend the module version (3-pin board) — the pull-up resistor is already on it.",
      },
      {
        kind: "EXPLAIN",
        title_de: "Wie kommunizieren Sensoren mit dem ESP32?",
        title_en: "How do sensors talk to the ESP32?",
        body_de:
          "Der DHT22 nutzt ein einfaches 1-Wire-Protokoll: über EINEN Datendraht wird im Mikrosekundentakt eine Folge aus High/Low geschickt — daraus baut die Bibliothek die Werte zusammen. Du musst das nicht selbst codieren.",
        body_en:
          "The DHT22 uses a simple 1-wire protocol: a series of highs/lows on ONE data wire — the library decodes the values for you. You don't need to write the low-level code.",
        payload: {
          keyPoint_de:
            "Komplexes Protokoll versteckt sich hinter einer simplen Library-API: dht.readTemperature() — fertig.",
          keyPoint_en:
            "Complex protocol hidden behind a simple library API: dht.readTemperature() — done.",
        },
      },
      {
        kind: "BUILD",
        title_de: "Verkabelung",
        title_en: "Wiring",
        body_de:
          "DHT22-Modul (3 Pins): + an 3,3 V am ESP32, − an GND, OUT an GPIO 4. Mehr brauchst du nicht.",
        body_en:
          "DHT22 module (3 pins): + to 3.3 V on the ESP32, − to GND, OUT to GPIO 4. Nothing else.",
        payload: {
          instruction_de:
            "Bei der Sensor-Variante OHNE Platine: zusätzlich 10 kΩ-Widerstand zwischen Daten-Pin und VCC einbauen.",
          instruction_en:
            "For the bare sensor variant: add a 10 kΩ resistor between data and VCC.",
        },
      },
      {
        kind: "CODE_WALK",
        title_de: "Der Code — Zeile für Zeile",
        title_en: "The code — line by line",
        body_de: "Bibliothek „DHT sensor library by Adafruit\" einmal installieren.",
        body_en: "Install the \"DHT sensor library by Adafruit\" once.",
        payload: {
          code: `// ESP32 — DHT22 lesen
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(115200);
  dht.begin();
}

void loop() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h)) {
    Serial.println("Sensor antwortet nicht");
    return;
  }
  Serial.print("Temp: ");
  Serial.print(t);
  Serial.print(" °C  |  Feuchte: ");
  Serial.print(h);
  Serial.println(" %");
  delay(2000);
}`,
          lines: [
            {
              from: 2,
              to: 7,
              explain_de:
                "Library laden, Pin und Sensor-Typ angeben, Sensor-Objekt erzeugen.",
              explain_en:
                "Load library, declare pin and sensor type, create the sensor object.",
            },
            {
              from: 9,
              to: 12,
              explain_de:
                "setup(): seriellen Monitor mit 115200 Baud starten und Sensor initialisieren.",
              explain_en:
                "setup(): start the serial monitor at 115200 baud and init the sensor.",
            },
            {
              from: 14,
              to: 26,
              explain_de:
                "Alle 2 Sekunden Temperatur und Feuchte lesen, prüfen ob Werte gültig sind, und auf den Monitor schreiben.",
              explain_en:
                "Every 2 seconds read temperature + humidity, check validity, print to the monitor.",
            },
          ],
        },
      },
      {
        kind: "QUIZ",
        title_de: "Kurze Frage",
        title_en: "Quick question",
        body_de: "Was machst du, wenn dht.readTemperature() NaN zurückgibt?",
        body_en: "What do you do if dht.readTemperature() returns NaN?",
        payload: {
          prompt_de: "Was machst du, wenn dht.readTemperature() NaN zurückgibt?",
          prompt_en: "What do you do if dht.readTemperature() returns NaN?",
          options: [
            {
              key: "a",
              label_de: "Fehler ignorieren, weiter rechnen — wird schon passen.",
              label_en: "Ignore the error and use the value anyway.",
            },
            {
              key: "b",
              label_de: "Mit isnan() prüfen und in dem Fall NICHTS ausgeben — der Sensor hat in dem Moment nicht geantwortet.",
              label_en: "Check with isnan() and print nothing in that case — the sensor didn't respond.",
            },
            {
              key: "c",
              label_de: "Den ESP32 neu starten.",
              label_en: "Reboot the ESP32.",
            },
          ],
          correctKey: "b",
        },
      },
      {
        kind: "CELEBRATE",
        title_de: "Geschafft!",
        title_en: "Done!",
        body_de:
          "Dein ESP32 versteht jetzt seine Umgebung. Nächster Schritt: diese Werte ans Internet schicken.",
        body_en:
          "Your ESP32 now senses its environment. Next step: send these values to the internet.",
        payload: { xpAward: 100 },
      },
    ],
  });

  // -----------------------------------------------------------------------
  // Lesson 6 — WLAN-Scan
  // -----------------------------------------------------------------------
  await seedLesson({
    slug: "esp32-wifi-scan",
    courseId: courseAnzeige.id,
    sortOrder: 1,
    title_de: "WLAN scannen: Welche Netze sind in Reichweite?",
    title_en: "WiFi scan: which networks are in range?",
    summary_de:
      "Der ESP32 hat WLAN eingebaut. Wir lassen ihn alle Netze in der Umgebung auflisten — mit Signalstärke. Erster Schritt zu IoT.",
    summary_en:
      "The ESP32 has WiFi built-in. Let it list all nearby networks — with signal strength. First step toward IoT.",
    estimatedMinutes: 8,
    xpReward: 70,
    recommendedBoardId: esp32Board.id,
    bom: [{ boardId: esp32Board.id, quantity: 1 }],
    steps: [
      {
        kind: "INTRO",
        title_de: "Was bauen wir?",
        title_en: "What are we building?",
        body_de:
          "Diesmal KEINE Hardware. Nur Code: der ESP32 scannt die Umgebung und gibt dir aus, welche WLANs er sieht und wie stark sie sind.",
        body_en:
          "No hardware this time. Just code: the ESP32 scans the environment and tells you which WiFi networks it sees and how strong they are.",
      },
      {
        kind: "PARTS",
        title_de: "Das brauchst du",
        title_en: "What you need",
        body_de: "Nur den ESP32 und ein USB-Kabel. Kein Steckbrett, keine LEDs.",
        body_en: "Just the ESP32 and a USB cable. No breadboard, no LEDs.",
      },
      {
        kind: "EXPLAIN",
        title_de: "Was ist eigentlich WLAN?",
        title_en: "What is WiFi anyway?",
        body_de:
          "Funkwellen im 2,4-GHz-Band. Jeder Access-Point sendet seinen Namen (SSID) und seine Signalstärke (RSSI in dBm — je negativer, desto schwächer). Der ESP32 kann mithören.",
        body_en:
          "Radio waves in the 2.4 GHz band. Each access point broadcasts its name (SSID) and signal strength (RSSI in dBm — more negative = weaker). The ESP32 can listen.",
        payload: {
          keyPoint_de:
            "Faustregel RSSI: -50 dBm = top, -70 dBm = ok, -90 dBm = grenzwertig.",
          keyPoint_en:
            "RSSI rule of thumb: -50 dBm = great, -70 dBm = ok, -90 dBm = barely.",
        },
      },
      {
        kind: "CODE_WALK",
        title_de: "Der Code — Zeile für Zeile",
        title_en: "The code — line by line",
        body_de: "Die WiFi.h ist beim ESP32 schon vorinstalliert.",
        body_en: "WiFi.h ships with the ESP32 board package.",
        payload: {
          code: `// ESP32 — WLAN-Scan
#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
}

void loop() {
  Serial.println("Scanne…");
  int n = WiFi.scanNetworks();
  Serial.printf("Gefundene Netze: %d\\n", n);
  for (int i = 0; i < n; ++i) {
    Serial.printf("  %2d  %-32s  %d dBm\\n",
                  i + 1,
                  WiFi.SSID(i).c_str(),
                  WiFi.RSSI(i));
  }
  delay(5000);
}`,
          lines: [
            {
              from: 4,
              to: 9,
              explain_de:
                "setup(): seriellen Monitor öffnen, WLAN in „Station\"-Modus (wir verbinden nicht, wir scannen nur) und kurz disconnecten.",
              explain_en:
                "setup(): open serial monitor, set WiFi to \"station\" mode (we don't connect, we just scan), and disconnect briefly.",
            },
            {
              from: 11,
              to: 21,
              explain_de:
                "Loop: scanNetworks() liefert die Anzahl. Dann gehen wir die Liste durch und drucken Nummer, SSID und Signalstärke.",
              explain_en:
                "Loop: scanNetworks() returns the count. Then we walk the list and print number, SSID and signal strength.",
            },
          ],
        },
      },
      {
        kind: "QUIZ",
        title_de: "Kurze Frage",
        title_en: "Quick question",
        body_de:
          "Welcher RSSI-Wert deutet auf besseren Empfang hin?",
        body_en: "Which RSSI value indicates better reception?",
        payload: {
          prompt_de: "Welcher RSSI-Wert deutet auf besseren Empfang hin?",
          prompt_en: "Which RSSI value indicates better reception?",
          options: [
            { key: "a", label_de: "-90 dBm", label_en: "-90 dBm" },
            { key: "b", label_de: "-50 dBm", label_en: "-50 dBm" },
            { key: "c", label_de: "0 dBm — Geräte messen so positiv", label_en: "0 dBm — that's how it's measured" },
          ],
          correctKey: "b",
        },
      },
      {
        kind: "CELEBRATE",
        title_de: "Geschafft!",
        title_en: "Done!",
        body_de:
          "Dein ESP32 ist jetzt offiziell im Internet of Things angekommen. Nächste Lesson: an dein eigenes WLAN andocken.",
        body_en:
          "Your ESP32 is officially in the Internet of Things now. Next lesson: connect to your own WiFi.",
        payload: { xpAward: 70 },
      },
    ],
  });

  // -----------------------------------------------------------------------
  // Generierte Lessons (aus prisma/lessons/specs/ + content/) einlesen.
  // -----------------------------------------------------------------------
  const generated = await loadGeneratedLessons();
  if (generated.length > 0) {
    console.log(`  📥 ${generated.length} generierte Lessons werden geseedet…`);
  }

  // Hilfs-Caches für Slug→ID-Lookups
  const boardCache = new Map<string, { id: string }>();
  const componentCache = new Map<string, { id: string }>();

  async function resolveBoard(slug: string): Promise<{ id: string }> {
    const cached = boardCache.get(slug);
    if (cached) return cached;
    const b = await prisma.board.findUnique({ where: { slug } });
    if (!b) throw new Error(`Board nicht im Seed: ${slug}`);
    boardCache.set(slug, b);
    return b;
  }
  async function resolveComponent(slug: string): Promise<{ id: string }> {
    const cached = componentCache.get(slug);
    if (cached) return cached;
    const c = await prisma.component.findUnique({ where: { slug } });
    if (!c) throw new Error(`Component nicht im Seed: ${slug}`);
    componentCache.set(slug, c);
    return c;
  }

  for (const pair of generated) {
    const { spec, content } = pair;
    const courseId = courseBySlug.get(spec.courseSlug)?.id;
    if (!courseId) {
      console.warn(`  ⚠ unbekannter courseSlug für ${spec.slug}: ${spec.courseSlug}`);
      continue;
    }
    const board = await resolveBoard(spec.boardSlug);

    const bomResolved: { componentId?: string; boardId?: string; quantity: number }[] = [];
    for (const item of spec.bom) {
      if (item.kind === "board") {
        const b = await resolveBoard(item.slug);
        bomResolved.push({ boardId: b.id, quantity: item.qty });
      } else {
        const c = await resolveComponent(item.slug);
        bomResolved.push({ componentId: c.id, quantity: item.qty });
      }
    }

    await seedLesson({
      slug: content.slug,
      sortOrder: spec.sortOrder,
      courseId,
      title_de: content.title_de,
      title_en: content.title_en,
      summary_de: content.summary_de,
      summary_en: content.summary_en,
      estimatedMinutes: content.estimatedMinutes,
      xpReward: content.xpReward,
      safetyNotes_de: content.safetyNotes_de,
      safetyNotes_en: content.safetyNotes_en,
      recommendedBoardId: board.id,
      bom: bomResolved,
      steps: content.steps.map((s) => ({
        kind: s.kind,
        title_de: s.title_de,
        title_en: s.title_en,
        body_de: s.body_de,
        body_en: s.body_en,
        payload: (s.payload ?? null) as Record<string, unknown> | null,
      })),
    });
  }

  console.log("✅ done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
