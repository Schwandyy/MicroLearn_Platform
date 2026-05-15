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
