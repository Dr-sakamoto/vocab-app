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
