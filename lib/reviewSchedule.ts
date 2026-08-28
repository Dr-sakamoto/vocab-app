import { WordStat } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 分散学習（間隔反復）の復習間隔。添字が `correctStreak`（直近の連続正解数）で、
 * 値がその語を次に出すまでの日数。最後の段より先は伸ばさない。
 *
 * 正解するたびに1段上がり、誤答すると 0 段目へ戻る（Leitner方式）。
 * 0 段目が 0 日なのは「直近で落とした語・未定着の語は間隔を空けず
 * すぐ出し直す」ため。ここを 0 にしておくと、誤答語については
 * これまで通り getQuestionWeight の weakness だけが効く。
 */
export const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30] as const;

/** 期日前の語に掛かる下限倍率。0 にしないのは出題を枯らさないため */
const MIN_FACTOR = 0.15;
/** 期日を1間隔ぶん超過するごとに上がる倍率と、その上限 */
const OVERDUE_GAIN = 0.5;
const OVERDUE_CAP = 2;

/**
 * 誤答の多い語ほど間隔を詰める係数（0.5〜1.0）。
 *
 * SM-2 の ease factor に当たるが、専用の永続データは増やさず既存の
 * 通算正答率で近似する。これがないと「5回連続で正解したがそれまで
 * 10回落としている語」が、一度も落としていない語と同じ30日間隔まで
 * 飛んでしまう。
 */
function getEaseMultiplier(stat: WordStat | undefined): number {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  if (wrong === 0) return 1;
  const accuracy = correct / (correct + wrong);
  return 0.5 + accuracy * 0.5;
}

/** その語の復習間隔（ミリ秒）。0 は「間隔を空けない＝常に対象」 */
export function getReviewIntervalMs(stat: WordStat | undefined): number {
  const streak = Math.max(0, Math.floor(stat?.correctStreak ?? 0));
  const step = Math.min(streak, REVIEW_INTERVAL_DAYS.length - 1);
  return REVIEW_INTERVAL_DAYS[step] * DAY_MS * getEaseMultiplier(stat);
}

/**
 * 出題重みに掛ける時間係数。1.0 が「ちょうど期日」。
 *
 * - 直近に正解したばかり … MIN_FACTOR まで下がる（間隔を空ける）
 * - 期日に近づくほど 1.0 へ線形に戻る
 * - 期日を過ぎた語は 1.0 を超えて最大 (1 + OVERDUE_GAIN * OVERDUE_CAP) 倍
 *
 * 解答時刻を持たない語（未解答、およびこの機能より前のデータ）は 1.0 を返す。
 * つまり時刻が貯まるまでは従来とまったく同じ重み付けで動く。
 *
 * 倍率であって足し引きではないので、プール内の全語がそろって期日前
 * （毎日たくさん解くユーザーなど）になっても、全体が一律に下がるだけで
 * 相対的な出題確率は従来通りに保たれる。出題が枯れることはない。
 */
export function getRetentionFactor(
  stat: WordStat | undefined,
  now: number = Date.now(),
): number {
  const lastAnswered = stat?.lastAnswered;
  if (typeof lastAnswered !== "number" || !Number.isFinite(lastAnswered)) return 1;

  const interval = getReviewIntervalMs(stat);
  if (interval <= 0) return 1;

  // 端末間の時計ずれで elapsed が負になりうるため 0 で止める
  const elapsed = Math.max(0, now - lastAnswered);
  const ratio = elapsed / interval;

  if (ratio >= 1) return 1 + Math.min(ratio - 1, OVERDUE_CAP) * OVERDUE_GAIN;
  return MIN_FACTOR + (1 - MIN_FACTOR) * ratio;
}

/**
 * 1回の解答を統計へ反映する。正誤カウントに加えて、分散学習が使う
 * 「最終解答時刻」と「連続正解数」も同時に更新する。
 */
export function applyAnswerToStat(
  stat: WordStat | undefined,
  ok: boolean,
  now: number = Date.now(),
): WordStat {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  return ok
    ? {
        correct: correct + 1,
        wrong,
        lastAnswered: now,
        correctStreak: Math.max(0, Math.floor(stat?.correctStreak ?? 0)) + 1,
      }
    : { correct, wrong: wrong + 1, lastAnswered: now, correctStreak: 0 };
}
