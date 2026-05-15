import type { LearnerLevel } from "@prisma/client";

export type AssessmentQuestionKey =
  | "soldering"
  | "coding"
  | "circuits"
  | "boards"
  | "protocols"
  | "goal"
  | "context"
  | "age";

export const ASSESSMENT_QUESTIONS: AssessmentQuestionKey[] = [
  "soldering",
  "coding",
  "circuits",
  "boards",
  "protocols",
  "goal",
  "context",
  "age",
];

export const OPTION_KEYS = ["a", "b", "c", "d"] as const;
export type OptionKey = (typeof OPTION_KEYS)[number];

const OPTION_POINTS: Record<OptionKey, number> = {
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

// goal/context/age aren't skill questions — weight lower
const QUESTION_WEIGHT: Record<AssessmentQuestionKey, number> = {
  soldering: 4,
  coding: 5,
  circuits: 5,
  boards: 4,
  protocols: 4,
  goal: 1,
  context: 1,
  age: 0, // demographic only, doesn't affect score
};

export type AssessmentAnswers = Partial<Record<AssessmentQuestionKey, OptionKey>>;

export function scoreAssessment(answers: AssessmentAnswers): {
  score: number;
  level: LearnerLevel;
} {
  let achieved = 0;
  let maxAchievable = 0;
  for (const q of ASSESSMENT_QUESTIONS) {
    const w = QUESTION_WEIGHT[q];
    if (w === 0) continue;
    maxAchievable += w * 3;
    const choice = answers[q];
    if (choice) achieved += w * OPTION_POINTS[choice];
  }
  const score = maxAchievable === 0 ? 0 : Math.round((achieved / maxAchievable) * 100);
  let level: LearnerLevel;
  if (score < 25) level = "L1_BEGINNER";
  else if (score < 50) level = "L2_NOVICE";
  else if (score < 75) level = "L3_INTERMEDIATE";
  else level = "L4_EXPERT";
  return { score, level };
}

export function levelToNumber(level: LearnerLevel): 1 | 2 | 3 | 4 {
  switch (level) {
    case "L1_BEGINNER":
      return 1;
    case "L2_NOVICE":
      return 2;
    case "L3_INTERMEDIATE":
      return 3;
    case "L4_EXPERT":
      return 4;
  }
}
