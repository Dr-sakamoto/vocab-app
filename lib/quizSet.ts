import { applyAnswerToStat } from "./reviewSchedule";
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

/**
 * `activeSlot` が乗っているページに含まれる設問の添字を返す。
 *
 * 10問は1セットのまま、画面に出すのは `pageSize` 問ずつにする。ページは
 * 「いま入力中の設問」から決まるので、順に打っていけば最後の1問を確定した
 * ところで次のページへ入れ替わる（進むためのボタンは要らない）。
 * 飛ばした設問へ戻ったときも、その設問のページがそのまま出る。
 *
 * 採点は設問の確定ごとに裏で走り続けるので、ページが替わっても止まらない。
 */
export function pageSlots(
  activeSlot: number,
  total: number,
  pageSize: number,
): number[] {
  if (total <= 0 || pageSize <= 0) return [];
  const clamped = Math.min(Math.max(Math.floor(activeSlot), 0), total - 1);
  const start = Math.floor(clamped / pageSize) * pageSize;
  const end = Math.min(start + pageSize, total);
  const slots: number[] = [];
  for (let slot = start; slot < end; slot += 1) slots.push(slot);
  return slots;
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
