import { hasRecoveredFromMistakes } from "./flashWeight";
import { SessionAnswer, WordStat } from "./types";

/**
 * 「定着済み」と名乗るのに最低限必要な正解数。
 *
 * 1回の正解はまぐれと区別できない。この 2 という値は新しく決めたものではなく、
 * すでに出題側で使われている閾値をそのまま借りている：
 * getQuestionWeight は `wrong === 0 && correct >= 2` で出現を 0.45 まで落とし、
 * getFlashWeight も同じ条件で 0.3 に落とす。つまり出題ロジックは以前から
 * 「正解2回で定着」とみなして振る舞っており、リングはそれを可視化するだけ。
 */
const RETAINED_MIN_CORRECT = 2;

/**
 * その語が定着済みか。
 *
 * 条件は2つで、どちらも既存のチューニングから借りている：
 *   1. 正解を RETAINED_MIN_CORRECT 回以上積んでいる（まぐれ除け）
 *   2. 誤答に対して正解が十分多い（hasRecoveredFromMistakes、誤答1回につき正解2回）
 *
 * 2 を独自に定義せず苦手フラッシュの卒業ラインを共有しているので、
 * 「苦手フラッシュを卒業した語」と「リングで定着に数える語」がズレない。
 */
export function isRetained(stat: WordStat | undefined): boolean {
  const correct = stat?.correct ?? 0;
  if (correct < RETAINED_MIN_CORRECT) return false;
  return hasRecoveredFromMistakes(stat);
}

/**
 * 定着ドーナツで使う6段階。数字が大きいほど定着が進んでいる（順位が色から読める）。
 * 0 は「未出題」＝一度も出題されていない語。Lv.1 以降と違い、正解を積む機会自体が
 * まだない語なので、「出題されたが正解できていない語（Lv.1）」とは区別する。
 */
export interface RetentionLevel {
  level: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
}

/**
 * 6段階の色。灰色（未出題）→黄（育ってきた）→緑（定着）へ、輝度が単調に
 * 上がる連続スケール。「灰色＝まだ手つかず」「黄＝育ってきた」「緑＝定着」
 * という信号機的な直感に合わせており、一目で段階の進み具合がわかることを
 * 優先している。全色 --surface-0(#12141A) 上で 4.5:1 以上。
 */
export const RETENTION_LEVELS: RetentionLevel[] = [
  { level: 0, label: "未出題", color: "#8a8f94" },
  { level: 1, label: "Lv.1", color: "#9a9a76" },
  { level: 2, label: "Lv.2", color: "#b7ae5c" },
  { level: 3, label: "Lv.3", color: "#d0c256" },
  { level: 4, label: "Lv.4", color: "#e6d554" },
  { level: 5, label: "Lv.5", color: "#a6e86a" },
];

/**
 * その語の定着レベル（0〜5）。
 *
 * 正解数の累積で緩やかに進み、最終段階（Lv.5）だけは isRetained と同じ
 * hasRecoveredFromMistakes も要求する。正解を8回以上積んでいても
 * 誤答から回復し切れていない語は Lv.4 に留める。
 * 一度も出題されていない語（correct・wrong ともに0）だけを「未出題」とし、
 * 出題されたが1問も正解できていない語（wrong > 0）は Lv.1 に区別する。
 */
export function getRetentionLevel(stat: WordStat | undefined): RetentionLevel["level"] {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  if (correct === 0 && wrong === 0) return 0;
  if (correct === 0) return 1;
  if (correct === 1) return 2;
  if (correct <= 3) return 3;
  if (correct <= 7) return 4;
  return hasRecoveredFromMistakes(stat) ? 5 : 4;
}

/** 出題プールの語を定着レベルごとに数える。戻り値の添字は level と一致（0=未出題〜5=Lv.5） */
export function countRetentionLevels(indices: number[], stats: WordStat[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const i of indices) {
    counts[getRetentionLevel(stats[i])] += 1;
  }
  return counts;
}

/** 出題プール（VOCAB_ITEMS の添字）のうち定着済みの語数 */
export function countRetained(indices: number[], stats: WordStat[]): number {
  let count = 0;
  for (const i of indices) {
    if (isRetained(stats[i])) count += 1;
  }
  return count;
}

/** 回答から、その1問を終えたあとの統計を導く */
function applyAnswer(prev: WordStat, correct: boolean): WordStat {
  return correct
    ? { correct: prev.correct + 1, wrong: prev.wrong }
    : { correct: prev.correct, wrong: prev.wrong + 1 };
}

/**
 * このセットで定着済みの語数がいくつ増えたか（減ったら負の数）。
 *
 * セット中に触れていない語は状態が変わりようがないので、プール全体を
 * 走査せずセットの回答だけから正確に出せる。SessionAnswer は回答直前の
 * 統計（previousCorrect/previousWrong）を持っているため、前後の差が取れる。
 *
 * 1セットで同じ語が2回出ることは seenInPlay が防いでいるが、万一重複しても
 * 「最初の回答の直前」と「最後の回答の直後」で比較するので二重に数えない。
 */
export function countRetentionGain(answers: SessionAnswer[] | null): number {
  if (!answers || answers.length === 0) return 0;

  const before = new Map<string, WordStat>();
  const after = new Map<string, WordStat>();

  for (const a of answers) {
    const prev: WordStat = { correct: a.previousCorrect, wrong: a.previousWrong };
    if (!before.has(a.id)) before.set(a.id, prev);
    after.set(a.id, applyAnswer(prev, a.correct));
  }

  let gain = 0;
  for (const [id, afterStat] of after) {
    const wasRetained = isRetained(before.get(id));
    const isNowRetained = isRetained(afterStat);
    if (wasRetained === isNowRetained) continue;
    gain += isNowRetained ? 1 : -1;
  }
  return gain;
}
