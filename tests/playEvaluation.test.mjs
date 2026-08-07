import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePlay } from "../lib/playEvaluation.js";

const PLAY_LIMIT = 10;

/** multiplier=1 (A1ティア), fzm=1.1 (playCount=1) で評価する */
const evaluate = (answers, score) =>
  evaluatePlay({
    answers,
    score,
    playLimit: PLAY_LIMIT,
    bestStreak: 0,
    unlockedPoolSize: 1,
    playCount: 1,
  });

/** 同じ履歴の語を n 問ぶん作る */
const words = (n, correct, previousCorrect, previousWrong) =>
  Array.from({ length: n }, (_, i) => ({
    id: `w${previousCorrect}-${previousWrong}-${correct}-${i}`,
    correct,
    previousCorrect,
    previousWrong,
  }));

const bonus = (evaluation, label) =>
  evaluation.breakdown.find((b) => b.label.includes(label))?.points ?? 0;

// ── 定着スコア上昇ボーナスの条件 ──────────────────────────────────────────

// 旧条件は `previousCorrect - previousWrong <= 0` で、マイナスのままの語にも
// 加算されていた（ラベルは「プラス転換」なのに転換していない）。
test("定着スコアがマイナスのままの語にはプラス転換ボーナスを出さない", () => {
  // (正解0, 誤答5) は正解しても 1-5 = -4 でマイナスのまま
  const result = evaluate(words(10, true, 0, 5), 10);
  assert.equal(bonus(result, "定着スコア上昇"), 0);
  // 苦手回収の方は正しく出る
  assert.ok(bonus(result, "苦手回収") > 0);
});

test("差がちょうど0の語は符号が反転するのでボーナスを出す", () => {
  // (正解2, 誤答2) は正解で 3-2 = +1 へ転換する
  const result = evaluate(words(10, true, 2, 2), 10);
  assert.equal(bonus(result, "定着スコア上昇"), 400); // 10語 × 40 × 1
});

test("すでにプラスの語にはプラス転換ボーナスを出さない", () => {
  const result = evaluate(words(10, true, 3, 1), 10);
  assert.equal(bonus(result, "定着スコア上昇"), 0);
});

test("初見正解は新単語ボーナスのみで、定着ボーナスと二重取りしない", () => {
  const result = evaluate(words(10, true, 0, 0), 10);
  assert.equal(bonus(result, "新単語初見正解"), 500); // 10語 × 50 × 1
  assert.equal(bonus(result, "定着スコア上昇"), 0);
});

// ── グレードと XP が逆転しないこと ────────────────────────────────────────

// 旧実装では 2/10 正解（グレードD）の 284XP が 10/10 正解（グレードS）の
// 220XP を上回っていた。誤答に一切コストがないのが原因。
test("成績の悪いセッションが完璧なセッションを上回らない", () => {
  const poor = evaluate(
    [...words(2, true, 0, 5), ...words(8, false, 0, 5)],
    2,
  );
  const perfect = evaluate(words(10, true, 5, 0), 10);

  assert.equal(poor.grade, "D");
  assert.equal(perfect.grade, "S");
  assert.ok(
    poor.xp < perfect.xp,
    `グレードDのXP(${poor.xp})がグレードSのXP(${perfect.xp})を上回っている`,
  );
});

test("誤答はボーナスの取り分を目減りさせる", () => {
  // 同じ「苦手語を2語回収した」セッションでも、残りを落としたかどうかで差がつく
  const clean = evaluate(
    [...words(2, true, 0, 5), ...words(8, true, 5, 0)],
    10,
  );
  const messy = evaluate(
    [...words(2, true, 0, 5), ...words(8, false, 5, 0)],
    2,
  );
  assert.ok(
    bonus(messy, "苦手回収") < bonus(clean, "苦手回収"),
    "誤答してもボーナスが目減りしていない",
  );
  assert.equal(bonus(clean, "苦手回収"), 160); // 2語 × 80 × 1.0
  assert.equal(bonus(messy, "苦手回収"), 32); // 2語 × 80 × 0.2
});

test("全問正解ならボーナスは目減りしない", () => {
  const result = evaluate(words(10, true, 0, 3), 10);
  assert.equal(bonus(result, "苦手回収"), 800); // 10語 × 80 × 1.0
  for (const item of result.breakdown) {
    assert.ok(!item.detail.includes("正答率"), "全問正解なのに減算表示が出ている");
  }
});

test("正答率が低いセッションは内訳に減算を明示する", () => {
  const result = evaluate([...words(5, true, 0, 3), ...words(5, false, 0, 3)], 5);
  const weakness = result.breakdown.find((b) => b.label.includes("苦手回収"));
  assert.ok(weakness.detail.includes("×正答率50%"), weakness.detail);
});

// ── XP がスコアに対して単調であること ─────────────────────────────────────

test("同じ単語構成なら正解数が多いほどXPが高い", () => {
  const xps = [];
  for (let score = 0; score <= PLAY_LIMIT; score++) {
    const answers = [
      ...words(score, true, 0, 3),
      ...words(PLAY_LIMIT - score, false, 0, 3),
    ];
    xps.push(evaluate(answers, score).xp);
  }
  for (let i = 1; i < xps.length; i++) {
    assert.ok(xps[i] > xps[i - 1], `正解数を増やしてXPが下がった: ${JSON.stringify(xps)}`);
  }
});

// ── 既存挙動の確認 ────────────────────────────────────────────────────────

test("グレードは正答率どおりに決まる", () => {
  const gradeFor = (score) =>
    evaluate(
      [...words(score, true, 5, 0), ...words(PLAY_LIMIT - score, false, 5, 0)],
      score,
    ).grade;
  assert.equal(gradeFor(10), "S");
  assert.equal(gradeFor(8), "A");
  assert.equal(gradeFor(6), "B");
  assert.equal(gradeFor(4), "C");
  assert.equal(gradeFor(0), "D");
});

test("answers が null でも基本XPだけで成立する", () => {
  const result = evaluatePlay({
    answers: null,
    score: 7,
    playLimit: PLAY_LIMIT,
    bestStreak: 0,
    unlockedPoolSize: 1,
    playCount: 1,
  });
  assert.equal(result.xp, 154); // 7 × 20 × 1 × 1.1
  assert.equal(result.breakdown.length, 1);
});

test("XPは常に非負で有限", () => {
  for (let score = 0; score <= PLAY_LIMIT; score++) {
    for (const [pc, pw] of [[0, 0], [0, 5], [2, 2], [5, 0], [3, 1]]) {
      const answers = [
        ...words(score, true, pc, pw),
        ...words(PLAY_LIMIT - score, false, pc, pw),
      ];
      const { xp } = evaluate(answers, score);
      assert.ok(Number.isFinite(xp) && xp >= 0, `不正なXP: ${xp}`);
    }
  }
});
