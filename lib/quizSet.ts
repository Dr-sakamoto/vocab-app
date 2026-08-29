import { applyAnswerToStat } from "./reviewSchedule";
import { QuizEntry, SessionAnswer, WordStat } from "./types";

/**
 * 小テスト1セット（10問）を扱う純関数。
 * 状態を持つのは app/hooks/useQuizSet.ts のほうで、集計と巡回はここに置く。
 */

/**
 * 出題中に画面へ出す設問の添字。`windowStart`（上）とその次（下）の2問だけを
 * 返す（末尾では上の1問だけになる）。
 *
 * 10問は1セットのまま、常に見えているのは上下2問。上は採点中／採点済み、
 * 下がいま回答中の設問にあたる。窓は `canAdvanceWindow` が許すときだけ
 * 1つずつ前へ進み、静的な2問区切りのページ送りはしない。
 */
export function windowSlots(windowStart: number, total: number): number[] {
  if (total <= 0) return [];
  const clamped = Math.min(Math.max(Math.floor(windowStart), 0), total - 1);
  const slots = [clamped];
  if (clamped + 1 < total) slots.push(clamped + 1);
  return slots;
}

/**
 * 窓（`windowStart`＝上、その次＝下）を1つ前へ進めてよいかを判定する。
 *
 * 進めてよいのは「下を確定していて」「かつ上の採点がすでに返っている」とき
 * だけ。上の答え合わせを一度も見せないまま下が上に繰り上がる（＝答え合わせを
 * 見ずに次の問題が出る）ことがないようにするための唯一の条件。
 * 下がまだ無い（末尾）ときは進めない。
 */
export function canAdvanceWindow(entries: QuizEntry[], windowStart: number): boolean {
  const top = entries[windowStart];
  const bottom = entries[windowStart + 1];
  if (!top || !bottom) return false;
  if (!top.committed || top.outcome === null) return false;
  if (!bottom.committed) return false;
  return true;
}

export interface SetSummary {
  answers: SessionAnswer[];
  score: number;
  /** セット内で連続正解が続いた最長の長さ */
  bestStreak: number;
}

/**
 * 採点済みのセットを成績へ畳み込む。
 *
 * previousCorrect / previousWrong はセット開始時点の統計を使う。
 * 同じ語が1セットに二度出ることはないので、1問ずつ採点していた頃と
 * 同じ値になる。
 */
export function summarizeSet(entries: QuizEntry[], stats: WordStat[]): SetSummary {
  const answers = entries.map((entry) => ({
    id: entry.item.id,
    correct: entry.outcome?.correct ?? false,
    previousCorrect: stats[entry.poolIndex]?.correct ?? 0,
    previousWrong: stats[entry.poolIndex]?.wrong ?? 0,
  }));

  let bestStreak = 0;
  let run = 0;
  for (const answer of answers) {
    run = answer.correct ? run + 1 : 0;
    if (run > bestStreak) bestStreak = run;
  }

  return {
    answers,
    score: answers.filter((a) => a.correct).length,
    bestStreak,
  };
}

/**
 * セット1回ぶんの回答を統計へ畳み込んだ新しい配列を返す。
 *
 * 締めの処理では同じ結果を2度使う——保存する統計そのものと、
 * 新しい語を解放してよいかの判定（lib/unlockGate.ts）に渡す分布。
 * 畳み込みをここに1本化しておかないと、片方だけ1セットぶん古い統計を
 * 見て「解放の判定がセット1つ遅れる」ことになる。
 */
export function applySetToStats(
  entries: QuizEntry[],
  stats: WordStat[],
  now?: number,
): WordStat[] {
  const next = [...stats];
  for (const entry of entries) {
    next[entry.poolIndex] = applyAnswerToStat(
      next[entry.poolIndex],
      entry.outcome?.correct ?? false,
      now,
    );
  }
  return next;
}
