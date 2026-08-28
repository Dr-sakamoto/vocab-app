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
  /**
   * 句動詞の意味を一つに固定する、頻出の目的語（`take in` に対する `nutrients` など）。
   * 出題時に `take in [nutrients]` の形で添えるだけで、IDにも判定にも影響しない。
   * 持たない語のほうが多いので任意。データは lib/vocab/collocations.ts。
   */
  collocation?: string;
}

export interface WordStat {
  correct: number;
  wrong: number;
  /**
   * 直近に解答した時刻（epoch ミリ秒）。分散学習の「次にいつ出すか」を決める。
   * 未解答の語、およびこの機能より前に保存されたデータは持たない（undefined）。
   */
  lastAnswered?: number;
  /**
   * 直近で連続して正解した回数。誤答すると 0 に戻る。
   * 復習間隔の段（lib/reviewSchedule.ts の REVIEW_INTERVAL_DAYS）を指す。
   */
  correctStreak?: number;
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

/**
 * 1回答ぶんの採点結果。小テスト形式では回答直後にこれを裏で確定させ、
 * 画面には出さずに10問ぶん貯めてから一気に見せる。
 */
export interface GradeOutcome {
  /**
   * `exact`（完全一致）/ `alternative`（同義語テーブル）/ `ai_approved`（AI承認）
   * / `wrong`（不正解）/ `blank`（未回答）
   */
  status: string;
  /** status から導いた正誤。表示・集計はこちらを見る */
  correct: boolean;
  /** 不正解のときに見せる、覚えるべき訳語 */
  normalizedAnswers: string[];
  /** 品詞が食い違っているときの指摘 */
  posViolation: string | null;
  /** AIが不正解と判断したときの短い理由 */
  aiFeedback: string | null;
  /** AIが実際に判定を返したときだけ入る（レート制限・未設定・失敗時は無し） */
  aiScore?: number;
}

/** 小テスト1問ぶんの状態 */
export interface QuizEntry {
  /** VOCAB_ITEMS 上の添字。統計の更新先 */
  poolIndex: number;
  item: VocabItem;
  input: string;
  /** 回答を確定して採点に回したか。正誤はここでは分からない */
  committed: boolean;
  /** 採点が返ってきていれば入る。未確定・採点中は null */
  outcome: GradeOutcome | null;
}
