import { QuizEntry, SessionAnswer, WordStat } from "./types";

/**
 * 小テスト1セット（10問）を扱う純関数。
 * 状態を持つのは app/hooks/useQuizSet.ts のほうで、集計と巡回はここに置く。
 */

/**
 * `from` の次に回答すべき設問（まだ確定していない設問）を返す。
 * 末尾まで見たら先頭へ回り込み、全問確定済みなら null。
 *
 * 飛ばした問題へ自動で戻るので、「あとで戻る」ためのボタンを置かずに済む。
 */
export function findNextUnanswered(
  entries: QuizEntry[],
  from: number,
): number | null {
  for (let step = 1; step <= entries.length; step += 1) {
    const slot = (from + step) % entries.length;
    if (!entries[slot].committed) return slot;
  }
  return null;
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
