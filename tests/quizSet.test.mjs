import assert from "node:assert/strict";
import test from "node:test";

import { findNextUnanswered, summarizeSet } from "../lib/quizSet.js";

// 10問を一枚の小テストとして扱うときの、巡回と集計。

function entry({ poolIndex = 0, id = "w", committed = false, correct = null } = {}) {
  return {
    poolIndex,
    item: { id, target: id, partOfSpeech: "noun", answers: ["訳"] },
    input: "",
    committed,
    outcome:
      correct === null
        ? null
        : {
            status: correct ? "exact" : "wrong",
            correct,
            normalizedAnswers: ["訳"],
            posViolation: null,
            aiFeedback: null,
          },
  };
}

test("次の未回答は後ろへ進む", () => {
  const entries = [
    entry({ committed: true }),
    entry({ committed: false }),
    entry({ committed: false }),
  ];
  assert.equal(findNextUnanswered(entries, 0), 1);
  assert.equal(findNextUnanswered(entries, 1), 2);
});

test("末尾まで行ったら先頭へ回り込み、飛ばした設問を拾う", () => {
  // 3問目まで来て、途中の2問目を空けたまま送った状態
  const entries = [
    entry({ committed: true }),
    entry({ committed: false }),
    entry({ committed: true }),
  ];
  assert.equal(findNextUnanswered(entries, 2), 1, "戻って未回答を拾えていない");
});

test("全問確定済みなら null（＝締めへ進む合図）", () => {
  const entries = [entry({ committed: true }), entry({ committed: true })];
  assert.equal(findNextUnanswered(entries, 0), null);
  assert.equal(findNextUnanswered(entries, 1), null);
});

test("採点前の設問も未回答として扱わない（確定済みなら飛ばす）", () => {
  // 裏で採点中（committed だが outcome はまだ null）の設問へ戻さない
  const entries = [entry({ committed: true, correct: null }), entry({ committed: false })];
  assert.equal(findNextUnanswered(entries, 0), 1);
});

test("正解数とセット内の最長連続正解を数える", () => {
  const entries = [
    entry({ poolIndex: 0, id: "a", correct: true }),
    entry({ poolIndex: 1, id: "b", correct: true }),
    entry({ poolIndex: 2, id: "c", correct: false }),
    entry({ poolIndex: 3, id: "d", correct: true }),
    entry({ poolIndex: 4, id: "e", correct: true }),
    entry({ poolIndex: 5, id: "f", correct: true }),
  ];
  const stats = entries.map(() => ({ correct: 0, wrong: 0 }));

  const { score, bestStreak, answers } = summarizeSet(entries, stats);
  assert.equal(score, 5);
  assert.equal(bestStreak, 3);
  assert.equal(answers.length, 6);
});

test("採点が返っていない設問は不正解として畳み込む", () => {
  const entries = [entry({ correct: true }), entry({ poolIndex: 1, correct: null })];
  const stats = [
    { correct: 0, wrong: 0 },
    { correct: 0, wrong: 0 },
  ];
  const { score, answers } = summarizeSet(entries, stats);
  assert.equal(score, 1);
  assert.equal(answers[1].correct, false);
});

test("previousCorrect / previousWrong はセット開始時点の統計を持つ", () => {
  // 定着ドーナツの増減はこの値との差で出る。セット中に書き換えない。
  const entries = [
    entry({ poolIndex: 2, id: "c", correct: true }),
    entry({ poolIndex: 5, id: "f", correct: false }),
  ];
  const stats = [];
  stats[2] = { correct: 4, wrong: 1 };
  stats[5] = { correct: 0, wrong: 3 };

  const { answers } = summarizeSet(entries, stats);
  assert.deepEqual(answers[0], {
    id: "c",
    correct: true,
    previousCorrect: 4,
    previousWrong: 1,
  });
  assert.deepEqual(answers[1], {
    id: "f",
    correct: false,
    previousCorrect: 0,
    previousWrong: 3,
  });
});

test("統計を持たない語（初出）は 0 から数える", () => {
  const { answers } = summarizeSet([entry({ poolIndex: 9, id: "new", correct: true })], []);
  assert.equal(answers[0].previousCorrect, 0);
  assert.equal(answers[0].previousWrong, 0);
});

test("全問不正解でも最長連続正解は 0 で落ち着く", () => {
  const entries = [entry({ correct: false }), entry({ poolIndex: 1, correct: false })];
  const { score, bestStreak } = summarizeSet(entries, []);
  assert.equal(score, 0);
  assert.equal(bestStreak, 0);
});
