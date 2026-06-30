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

export interface Species {
  id: number;
  name: string;
  nameEn: string;
  minLevel: number;
  maxLevel: number;
  sprite: string;
  fallbackSprite: string;
}

export interface MonsterLine {
  id: string;
  name: string;
  species: Species[];
  sprite?: string; // Add optional sprite to support line-level sprite referencing
}

export interface MonsterInstance {
  id: string;
  lineId: string;
  nickname?: string;
  totalXP: number;
  caughtAt?: string;
  heldItemType?: string;
  heldItemName?: string;
  forcedSpeciesId?: number | null;
}

export interface MonsterCollection {
  version: number;
  activeId: string | null;
  partyIds: (string | null)[];
  habitatVisits: Record<string, number>;
  professorTransfers: Record<string, number>;
  giftClaims: Record<string, boolean>;
  monsters: MonsterInstance[];
  storyProgress?: StoryProgress;
}

export interface StoryProgress {
  version: number;
  defeated: Record<string, boolean>;
  badges: string[];
  pendingChallengeId: string | null;
  pendingChallengePoolSize: number | null;
  activeBattleId: string | null;
  activeBattlePoolSize: number | null;
  activeBattleStartedAt: number | null;
  masterBall: boolean;
  mewWordsSeen: number[];
  relocatedHabitatId: string | null;
  hallOfFame: boolean;
  legendaryFirstSeen: Record<string, boolean>;
  voltorbTrapsCleared: number;
  usedMasterBall: boolean;
  chosenStarterLineId: string | null;
  rivalStarterLineId: string | null;
  professorStartersAwarded: boolean;
}

export interface Battle {
  id: string;
  name: string;
  level?: number;
  habitatId?: string;
  opponentSprite?: string;
  playLimit?: number;
  boss?: boolean;
  [key: string]: any;
}

export interface EvaluationBreakdownItem {
  label: string;
  points: number;
  max: number | null;
  detail: string;
}

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
  captureFailed?: boolean;
  capturePreview?: any;
}

export interface ToastItem {
  id?: string;
  title: string;
  message: string;
  image?: string;
  detail?: string;
  duration?: number;
  isActive?: boolean;
}

export interface TrainerChallenge {
  title: string;
  message: string;
  image?: string;
  trainerSprite?: string;
  duration?: number;
  battleId: string;
}
