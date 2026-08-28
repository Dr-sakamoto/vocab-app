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

/** 定着ドーナツで使う5段階。数字が大きいほど定着が進んでいる（順位が色から読める）。 */
export interface RetentionLevel {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
}

/**
 * 5段階の色。無彩色寄りの紫からピンクへ、輝度が単調に上がる連続スケール。
 * POOL_TIERS（無彩色→青緑→緑→黄）や --accent（青）と色相を分け、
 * 「出題プールの規模」と「語ごとの定着度」を別の色として見分けられるようにしている。
 * 全色 --surface-0(#12141A) 上で 4.5:1 以上。
 */
export const RETENTION_LEVELS: RetentionLevel[] = [
  { level: 1, label: "Lv.1", color: "#8a8fa8" },
  { level: 2, label: "Lv.2", color: "#9a8fd6" },
  { level: 3, label: "Lv.3", color: "#a98fe8" },
  { level: 4, label: "Lv.4", color: "#c090e8" },
  { level: 5, label: "Lv.5", color: "#e08fd8" },
];

/**
 * その語の定着レベル（1〜5）。
 *
 * 正解数の累積で緩やかに進み、最終段階（Lv.5）だけは isRetained と同じ
 * hasRecoveredFromMistakes も要求する。正解を8回以上積んでいても
 * 誤答から回復し切れていない語は Lv.4 に留める。
 */
export function getRetentionLevel(stat: WordStat | undefined): RetentionLevel["level"] {
  const correct = stat?.correct ?? 0;
  if (correct === 0) return 1;
  if (correct === 1) return 2;
  if (correct <= 3) return 3;
  if (correct <= 7) return 4;
  return hasRecoveredFromMistakes(stat) ? 5 : 4;
}

/** 出題プールの語を定着レベルごとに数える。戻り値の添字 0 が Lv.1、4 が Lv.5 */
export function countRetentionLevels(indices: number[], stats: WordStat[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const i of indices) {
    counts[getRetentionLevel(stats[i]) - 1] += 1;
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
