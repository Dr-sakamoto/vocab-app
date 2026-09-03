import type { GrammarTagId } from "./grammarTags";

/**
 * 出題の向き。同じ問題データ（和文と英文の対）を両方向に使う。
 * - `ja-to-en` … 瞬間英作文。日本語を見て英語を書く
 * - `en-to-ja` … 英文和訳。英語を見て日本語に訳す
 */
export type ComposeDirection = "ja-to-en" | "en-to-ja";

/**
 * セッションの種類。セッション開始時に1回選ぶだけで、出題中には切り替えない。
 * - `compose`  … 英作文（ja-to-en）を全レベルから
 * - `translate`… 和訳（en-to-ja）
 * - `weakness` … 弱点特訓。習熟度の低いタグを含む問題だけを英作文で出す
 */
export type ComposeMode = "compose" | "translate" | "weakness";

/** 出題1問ぶんのデータ */
export interface ComposePrompt {
  /** 統計の保存キー。公開後は変えない */
  id: string;
  /** 和文（英作文では設問、和訳では模範解答） */
  ja: string;
  /** 英文の模範解答。先頭を主たる解答として見せる */
  answers: string[];
  /** この問題が試している文法・表現。弱点分析の集計単位 */
  tags: GrammarTagId[];
  /** 1（基礎）〜3（応用） */
  level: 1 | 2 | 3;
  /**
   * 採点後に必ず添える一言。AIの説明と違って毎回同じ内容が出るので、
   * 「この問題の要点は何だったのか」がAIの機嫌に左右されない。
   */
  note?: string;
}

/** 答案1つに対する判定 */
export type ComposeVerdict = "pass" | "close" | "review";

export type TagVerdict = "ok" | "shaky" | "missed";

export interface TagJudgement {
  id: GrammarTagId;
  verdict: TagVerdict;
  /** その判定の理由（日本語・短文） */
  note: string;
}

/** 1答案ぶんの採点結果 */
export interface CompositionGrade {
  /** 0〜100 */
  score: number;
  verdict: ComposeVerdict;
  /** 添削後の文。学習者の文を最小限だけ直したもの */
  corrected: string;
  /** 何を直したのか（日本語） */
  feedback: string;
  /** できていた点。1つだけ必ず返す（続ける理由になるのはここ） */
  good: string;
  /** 狙ったタグごとの判定。ローカル採点では空 */
  tags: TagJudgement[];
  /**
   * AIが実際に判定したか。false は模範解答との照合だけで出したスコア
   * （APIキー未設定・レート制限・通信失敗）。弱点データの重みを変える。
   */
  aiJudged: boolean;
}

/** タグごとの学習状態。弱点分析と出題の重み付けの土台 */
export interface TagStat {
  /** このタグを含む問題に答えた回数 */
  attempts: number;
  /** 直近を重く見た平均スコア（0〜100）。1回も答えていなければ持たない */
  ema?: number;
  /** 合格が続いている回数。落とすと 0 に戻る（復習間隔の段を指す） */
  passStreak: number;
  /** 最後にこのタグの問題を解いた時刻（epoch ミリ秒） */
  lastAnswered?: number;
  /** AIが「使えていない」と判定した回数の累計。分析画面の並べ替えに使う */
  missCount: number;
}

/** 問題ごとの学習状態 */
export interface PromptStat {
  attempts: number;
  bestScore: number;
  lastScore: number;
  lastAnswered?: number;
  passStreak: number;
}

/** セッション1問ぶんの記録。分析画面の「直近の答案」に出す */
export interface ComposeAttempt {
  promptId: string;
  direction: ComposeDirection;
  /** 出題文（向きによって和文か英文か変わるので、そのまま保存する） */
  question: string;
  input: string;
  answers: string[];
  tags: GrammarTagId[];
  score: number;
  verdict: ComposeVerdict;
  corrected: string;
  feedback: string;
  good: string;
  tagJudgements: TagJudgement[];
  hintUsed: boolean;
  answeredAt: number;
}

/** 端末に保存する学習の全体像 */
export interface ComposeProgress {
  tags: Record<string, TagStat>;
  prompts: Record<string, PromptStat>;
  /** 直近の答案。古いものから捨てる（COMPOSE.HISTORY_LIMIT 件） */
  history: ComposeAttempt[];
  /** 通算の答案数とスコアの合計。平均スコアの表示に使う */
  totalAttempts: number;
  scoreSum: number;
}

export interface ComposeSettings {
  setSize: number;
  /** 出題時に狙いのタグとヒントを最初から見せるか */
  showHints: boolean;
}
