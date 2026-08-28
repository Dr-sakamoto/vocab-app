import assert from "node:assert/strict";
import test from "node:test";

import {
  REVIEW_INTERVAL_DAYS,
  applyAnswerToStat,
  getRetentionFactor,
  getReviewIntervalMs,
} from "../lib/reviewSchedule.js";
import { getQuestionWeight } from "../lib/questionWeight.js";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

/** 「n日前に最後に解答し、直近 streak 回連続正解している語」 */
const stat = (correct, wrong, correctStreak, daysAgo) => ({
  correct,
  wrong,
  correctStreak,
  lastAnswered: NOW - daysAgo * DAY,
});

// ── 既存データとの互換 ──────────────────────────────────────────────────────

test("解答時刻を持たない語は従来通りの重み（係数1.0）で扱う", () => {
  // この機能より前に保存された統計、および未解答の語
  assert.equal(getRetentionFactor({ correct: 5, wrong: 1 }, NOW), 1);
  assert.equal(getRetentionFactor(undefined, NOW), 1);
  assert.equal(getRetentionFactor({ correct: 0, wrong: 0 }, NOW), 1);
});

test("時刻を持つ語と持たない語が混在してもすべて有限の正の重みになる", () => {
  const mixed = [
    { correct: 3, wrong: 0 },
    stat(3, 0, 3, 0),
    stat(0, 4, 0, 30),
    { correct: 0, wrong: 0 },
  ];
  for (const s of mixed) {
    const weight = getQuestionWeight(s, 1.0, NOW);
    assert.ok(Number.isFinite(weight) && weight > 0, `不正な重み: ${weight}`);
  }
});

// ── 間隔の段 ────────────────────────────────────────────────────────────────

test("連続正解を重ねるほど復習間隔が伸び、最後の段で頭打ちになる", () => {
  const intervals = [0, 1, 2, 3, 4, 5].map((s) => getReviewIntervalMs(stat(10, 0, s, 0)));
  for (let i = 1; i < intervals.length; i++) {
    assert.ok(
      intervals[i] > intervals[i - 1],
      `連続正解${i}回で間隔が伸びていない: ${JSON.stringify(intervals)}`,
    );
  }
  const capped = REVIEW_INTERVAL_DAYS[REVIEW_INTERVAL_DAYS.length - 1] * DAY;
  assert.equal(getReviewIntervalMs(stat(10, 0, 5, 0)), capped);
  assert.equal(getReviewIntervalMs(stat(10, 0, 99, 0)), capped);
});

test("誤答した語は間隔を空けず、これまで通りすぐ出し直す", () => {
  // correctStreak が 0 に戻るため間隔ゼロ＝常に対象。誤答語の重みは
  // 従来の weakness だけで決まり、この機能で弱まらない。
  assert.equal(getReviewIntervalMs(stat(2, 3, 0, 0)), 0);
  assert.equal(getRetentionFactor(stat(2, 3, 0, 0), NOW), 1);
  assert.equal(
    getQuestionWeight(stat(2, 3, 0, 0), 1.0, NOW),
    getQuestionWeight({ correct: 2, wrong: 3 }, 1.0, NOW),
  );
});

test("誤答の多い語ほど同じ連続正解数でも間隔が短い", () => {
  const clean = getReviewIntervalMs(stat(10, 0, 3, 0));
  const shaky = getReviewIntervalMs(stat(5, 5, 3, 0));
  assert.ok(shaky < clean, `苦戦した語の間隔が詰まっていない: ${shaky} / ${clean}`);
  assert.ok(shaky >= clean * 0.5, `間隔を詰めすぎ: ${shaky} / ${clean}`);
});

// ── 時間係数 ────────────────────────────────────────────────────────────────

test("正解直後は強く抑えられ、期日に近づくほど戻る", () => {
  const justNow = getRetentionFactor(stat(3, 0, 2, 0), NOW);
  assert.ok(justNow < 0.2, `正解直後が抑えられていない: ${justNow}`);

  const series = [0, 0.5, 1, 2, 3].map((d) => getRetentionFactor(stat(3, 0, 2, d), NOW));
  for (let i = 1; i < series.length; i++) {
    assert.ok(
      series[i] > series[i - 1],
      `時間が経っても重みが戻らない: ${JSON.stringify(series)}`,
    );
  }
});

