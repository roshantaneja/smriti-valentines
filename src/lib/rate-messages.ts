export interface AnalysisStep {
  label: string;
  ms: number;
}

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { label: "Locating facial structure…", ms: 700 },
  { label: "Calibrating golden ratio…", ms: 700 },
  { label: "Cross-referencing symmetry database…", ms: 800 },
  { label: "Consulting the beauty algorithms…", ms: 800 },
  { label: "Finalizing score…", ms: 500 },
];

export const THEATER_MS = ANALYSIS_STEPS.reduce((sum, s) => sum + s.ms, 0);

const PERFECT_MESSAGES = [
  "Flawless. The algorithm has never been so sure of anything.",
  "A perfect score. Statistically anomalous. Scientifically undeniable.",
  "The symmetry database has a new gold standard.",
  "10/10. The algorithm would like this photo framed.",
];

const NEAR_MATCH_MESSAGES = [
  "Remarkably close to perfection. Uncanny, almost.",
  "The algorithm is getting déjà vu. Excellent bone structure.",
  "So close to a perfect match that the servers double-checked.",
];

const MID_MESSAGES = [
  "There's something vaguely familiar here. Not enough, though.",
  "A respectable attempt. The algorithm remains unmoved.",
  "Mid. The algorithm apologizes for its honesty.",
  "The golden ratio was consulted. It declined to comment.",
];

const LOW_MESSAGES = [
  "The algorithm has spoken. Please do not appeal.",
  "Our servers tried their best.",
  "Have you considered a hat?",
  "The symmetry database found no records worth keeping.",
  "1/10. The camera did everything it could.",
];

export const NO_FACE_MESSAGE =
  "No human detected. The algorithm demands a face.";

export const UNCALIBRATED_MESSAGE =
  "The algorithm has not finished its training montage. Check back soon.";

export const ERROR_MESSAGE = "The AI is feeling shy. Try again.";

function pick(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

export function messageForScore(score: number): string {
  if (score >= 10) return pick(PERFECT_MESSAGES);
  if (score >= 8) return pick(NEAR_MATCH_MESSAGES);
  if (score >= 4) return pick(MID_MESSAGES);
  return pick(LOW_MESSAGES);
}
