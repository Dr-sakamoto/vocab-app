import { WildEncounterState } from "@/lib/wildEncounter";
import { MonsterCollection, PlayEvaluation, PoolTier } from "@/lib/types";

/**
 * スマホ版/PC版スクリーンが共有する props 群。
 * page.tsx（状態の持ち主）が組み立て、各スクリーンはレイアウトに専念する。
 */

/** ハイファンタジースキンの背景オーロラ（松明・森・血の残光） */
export const FANTASY_AURORA: [string, string, string] = [
  "#b08d3c",
  "#3f5d3a",
  "#7a2a2a",
];

export interface WorldBlockProps {
  encounter: WildEncounterState | null;
  fallbackHabitatName: string;
  tier: PoolTier;
  unlockedPoolSize: number;
  totalWords: number;
  streakDays: number;
  onOpenProgress: () => void;
}

export interface QuizBlockProps {
  phase: "quiz" | "result";
  questionKey: number;
  partOfSpeech: string;
  word: string;
  total: number;
  playLimit: number;
  progressPct: number;
  score: number;
  bestStreak: number;
  tierMultiplier: number;
}

export interface ResultBlockProps {
  evaluation: PlayEvaluation | null;
  score: number;
  playLimit: number;
  unlockedThisRun: number;
  onContinue: () => void;
}

export interface DockBlockProps {
  collection: MonsterCollection;
  onSelect: (monsterId: string) => void;
  onOpenDrawer: () => void;
}
