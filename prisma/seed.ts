import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
      logicLevel: "V3_3" as const,
      voltageMin: 3.0,
      voltageMax: 3.6,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART", "WIFI", "BLE", "MQTT"] as const,
      description_de:
        "Beliebter Dual-Core-Mikrocontroller mit WiFi und Bluetooth. 3,3 V Logikpegel — beim Anschluss von 5 V-Sensoren Pegelwandler verwenden.",
      description_en:
        "Popular dual-core MCU with WiFi and Bluetooth. 3.3 V logic level — use level shifters for 5 V sensors.",
    },
    {
      slug: "arduino-uno-r3",
      name: "Arduino Uno R3",
      manufacturer: "Arduino",
      family: "AVR",
      logicLevel: "V5" as const,
      voltageMin: 4.5,
      voltageMax: 5.5,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART"] as const,
      description_de:
        "Klassisches Einstiegsboard, robust und gut dokumentiert. 5 V Logikpegel.",
      description_en:
        "The classic beginner board — robust, well documented. 5 V logic level.",
    },
    {
      slug: "raspberry-pi-pico",
      name: "Raspberry Pi Pico",
      manufacturer: "Raspberry Pi Foundation",
      family: "RP2040",
      logicLevel: "V3_3" as const,
      voltageMin: 1.8,
      voltageMax: 5.5,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART"] as const,
      description_de:
        "Günstig, Dual-Core ARM Cortex-M0+, programmierbar mit MicroPython oder C/C++.",
      description_en:
        "Affordable dual-core ARM Cortex-M0+, programmable with MicroPython or C/C++.",
    },
    {
      slug: "esp8266-nodemcu",
      name: "ESP8266 NodeMCU",
      manufacturer: "Espressif",
      family: "ESP8266",
      logicLevel: "V3_3" as const,
      voltageMin: 3.0,
      voltageMax: 3.6,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART", "WIFI", "MQTT"] as const,
      description_de:
        "WiFi-Klassiker für IoT-Einsteiger. 3,3 V Logikpegel.",
      description_en: "The classic WiFi IoT entry board. 3.3 V logic level.",
    },
    {
      slug: "arduino-nano",
      name: "Arduino Nano",
      manufacturer: "Arduino",
      family: "AVR",
      logicLevel: "V5" as const,
      voltageMin: 4.5,
      voltageMax: 5.5,
      protocols: ["GPIO", "PWM", "ADC", "I2C", "SPI", "UART"] as const,
      description_de:
        "Kompakte Uno-Variante, ideal für Steckbrett-Projekte.",
      description_en:
        "Compact Uno variant — perfect for breadboard projects.",
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
  // Affiliate programs (seeded inactive — admin activates manually)
  // -----------------------------------------------------------------------
  const programs = [
    {
      merchant: "AZ_DELIVERY" as const,
      displayName: "AZ-Delivery",
      urlTemplate: "https://www.az-delivery.de/products/{slug}?ref={trackingId}",
      isActive: false,
    },
    {
      merchant: "BERRYBASE" as const,
      displayName: "BerryBase",
      urlTemplate: "https://www.berrybase.de/{slug}",
      isActive: false,
    },
    {
      merchant: "REICHELT" as const,
      displayName: "Reichelt Elektronik",
      urlTemplate: "https://www.reichelt.de/{slug}",
      isActive: false,
    },
    {
      merchant: "AMAZON_DE" as const,
      displayName: "Amazon DE",
      urlTemplate: "https://www.amazon.de/dp/{slug}?tag={trackingId}",
      isActive: false,
    },
  ];
  for (const p of programs) {
    await prisma.affiliateProgram.upsert({
      where: { merchant: p.merchant },
      create: p,
      update: p,
    });
  }
  console.log(`  ✓ ${programs.length} affiliate programs (inactive)`);

  // -----------------------------------------------------------------------
  // Learning paths (one per level)
  // -----------------------------------------------------------------------
  const paths = [
    {
      slug: "esp32-basics",
      level: "L1_BEGINNER" as const,
      estimatedHours: 6,
      sortOrder: 1,
      title_de: "ESP32 Grundlagen",
      title_en: "ESP32 Basics",
      summary_de:
        "Vom ersten Blink bis zum WLAN-Sensor. Schritt-für-Schritt mit Simulator.",
      summary_en:
        "From your first blink to a WiFi sensor. Step-by-step with the simulator.",
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "arduino-first-projects",
      level: "L2_NOVICE" as const,
      estimatedHours: 8,
      sortOrder: 2,
      title_de: "Arduino — erste Projekte",
      title_en: "Arduino — First Projects",
      summary_de:
        "Sensoren, Aktoren, kleine Automatisierungen mit Arduino Uno.",
      summary_en:
        "Sensors, actuators, small automation projects with the Arduino Uno.",
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "iot-with-mqtt",
      level: "L3_INTERMEDIATE" as const,
      estimatedHours: 10,
      sortOrder: 3,
      title_de: "IoT mit MQTT",
      title_en: "IoT with MQTT",
      summary_de:
        "Mehrere ESP32 sprechen miteinander — Home Assistant inklusive.",
      summary_en:
        "Multiple ESP32s talking to each other — Home Assistant included.",
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      slug: "embedded-rtos",
      level: "L4_EXPERT" as const,
      estimatedHours: 16,
      sortOrder: 4,
      title_de: "Embedded RTOS",
      title_en: "Embedded RTOS",
      summary_de:
        "FreeRTOS, Tasks, Queues, Interrupts — produktive Firmware-Architektur.",
      summary_en:
        "FreeRTOS, tasks, queues, interrupts — productive firmware architecture.",
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

  // -----------------------------------------------------------------------
  // A starter badge
  // -----------------------------------------------------------------------
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
  // Demo course + lesson under ESP32 Basics path
  // -----------------------------------------------------------------------
  const esp32Path = await prisma.learningPath.findUnique({
    where: { slug: "esp32-basics" },
  });
  const esp32Board = await prisma.board.findUnique({
    where: { slug: "esp32-devkit-v1" },
  });

  if (esp32Path && esp32Board) {
    const course = await prisma.course.upsert({
      where: { slug: "esp32-getting-started" },
      create: {
        slug: "esp32-getting-started",
        pathId: esp32Path.id,
        sortOrder: 1,
        title_de: "Erste Schritte mit dem ESP32",
        title_en: "Getting started with the ESP32",
        summary_de:
          "Setup der Toolchain, erstes Blink, GPIO-Grundlagen und WLAN-Basics.",
        summary_en:
          "Set up your toolchain, blink your first LED, learn GPIO and WiFi basics.",
        isPublished: true,
        publishedAt: new Date(),
      },
      update: {},
    });

    const blinkLesson = await prisma.lesson.upsert({
      where: { slug: "esp32-blink-led" },
      create: {
        slug: "esp32-blink-led",
        courseId: course.id,
        sortOrder: 1,
        kind: "PROJECT",
        xpReward: 100,
        estimatedMinutes: 20,
        wokwiProjectId: "336838716100935764",
        title_de: "LED zum Blinken bringen",
        title_en: "Make an LED blink",
        body_de: `Wir starten klassisch: eine LED am ESP32 zum Blinken bringen.

## Was du lernst
- Wie der **GPIO-Pin** als Ausgang konfiguriert wird
- Warum LEDs immer einen **Vorwiderstand** brauchen
- Was \`delay(ms)\` macht und warum es für komplexere Programme keine gute Idee ist

## Wie es funktioniert
Der ESP32 hat 3,3 V Logikpegel. Eine typische rote LED hat eine Flussspannung von ~2 V und einen empfohlenen Strom von 10 mA. Damit ergibt sich der Vorwiderstand:

\`R = (3,3 V - 2 V) / 0,01 A = 130 Ω\`

In der Praxis nimmst du den nächstgrößeren Standardwert: **220 Ω**.
`,
        body_en: `We're starting with the classic: blinking an LED on the ESP32.

## What you'll learn
- How to configure a **GPIO pin** as an output
- Why LEDs always need a **current-limiting resistor**
- What \`delay(ms)\` does and why it's not a good idea for bigger programs

## How it works
The ESP32 runs at 3.3 V logic level. A typical red LED has a forward voltage of ~2 V and recommended current of 10 mA. So the resistor is:

\`R = (3.3 V - 2 V) / 0.01 A = 130 Ω\`

In practice pick the next standard value: **220 Ω**.
`,
        codeSnippet: `// ESP32 — Blink (DE: blinken / EN: blink)
const int LED_PIN = 2; // onboard LED on most DevKit boards

void setup() {
  pinMode(LED_PIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_PIN, HIGH);
  delay(500);
  digitalWrite(LED_PIN, LOW);
  delay(500);
}
`,
        schematicNotes_de:
          "Eine externe LED an GPIO 2 → 220 Ω → LED → GND. Anode (langes Bein) Richtung GPIO.",
        schematicNotes_en:
          "External LED on GPIO 2 → 220 Ω → LED → GND. Anode (long leg) towards GPIO.",
        safetyNotes_de:
          "Niemals eine LED **ohne Vorwiderstand** direkt an einen GPIO hängen — sonst Kurzschluss-Strom durch die LED und der ESP32 schaltet ab. Verwende immer min. 220 Ω.",
        safetyNotes_en:
          "Never connect an LED **without a current-limiting resistor** directly to a GPIO — you'd short-circuit through the LED and brown out the ESP32. Always use 220 Ω or more.",
        isPublished: true,
        publishedAt: new Date(),
        recommendedBoards: { connect: [{ id: esp32Board.id }] },
      },
      update: {},
    });

    await prisma.bOMItem.upsert({
      where: { id: `${blinkLesson.id}-board` },
      create: {
        id: `${blinkLesson.id}-board`,
        lessonId: blinkLesson.id,
        boardId: esp32Board.id,
        quantity: 1,
        note_de: "ESP32 DevKit V1 oder kompatibel.",
        note_en: "ESP32 DevKit V1 or compatible.",
      },
      update: {},
    });

    // Mini-quiz
    await prisma.quiz.upsert({
      where: { id: `${blinkLesson.id}-mini` },
      create: {
        id: `${blinkLesson.id}-mini`,
        lessonId: blinkLesson.id,
        kind: "MINI",
        passScore: 60,
        title_de: "Verstanden?",
        title_en: "Got it?",
        questions: [
          {
            id: "q1",
            prompt_de: "Warum braucht eine LED am ESP32 einen Vorwiderstand?",
            prompt_en: "Why does an LED on the ESP32 need a current-limiting resistor?",
            options: [
              {
                key: "a",
                label_de: "Damit sie blinkt",
                label_en: "So that it blinks",
              },
              {
                key: "b",
                label_de:
                  "Um den Strom durch die LED zu begrenzen — sonst geht sie kaputt",
                label_en:
                  "To limit the current through the LED — otherwise it burns out",
              },
              {
                key: "c",
                label_de: "Damit die Farbe stimmt",
                label_en: "To set the right colour",
              },
              {
                key: "d",
                label_de: "Damit der ESP32 mehr Spannung liefert",
                label_en: "So the ESP32 outputs more voltage",
              },
            ],
            correctKey: "b",
            weight: 1,
          },
        ],
      },
      update: {},
    });

    // Final quiz
    await prisma.quiz.upsert({
      where: { id: `${blinkLesson.id}-final` },
      create: {
        id: `${blinkLesson.id}-final`,
        lessonId: blinkLesson.id,
        kind: "LESSON_FINAL",
        passScore: 70,
        title_de: "Abschluss-Quiz",
        title_en: "Final quiz",
        questions: [
          {
            id: "f1",
            prompt_de: "Welcher Modus ist nötig, damit ein Pin eine LED ansteuern kann?",
            prompt_en: "Which pin mode is needed to drive an LED?",
            options: [
              { key: "a", label_de: "INPUT", label_en: "INPUT" },
              { key: "b", label_de: "INPUT_PULLUP", label_en: "INPUT_PULLUP" },
              { key: "c", label_de: "OUTPUT", label_en: "OUTPUT" },
              { key: "d", label_de: "ANALOG", label_en: "ANALOG" },
            ],
            correctKey: "c",
            weight: 1,
          },
          {
            id: "f2",
            prompt_de: "Welche Spannung führt der ESP32 an seinen GPIOs?",
            prompt_en: "What is the ESP32 GPIO logic voltage?",
            options: [
              { key: "a", label_de: "1,8 V", label_en: "1.8 V" },
              { key: "b", label_de: "3,3 V", label_en: "3.3 V" },
              { key: "c", label_de: "5 V", label_en: "5 V" },
              { key: "d", label_de: "12 V", label_en: "12 V" },
            ],
            correctKey: "b",
            weight: 1,
          },
        ],
      },
      update: {},
    });

    console.log("  ✓ demo course + lesson + quizzes");
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
