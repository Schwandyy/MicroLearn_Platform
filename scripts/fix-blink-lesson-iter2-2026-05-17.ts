// Iter-2-Fixes nach zweiter User-Review-Runde 2026-05-17:
// 1) Spaltenzahlen im Body-Text gleichen jetzt den 1-indexed Labels der SVG.
//    Widerstand zwischen Spalte 5 und Spalte 8 (vorher: 4 und 7 — off-by-one).
// 2) BUILD-Steps verweisen darauf, dass der ESP32 IM Breadboard steckt → M2M
//    ist tatsächlich der richtige Kabeltyp, die User-Frage „muss ich löten"
//    bekommt eine Antwort im Text.
// 3) PARTS-Step bekommt vorgezogene Computer/USB-Voraussetzung — User soll
//    nicht erst nach 9 Steps merken, dass Smartphone nicht reicht.
// 4) GND-Verkabelung präzisiert: Kabel B geht von Spalte 14 untere Hälfte
//    (gleiche Spalte wie der GND-Pin) runter zur Minus-Schiene.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LESSON_SLUG = "esp32-blink-led";

async function main() {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: LESSON_SLUG },
    select: { id: true },
  });
  if (!lesson) {
    console.error(`Lesson ${LESSON_SLUG} not found.`);
    process.exit(1);
  }

  // 1) PARTS-Step bekommt einen Vorab-Hinweis auf Computer + USB-Kabel
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 1, kind: "PARTS" },
    data: {
      body_de:
        "**Wichtig vorab:** Du brauchst einen **Computer** (Windows, Mac oder Linux) " +
        "und ein **USB-Datenkabel**. Am Smartphone oder Tablet geht das leider nicht — " +
        "du musst den Code später vom Computer auf den ESP32 spielen.\n\n" +
        "Alle Teile bekommst du bei den üblichen Elektronik-Händlern " +
        "(z.B. Reichelt, AZ-Delivery, Conrad oder Mouser). Wir verlinken pro Teil zur passenden Seite.",
      body_en:
        "**Heads-up:** You'll need a **computer** (Windows, Mac or Linux) " +
        "and a **USB data cable**. Phones and tablets won't work — you'll need to upload " +
        "the code from the computer to the ESP32.\n\n" +
        "All parts are available from standard electronics retailers " +
        "(e.g. Reichelt, AZ-Delivery, Conrad or Mouser). We link to a fitting page per part.",
    },
  });
  console.log("[1] PARTS-Step: Computer-Vorabhinweis");

  // 2) BUILD Step 1 (Widerstand) — neue Spalten 5/8, ESP32-im-Breadboard erklärt
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 5, kind: "BUILD" },
    data: {
      body_de:
        "**Wichtig zuerst:** Steck den ESP32 mit beiden Pin-Reihen quer in das Breadboard, " +
        "so dass er die Mittelrille überspannt. Die linke Pin-Reihe sitzt dann auf Reihe e, " +
        "die rechte auf Reihe f. Im Bild siehst du, wo GPIO 2 und GND landen.\n\n" +
        "Jetzt zum Widerstand: schau im Bild auf die gelb pulsierenden Punkte — das sind " +
        "Spalte 5 und Spalte 8 (jeweils Reihe a). Steck ein Beinchen des Widerstands in " +
        "Spalte 5, das andere in Spalte 8. Er liegt waagerecht und überbrückt drei Löcher — " +
        "der Strom MUSS durch ihn fließen, um von Spalte 5 nach Spalte 8 zu kommen. " +
        "Die Beinchen sind lang genug; nötigenfalls leicht biegen.\n\n" +
        "Das **grüne M2M-Jumper-Kabel** verbindet GPIO 2 (Spalte 4, Reihe a) mit dem linken " +
        "Widerstands-Beinchen (Spalte 5, Reihe a). Beide Enden sind Stecker — du steckst " +
        "sie einfach in die Breadboard-Löcher.",
      body_en:
        "**First step:** Plug the ESP32 into the breadboard with both pin rows, so it " +
        "straddles the center channel. The left row of pins sits on row e, the right row " +
        "on row f. The image shows where GPIO 2 and GND end up.\n\n" +
        "Now the resistor: the two yellow pulsing dots are at column 5 and column 8 " +
        "(both row a). Plug one resistor leg into column 5, the other into column 8. " +
        "It lies horizontally bridging three holes — current MUST flow through it to get " +
        "from column 5 to column 8. The legs are long enough; bend them slightly if needed.\n\n" +
        "The **green M2M jumper wire** connects GPIO 2 (column 4, row a) to the left leg " +
        "of the resistor (column 5, row a). Both ends are male pins — you just push them " +
        "into the breadboard holes.",
    },
  });
  console.log("[2] BUILD Step 1: Spalten 5/8 + ESP32-im-Breadboard");

  // 3) BUILD Step 2 (LED) — neue Spalten 8/9
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 6, kind: "BUILD" },
    data: {
      body_de:
        "Die LED hat zwei verschieden lange Beinchen. Das **LANGE Beinchen (Plus, Anode)** " +
        "steckst du in **Spalte 8, Reihe a** — also dieselbe Spalte wie das rechte Widerstands-" +
        "Beinchen. Dadurch sind LED-Anode und rechtes Widerstands-Beinchen elektrisch verbunden, " +
        "ohne dass du sie sich berühren musst. Das **KURZE Beinchen (Minus, Kathode)** kommt in " +
        "**Spalte 9, Reihe a**. Die LED steht jetzt aufrecht zwischen zwei Spalten — falsch " +
        "herum eingesteckt leuchtet sie einfach nicht.",
      body_en:
        "The LED has two different-length legs. Plug the **LONG leg (plus / anode)** into " +
        "**column 8, row a** — the same column as the right leg of the resistor. That " +
        "electrically connects the LED anode and the resistor without them having to touch. " +
        "Plug the **SHORT leg (minus / cathode)** into **column 9, row a**. The LED now " +
        "stands upright between two columns — if plugged the wrong way around it simply " +
        "won't light up.",
    },
  });
  console.log("[3] BUILD Step 2: Spalten 8/9");

  // 4) BUILD Step 3 (GND-Kabel) — neue Spalten + Stromweg
  await prisma.lessonStep.updateMany({
    where: { lessonId: lesson.id, sortOrder: 7, kind: "BUILD" },
    data: {
      body_de:
        "Es fehlen zwei blaue Verbindungen — beide gehen zur **blauen Minus-Schiene unten** " +
        "(die rote Plus-Schiene oben benutzen wir hier nicht). Beide Kabel sind **M2M-Jumper** " +
        "(Stecker-Stecker), 5–10 cm lang. Farbe der Kabel ist nicht zwingend blau — wir wählen " +
        "blau, weil GND in der Elektrotechnik typisch als blau gezeichnet wird.\n\n" +
        "**Kabel A — von der LED zur Minus-Schiene:** Ein Ende in **Spalte 9, Reihe a** " +
        "(gleiche Spalte wie das kurze LED-Beinchen). Das andere Ende in irgendein Loch der " +
        "**blauen Minus-Schiene ganz unten**. Damit ist die LED-Kathode mit Minus verbunden.\n\n" +
        "**Kabel B — vom ESP32-GND zur Minus-Schiene:** Der GND-Pin des ESP32 sitzt in **Spalte 14, " +
        "Reihe f** (also unter dem ESP32-Body). Du musst nicht den Pin selbst anfassen — die " +
        "Spalte 14 ist über alle Löcher in der unteren Hälfte verbunden. Steck also ein Ende " +
        "in **Spalte 14, Reihe j** (unterste freie Reihe). Das andere Ende in die **blaue " +
        "Minus-Schiene ganz unten**.\n\n" +
        "Stromweg: GPIO 2 → grünes Kabel → Widerstand → langes LED-Bein → kurzes LED-Bein → " +
        "Kabel A → Minus-Schiene → Kabel B → GND. Stromkreis geschlossen.",
      body_en:
        "Two blue connections are missing — both go to the **blue minus rail at the bottom** " +
        "(we don't use the red plus rail at the top here). Both wires are **M2M jumpers** " +
        "(male-to-male), 5–10 cm. Color is not strictly blue — we pick blue because GND is " +
        "conventionally drawn in blue.\n\n" +
        "**Wire A — from the LED to the minus rail:** One end into **column 9, row a** " +
        "(same column as the short LED leg). The other end into any hole of the **blue minus " +
        "rail at the bottom**. This connects the LED cathode to minus.\n\n" +
        "**Wire B — from ESP32 GND to the minus rail:** The ESP32 GND pin sits in **column 14, " +
        "row f** (under the ESP32 body). You don't need to touch the pin itself — column 14 is " +
        "internally connected for all holes in the bottom half. So plug one end into **column 14, " +
        "row j** (lowest free row). The other end into the **blue minus rail at the bottom**.\n\n" +
        "Current path: GPIO 2 → green wire → resistor → long LED leg → short LED leg → " +
        "wire A → minus rail → wire B → GND. Circuit closed.",
    },
  });
  console.log("[4] BUILD Step 3: GND-Spalte 14 + Minus-Schiene betont");

  console.log("\n✅ Iter-2-Fixes angewendet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
