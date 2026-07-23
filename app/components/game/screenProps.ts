import { WildEncounterState } from "@/lib/wildEncounter";
import { MonsterCollection, PlayEvaluation, PoolTier } from "@/lib/types";
import { PokemonBoxProps } from "../PokemonBox";

/**
 * スマホ版/PC版スクリーンが共有する props 群。
 * page.tsx（状態の持ち主）が組み立て、各スクリーンはレイアウトに専念する。
 */

export interface WorldBlockProps {
  encounter: WildEncounterState | null;
  fallbackHabitatName: string;
  /** エンカウント不在時、Tipsのフレーバーテキストを引くための現在地ID */
  fallbackHabitatId: string | null;
  /** Tipsの切り替えタイミング算出に使う累計正解数 */
  correctCount: number;
  tier: PoolTier;
  unlockedPoolSize: number;
  totalWords: number;
  streakDays: number;
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

/**
 * スマホ版の地続きボトムシート（EtymonPartySheet）に渡す手持ち編成の props。
 * ボックス操作は PokemonBox と同じハンドラを共有する。
 */
export interface DrawerBlockProps
  extends Pick<
    PokemonBoxProps,
    | "limit"
    | "forceManage"
    | "onSwap"
    | "onRemove"
    | "onSendToProfessor"
    | "onSortBox"
    | "onOpenSync"
    | "onSetActive"
  > {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