test("期日ちょうどで係数1.0に戻り、超過ぶんは上限つきで押し上げる", () => {
  // 連続正解2回・無失点 → 間隔3日
  const due = getRetentionFactor(stat(3, 0, 2, 3), NOW);
  assert.ok(Math.abs(due - 1) < 1e-9, `期日で1.0になっていない: ${due}`);

  assert.ok(getRetentionFactor(stat(3, 0, 2, 6), NOW) > 1, "期日超過が押し上げられていない");
  const veryOverdue = getRetentionFactor(stat(3, 0, 2, 365), NOW);
  assert.ok(veryOverdue <= 2 + 1e-9, `超過ぶんの上限が効いていない: ${veryOverdue}`);
});

test("端末間の時計ずれで未来の解答時刻が入っても壊れない", () => {
  const future = getRetentionFactor(
    { correct: 3, wrong: 0, correctStreak: 2, lastAnswered: NOW + 10 * DAY },
    NOW,
  );
  assert.ok(Number.isFinite(future) && future > 0 && future <= 1, `不正な係数: ${future}`);
});

// ── 出題への効き方 ──────────────────────────────────────────────────────────

test("同じ成績なら、久しぶりの語のほうが直近に解いた語より出やすい", () => {
  const fresh = getQuestionWeight(stat(3, 0, 2, 0), 1.0, NOW);
  const stale = getQuestionWeight(stat(3, 0, 2, 30), 1.0, NOW);
  assert.ok(stale > fresh * 3, `分散の効きが弱い: ${fresh} → ${stale}`);
});

test("同じ間隔の語がそろって期日前でも相対的な出題確率は従来のまま", () => {
  // 毎日たくさん解くユーザーはプール内の全語が「期日前」になりうる。
  // 係数は掛け算なので、同じ間隔の語どうしはそろって下がるだけで並びは変わらない。
  const profiles = [[1, 0], [2, 0], [3, 0], [10, 0]];
  const withTime = profiles.map(([c, x]) => getQuestionWeight(stat(c, x, 1, 0.5), 1.0, NOW));
  const without = profiles.map(([c, x]) =>
    getQuestionWeight({ correct: c, wrong: x }, 1.0, NOW),
  );

  const share = (list) => {
    const total = list.reduce((a, b) => a + b, 0);
    return list.map((v) => v / total);
  };
  const a = share(withTime);
  const b = share(without);
  for (let i = 0; i < a.length; i++) {
    assert.ok(
      Math.abs(a[i] - b[i]) < 1e-9,
      `一律の期日前で出題比率が変わった: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`,
    );
  }
});

test("期日前でも重みは消えず、出題候補として残る", () => {
  for (const [c, x] of [[1, 0], [3, 0], [10, 0], [3, 1], [10, 2]]) {
    const suppressed = getQuestionWeight(stat(c, x, 5, 0), 1.0, NOW);
    const base = getQuestionWeight({ correct: c, wrong: x }, 1.0, NOW);
    assert.ok(suppressed > 0, `(正解${c}, 誤答${x}) の重みが消えた`);
    assert.ok(
      suppressed >= base * 0.15 - 1e-9,
      `(正解${c}, 誤答${x}) を抑えすぎ: ${suppressed} / ${base}`,
    );
  }
});

test("同じ日に正解した語でも、苦戦している語のほうが先に戻ってくる", () => {
  const daysAgo = 1;
  const clean = getQuestionWeight(stat(10, 0, 2, daysAgo), 1.0, NOW);
  const shaky = getQuestionWeight(stat(5, 5, 2, daysAgo), 1.0, NOW);
  assert.ok(shaky > clean, `苦戦している語が先に戻ってこない: ${shaky} / ${clean}`);
});

// ── 解答の反映 ──────────────────────────────────────────────────────────────

test("正解で連続正解数が1つ上がり、解答時刻が入る", () => {
  const next = applyAnswerToStat({ correct: 2, wrong: 1, correctStreak: 1 }, true, NOW);
  assert.deepEqual(next, { correct: 3, wrong: 1, lastAnswered: NOW, correctStreak: 2 });
});

test("誤答で連続正解数が0に戻る", () => {
  const next = applyAnswerToStat(
    { correct: 9, wrong: 0, correctStreak: 9, lastAnswered: NOW - DAY },
    false,
    NOW,
  );
  assert.deepEqual(next, { correct: 9, wrong: 1, lastAnswered: NOW, correctStreak: 0 });
});

test("時刻を持たない既存データに初めて解答しても壊れない", () => {
  assert.deepEqual(applyAnswerToStat({ correct: 4, wrong: 2 }, true, NOW), {
    correct: 5,
    wrong: 2,
    lastAnswered: NOW,
    correctStreak: 1,
  });
  assert.deepEqual(applyAnswerToStat(undefined, false, NOW), {
    correct: 0,
    wrong: 1,
    lastAnswered: NOW,
    correctStreak: 0,
  });
});
