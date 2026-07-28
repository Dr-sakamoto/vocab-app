export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "phrase"
  | "phrasal verb"
  | "adverbial phrase"
  | "verb phrase"
  | string;

export interface VocabItem {
  id: string;
  target: string;
  partOfSpeech: PartOfSpeech;
  answers: string[];
}

export interface WordStat {
  correct: number;
  wrong: number;
}

export interface SessionAnswer {
  id: string;
  correct: boolean;
  previousCorrect: number;
  previousWrong: number;
}

export type GameView = "start" | "study" | "result" | "dashboard";

export interface EvaluationBreakdownItem {
  label: string;
  points: number;
  max: number | null;
  detail: string;
}

/** 解放済みプールの規模に応じた獲得ポイント倍率 */
export interface PoolTier {
  minPool: number;
  multiplier: number;
  label: string;
  color: string;
}

export interface PlayEvaluation {
  grade: string;
  title: string;
  message: string;
  xp: number;
  tier: PoolTier;
  fzm: number;
  breakdown: EvaluationBreakdownItem[];
}
