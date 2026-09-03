import assert from "node:assert/strict";
import test from "node:test";

import { evaluateSession } from "../lib/compose/sessionEvaluation.js";
import { applyAttemptToProgress, EMPTY_PROGRESS } from "../lib/compose/progress.js";

// セッションの講評。点数ではなく「どの文法が動いたか」を主役にする。

const NOW = Date.UTC(2026, 8, 1);

const attempt = (overrides = {}) => ({
  promptId: "s04",
  direction: "ja-to-en",
  question: "これは私が昨日買った本です。",
  input: "This is the book I bought yesterday.",
  answers: ["This is the book I bought yesterday."],
  tags: ["relative"],
  score: 95,
  verdict: "pass",
  corrected: "This is the book I bought yesterday.",
  feedback: "",
  good: "関係代名詞の省略が自然です",
  tagJudgements: [{ id: "relative", verdict: "ok", note: "" }],
  hintUsed: false,
  answeredAt: NOW,
  ...overrides,
});

function sessionOf(attempts, before = EMPTY_PROGRESS) {
  const after = attempts.reduce(applyAttemptToProgress, before);
  return evaluateSession({ attempts, before, after });
}

test("成績はセッションの答案から出る", () => {
  const evaluation = sessionOf([attempt(), attempt({ promptId: "s05", score: 50, verdict: "review" })]);
  assert.equal(evaluation.total, 2);
  assert.equal(evaluation.passCount, 1);
  assert.equal(evaluation.averageScore, 73);
});

test("グレードは平均点で決まる", () => {
  assert.equal(sessionOf([attempt({ score: 95 })]).grade, "S");
  assert.equal(sessionOf([attempt({ score: 82 })]).grade, "A");
  assert.equal(sessionOf([attempt({ score: 65 })]).grade, "B");
  assert.equal(sessionOf([attempt({ score: 40 })]).grade, "C");
});

test("触れたタグの習熟度が前後で出る", () => {
  const evaluation = sessionOf([attempt()]);
  const relative = evaluation.tagDeltas.find((tag) => tag.tagId === "relative");
  assert.ok(relative);
  assert.equal(relative.label, "関係詞");
  assert.ok(relative.delta > 0, "合格したのに習熟度が上がっていない");
  assert.equal(evaluation.improved[0].tagId, "relative");
});

test("伸びたタグがあれば、それを名指しで伝える", () => {
  const evaluation = sessionOf([attempt(), attempt({ promptId: "s14" })]);
  assert.match(evaluation.message, /関係詞/);
});

test("落としたタグは「次に狙うところ」として残す（責めない）", () => {
  let before = EMPTY_PROGRESS;
  for (const score of [95, 90, 95]) {
    before = applyAttemptToProgress(before, attempt({ score, answeredAt: NOW - 1 }));
  }
  const evaluation = sessionOf([attempt({ score: 20, verdict: "review", tagJudgements: [{ id: "relative", verdict: "missed", note: "" }] })], before);
  assert.ok(evaluation.focus, "落としたタグが focus に出ていない");
  assert.equal(evaluation.focus.tagId, "relative");
  assert.doesNotMatch(evaluation.message, /ダメ|できていません|残念/);
});

test("答案が無いセッションでも壊れない", () => {
  const evaluation = sessionOf([]);
  assert.equal(evaluation.total, 0);
  assert.equal(evaluation.averageScore, 0);
  assert.equal(evaluation.tagDeltas.length, 0);
  assert.ok(evaluation.message.length > 0);
});
