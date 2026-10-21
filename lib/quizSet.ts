import { applyAnswerToStat } from "./reviewSchedule";
import { QuizEntry, SessionAnswer, WordStat } from "./types";

/**
 * 小テスト1セット（10問）を扱う純関数。
 * 状態を持つのは app/hooks/useQuizSet.ts のほうで、集計と巡回はここに置く。
 */

/**
 * 出題中に同時に見せる設問の数。
 *
 * 窓は「いちばん上の採点が返る」まで進めない。2問だと、上の採点を待つあいだに
 * 打てるのは下の1問だけで、AI判定の往復が長いとそこで手が止まっていた。
 * 3問にすると2問先まで打ち進められ、採点の往復がタイピングの裏に隠れる。
 */
export const QUIZ_WINDOW_SIZE = 3;

/**
 * 出題中に画面へ出す設問の添字。`windowStart`（上）から QUIZ_WINDOW_SIZE 問を
 * 返す（末尾では残りの問題だけになる）。
 *
 * 10問は1セットのまま、常に見えているのは窓の中の数問。上は採点中／採点済み、
 * 下のほうがいま回答中の設問にあたる。窓は `canAdvanceWindow` が許すときだけ
 * 1つずつ前へ進み、静的なページ送りはしない。
 */
export function windowSlots(windowStart: number, total: number): number[] {
  if (total <= 0) return [];
  const clamped = Math.min(Math.max(Math.floor(windowStart), 0), total - 1);
  const slots: number[] = [];
  for (let slot = clamped; slot < Math.min(clamped + QUIZ_WINDOW_SIZE, total); slot += 1) {
    slots.push(slot);
  }
  return slots;
}

/**
 * 窓（`windowStart`＝上）を1つ前へ進めてよいかを判定する。
 *
 * 進めてよいのは「窓の中をすべて確定していて」「かつ上の採点がすでに返って
 * いる」ときだけ。上の答え合わせを一度も見せないまま窓の外へ押し出す
 * （＝答え合わせを見ずに次の問題が出る）ことがないようにするための条件。
 * 上の次の設問が無い（末尾）ときは進めない。
 */
export function canAdvanceWindow(entries: QuizEntry[], windowStart: number): boolean {
  const top = entries[windowStart];
  if (!top || !entries[windowStart + 1]) return false;
  if (!top.committed || top.outcome === null) return false;
  return windowSlots(windowStart, entries.length).every((slot) => entries[slot].committed);
}

export interface ResultContinueGate {
  /** 次のセットへ進めてよいか */
  allowed: boolean;
  /** 次に判定するときの起点。弾いた入力は起点を「弾いた時刻」へずらす */
  anchorAt: number;
}

/**
 * 結果発表から次のセットへ進めてよいかを判定する（起点から graceMs 経過が条件）。
 *
 * 10問を Enter／タップで送り続けた勢いは、最後の1打が余ったまま結果発表へ
 * 着地する。時間の窓を固定にすると、窓が明けた直後に届いた「余りの1打」で
 * 結局そのまま飛んでしまう。そこで弾くたびに起点を今へずらし、入力が
 * graceMs だけ途切れて初めて通す——勢いで押し続けているあいだは進まず、
 * 手を止めてもう一度押せば必ず通る。
 *
 * 判定を進めるのは呼び出し側の責任（返した anchorAt を次の判定へ渡す）。
 */
export function resolveResultContinue(
  anchorAt: number,
  now: number,
  graceMs: number,
): ResultContinueGate {
  if (now - anchorAt >= graceMs) return { allowed: true, anchorAt };
  return { allowed: false, anchorAt: now };
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
