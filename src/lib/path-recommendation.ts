import type { LearnerLevel } from "@prisma/client";
import { levelToNumber } from "./assessment";

/**
 * Sortiert Pfade nach Relevanz zum User-Level.
 * - Pfade auf dem exakten Level kommen zuerst
 * - Dann Pfade *unter* dem User-Level (kann er repeat machen)
 * - Dann Pfade *über* dem User-Level (Aspiration, aber gedämpft)
 * - Innerhalb derselben Distanz: Original-sortOrder erhalten
 *
 * Liefert NICHT-mutierende Kopie zurück.
 */

export type PathLike = {
  slug: string;
  level: LearnerLevel;
  sortOrder: number;
};

export function sortPathsByRelevance<T extends PathLike>(
  paths: readonly T[],
  userLevel: LearnerLevel | null | undefined,
): T[] {
  if (!userLevel) return [...paths].sort((a, b) => a.sortOrder - b.sortOrder);

  const userNum = levelToNumber(userLevel);

  return [...paths].sort((a, b) => {
    const aDist = levelDistance(a.level, userNum);
    const bDist = levelDistance(b.level, userNum);
    if (aDist !== bDist) return aDist - bDist;
    return a.sortOrder - b.sortOrder;
  });
}

/**
 * Liefert den empfohlenen Pfad für ein gegebenes User-Level.
 * Nimmt den ersten der relevanz-sortierten Liste.
 */
export function pickRecommendedPath<T extends PathLike>(
  paths: readonly T[],
  userLevel: LearnerLevel | null | undefined,
): T | null {
  const sorted = sortPathsByRelevance(paths, userLevel);
  return sorted[0] ?? null;
}

/**
 * Wie weit ist ein Pfad-Level vom User-Level entfernt?
 * - exakter Match: 0
 * - eins drunter: 1 (User kann auffrischen)
 * - eins drüber: 2 (Aspiration, leicht erreichbar)
 * - n drunter: 1 + 2*(n-1)
 * - n drüber: 2 + 2*(n-1)
 *
 * So bevorzugen wir bei gleichem Abstand das niedrigere Level
 * (Wiederholung statt Überforderung).
 */
function levelDistance(pathLevel: LearnerLevel, userNum: number): number {
  const pathNum = levelToNumber(pathLevel);
  if (pathNum === userNum) return 0;
  if (pathNum < userNum) return 1 + 2 * (userNum - pathNum - 1);
  return 2 + 2 * (pathNum - userNum - 1);
}

/**
 * True wenn ein Pfad weit jenseits des User-Levels ist
 * (≥ 2 Stufen drüber). Trigger für „Erst Pfade davor" Warn-Banner.
 */
export function isPathOutOfReach(
  pathLevel: LearnerLevel,
  userLevel: LearnerLevel | null | undefined,
): boolean {
  if (!userLevel) return false;
  return levelToNumber(pathLevel) - levelToNumber(userLevel) >= 2;
}
