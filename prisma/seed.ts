import { PrismaClient, Prisma } from "@prisma/client";

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
      descriptionShort_de: "Mini-Computer mit WLAN und Bluetooth.",
      descriptionShort_en: "Tiny computer with WiFi and Bluetooth.",
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
      name: "Steckbrett (halb)",
      category: "tool",
      iconKey: "Grid3x3",
      imageUrl: "/parts/breadboard.svg",
      logicLevel: "BOTH" as const,
      voltageMin: 0,
      voltageMax: 50,
      protocols: ["GPIO"] as const,
      description_de:
        "Brett zum Stecken — Drähte und Bauteile ohne Löten verbinden.",
      description_en:
        "Plug-in board — connect wires and parts without soldering.",
      descriptionShort_de: "Stecker statt löten.",
      descriptionShort_en: "Plug instead of solder.",
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
  const esp32Board = await prisma.board.findUniqueOrThrow({
    where: { slug: "esp32-devkit-v1" },
  });

  // Affiliate-Direktlinks pro Bauteil pro Programm.
  // STRIKT: nur HTTP-200-verifizierte Direktlinks. Keine Such-URLs, keine
  // Verlegenheits-Buttons. Wenn ein Programm für ein Bauteil keinen Direktlink
  // hat, taucht es bei diesem Bauteil im UI gar nicht auf.
  // Verifikation: pnpm verify:affiliate
  type Merchant = "AZ_DELIVERY" | "AMAZON_DE" | "BERRYBASE" | "REICHELT";

  interface PartConfig {
    componentId?: string;
    boardId?: string;
    /** Stand: 2026-05-15 HTTP-verifiziert. Vor jedem Hinzufügen: pnpm verify:affiliate */
    directUrls: Partial<Record<Merchant, string>>;
  }

  const parts: PartConfig[] = [
    {
      componentId: ledComp.id,
      // Kein verifizierter Direktlink → keine Kauf-Sektion in der Karte
      directUrls: {},
    },
    {
      componentId: resComp.id,
      directUrls: {
        REICHELT:
          "https://www.reichelt.de/de/de/shop/produkt/metallschichtwiderstand_0_6_w_1_-_220_ohm-1956.html",
      },
    },
    {
      componentId: bbComp.id,
      directUrls: {
        REICHELT:
          "https://www.reichelt.de/de/de/shop/produkt/steckboard_400-300070.html",
      },
    },
    {
      componentId: wireComp.id,
      directUrls: {
        AMAZON_DE: "https://www.amazon.de/dp/B01EV70C78",
      },
    },
    {
      boardId: esp32Board.id,
      directUrls: {
        AZ_DELIVERY:
          "https://www.az-delivery.de/products/esp32-developmentboard",
        AMAZON_DE: "https://www.amazon.de/dp/B071P98VTG",
        REICHELT:
          "https://www.reichelt.de/de/de/shop/produkt/espressif_esp32-devkitc-32d-298105.html",
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

  const allPrograms: { program: typeof azProgram; merchant: Merchant }[] = [
    { program: azProgram, merchant: "AZ_DELIVERY" },
    { program: amazonProgram, merchant: "AMAZON_DE" },
    { program: berryProgram, merchant: "BERRYBASE" },
    { program: reicheltProgram, merchant: "REICHELT" },
  ];

  let directLinks = 0;
  for (const part of parts) {
    const ownerId = part.componentId ?? part.boardId;
    for (const { program, merchant } of allPrograms) {
      const direct = part.directUrls[merchant];
      if (!direct) continue; // kein Direktlink → Programm taucht für dieses Bauteil nicht auf
      const url = appendTrackingTag(direct, merchant, program.trackingId);
      directLinks += 1;
      const id = `${program.id}-${ownerId}`;
      await prisma.affiliateLink.upsert({
        where: { id },
        create: {
          id,
          programId: program.id,
          productUrl: url,
          productSlug: direct,
          componentId: part.componentId ?? null,
          boardId: part.boardId ?? null,
        },
        update: {
          productUrl: url,
          productSlug: direct,
        },
      });
    }
  }
  console.log(
    `  ✓ ${directLinks} verifizierte Affiliate-Direktlinks (keine Such-URLs)`,
  );

  // -----------------------------------------------------------------------
  // Learning paths
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
        "Vom ersten Blink bis zum WLAN-Sensor. Schritt-für-Schritt im Step-Player.",
      summary_en:
        "From your first blink to a WiFi sensor. Step-by-step in the player.",
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
  // Demo Blink-Lesson — komplett als Step-Player
  // -----------------------------------------------------------------------
  const esp32Path = await prisma.learningPath.findUniqueOrThrow({
    where: { slug: "esp32-basics" },
  });

  const course = await prisma.course.upsert({
    where: { slug: "esp32-getting-started" },
    create: {
      slug: "esp32-getting-started",
      pathId: esp32Path.id,
      sortOrder: 1,
      title_de: "Erste Schritte mit dem ESP32",
      title_en: "Getting started with the ESP32",
      summary_de:
        "Setup, erstes Blinken einer LED, GPIO-Grundlagen, einfache WLAN-Basics.",
      summary_en:
        "Setup, blink your first LED, learn GPIO and simple WiFi basics.",
      isPublished: true,
      publishedAt: new Date(),
    },
    update: {},
  });

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
          "GPIO heißt „General Purpose Input/Output\". Das sind die kleinen Beinchen am ESP32, an die du etwas anschließen kannst — zum Beispiel eine LED.",
        body_en:
          "GPIO stands for \"General Purpose Input/Output\". These are the small pins on the ESP32 you can connect things to — for example an LED.",
        payload: {
          keyPoint_de: "Wir benutzen GPIO 2. Auf dem Board ist es so beschriftet.",
          keyPoint_en: "We're using GPIO 2. It's labeled that way on the board.",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 4,
        kind: "BUILD",
        title_de: "Schritt 1: Widerstand stecken",
        title_en: "Step 1: Plug in the resistor",
        body_de:
          "Steck einen Anschluss vom Widerstand neben GPIO 2 des ESP32. Den anderen Anschluss in eine freie Reihe weiter rechts.",
        body_en:
          "Plug one leg of the resistor next to GPIO 2 of the ESP32. The other leg into a free row to the right.",
        payload: {
          instruction_de:
            "Der Widerstand hat keine Richtung — er kann beidseitig gesteckt werden.",
          instruction_en:
            "Resistors don't have a direction — either way works.",
          ledColor: "red",
          highlightWires: ["signal"],
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 5,
        kind: "BUILD",
        title_de: "Schritt 2: LED stecken",
        title_en: "Step 2: Plug in the LED",
        body_de:
          "Das LANGE Beinchen der LED kommt an den Widerstand. Das KURZE Beinchen geht in die blaue Minus-Reihe (GND).",
        body_en:
          "The LONG leg of the LED goes to the resistor. The SHORT leg goes into the blue minus row (GND).",
        payload: {
          instruction_de: "Lang = Plus, Kurz = Minus. Wichtig: nicht verwechseln!",
          instruction_en: "Long = plus, short = minus. Don't mix them up!",
          ledColor: "red",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 6,
        kind: "BUILD",
        title_de: "Schritt 3: GND verbinden",
        title_en: "Step 3: Connect GND",
        body_de:
          "Stecke ein Jumper-Kabel vom GND-Pin des ESP32 in die blaue Minus-Reihe.",
        body_en:
          "Run a jumper wire from the ESP32's GND pin into the blue minus rail.",
        payload: {
          instruction_de:
            "GND ist das Minus. Ohne diese Verbindung leuchtet nichts.",
          instruction_en:
            "GND is the minus. Nothing lights up without this connection.",
          ledColor: "red",
          highlightWires: ["gnd"],
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 7,
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
        sortOrder: 8,
        kind: "SIMULATE",
        title_de: "So sollte es aussehen",
        title_en: "Here's what should happen",
        body_de:
          "Drücke „Programm starten\" und schau, wie die LED blinkt. Wenn deine echte LED auch blinkt — perfekt!",
        body_en:
          "Press \"Run program\" and watch the LED blink. If your real LED blinks too — perfect!",
        payload: {
          expectedBehavior_de: "Die LED blinkt im halben Sekundentakt.",
          expectedBehavior_en: "The LED blinks every half second.",
          animation: "blink",
          ledColor: "red",
        },
      },
      {
        lessonId: blinkLesson.id,
        sortOrder: 9,
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
        sortOrder: 10,
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

  console.log("  ✓ demo lesson: 11 step-player steps");
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
