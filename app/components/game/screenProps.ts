import { WildEncounterState } from "@/lib/wildEncounter";
import { MonsterCollection, PlayEvaluation, PoolTier } from "@/lib/types";

/**
 * スマホ版/PC版スクリーンが共有する props 群。
 * page.tsx（状態の持ち主）が組み立て、各スクリーンはレイアウトに専念する。
 */

/** EGAレトロRPGスキンの背景グロー（明緑・琥珀・血赤） */
export const FANTASY_AURORA: [string, string, string] = [
  "#61ff5f",
  "#ffcf4a",
  "#ff5a5a",
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
  /** 未回答のときだけ渡す。回答済みなら undefined にしてボタンを隠す */
  onSkip?: () => void;
  skipDisabled?: boolean;
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
