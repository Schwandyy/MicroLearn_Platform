// Shared types für generierte Lessons.
// Specs sind die Eingabe (Lernziel + BOM-Hinweise), Content ist die Ausgabe
// des Generators (vollständige Step-Player-Inhalte inkl. bilingual + Code).

export type StepKind =
  | "INTRO"
  | "PARTS"
  | "SAFETY"
  | "BUILD"
  | "CODE_WALK"
  | "SIMULATE"
  | "QUIZ"
  | "CELEBRATE"
  | "EXPLAIN"
  | "SETUP";

export interface BomEntry {
  /** "board" → Referenz auf Board-Slug, "component" → Component-Slug */
  kind: "board" | "component";
  slug: string;
  qty: number;
}

export interface LessonSpec {
  slug: string;
  pathSlug: "mein-erstes-licht" | "bewegung-robotik" | "welt-der-sensoren" | "anzeige-iot";
  courseSlug:
    | "erste-lichter"
    | "bewegung-und-robotik"
    | "sensoren-grundlagen"
    | "anzeige-und-iot";
  boardSlug: string;
  sortOrder: number;
  estimatedMinutes: number;
  xpReward: number;
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  /** Optional: explizit benötigte Sicherheitshinweise (DE/EN) */
  safetyNotes_de?: string | null;
  safetyNotes_en?: string | null;
  /** BOM für die Lesson (Boards + Komponenten als Slug-Referenzen) */
  bom: BomEntry[];
  /** Kurze Lernziel-Beschreibung für den Generator */
  learningGoal: string;
  /** Neue Konzepte, die hier ggü. der Vor-Lesson dazukommen */
  newConcepts: string;
  /** Welche Steps der Lehrer auf jeden Fall sehen möchte (Reihenfolge & Kinds) */
  stepOutline: StepKind[];
  /** Hinweise an den Generator zum Code (Bibliothek, GPIO-Pin, Eigenheiten) */
  codeHints?: string;
}

export interface LessonStepContent {
  kind: StepKind;
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
  /** Frei strukturiert; je nach kind: { code }, { instruction_de/en }, { question/answers/correctIndex }, { keyPoint_de/en } */
  payload?: Record<string, unknown> | null;
}

export interface LessonContent {
  slug: string;
  title_de: string;
  title_en: string;
  summary_de: string;
  summary_en: string;
  estimatedMinutes: number;
  xpReward: number;
  safetyNotes_de: string | null;
  safetyNotes_en: string | null;
  steps: LessonStepContent[];
}
