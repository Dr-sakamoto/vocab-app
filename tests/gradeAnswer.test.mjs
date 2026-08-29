import assert from "node:assert/strict";
import test from "node:test";

import { gradeAnswer, isCorrectStatus } from "../lib/gradeAnswer.js";

// 1回答ぶんの採点。小テスト形式ではこれを待たずに次の問題を打てるので、
// 「どこまでがネットワーク往復なしで確定するか」が体感速度を決める。

const WORD = {
  id: "abandon",
  target: "abandon",
  partOfSpeech: "verb",
  answers: ["見捨てる", "捨てる"],
};

/** 呼ばれたら記録するだけの fetch。呼ばれないことの検証に使う */
function makeFetch(response) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  return { impl, calls };
}

const jsonResponse = (body) => ({ ok: true, json: async () => body });

test("完全一致は往復なしで正解になる", async () => {
  const { impl, calls } = makeFetch(jsonResponse({ status: "wrong" }));
  const outcome = await gradeAnswer({
    item: WORD,
    answerText: "見捨てる",
    fetchImpl: impl,
  });

  assert.equal(outcome.status, "exact");
  assert.equal(outcome.correct, true);
  assert.deepEqual(calls, [], "完全一致で採点APIを呼んでいる");
});

test("未回答は往復なしで不正解（blank）になる", async () => {
  const { impl, calls } = makeFetch(jsonResponse({ status: "wrong" }));
  for (const answerText of ["", "   ", "　"]) {
    const outcome = await gradeAnswer({ item: WORD, answerText, fetchImpl: impl });
    assert.equal(outcome.status, "blank", `「${answerText}」が blank にならない`);
    assert.equal(outcome.correct, false);
  }
  assert.deepEqual(calls, [], "未回答で採点APIを呼んでいる");
});

test("過去にAIが認めた回答は往復なしで正解になる", async () => {
  const { impl, calls } = makeFetch(jsonResponse({ status: "wrong" }));
  const outcome = await gradeAnswer({
    item: WORD,
    answerText: "放棄する",
    approvedAnswers: { abandon: ["放棄する"] },
    fetchImpl: impl,
  });

  assert.equal(outcome.status, "ai_approved");
  assert.equal(outcome.correct, true);
  assert.deepEqual(calls, [], "記憶済みの正解で採点APIを呼んでいる");
});

test("過去にAIが退けた回答は往復なしで不正解になる", async () => {
  const { impl, calls } = makeFetch(jsonResponse({ status: "ai_approved" }));
  const outcome = await gradeAnswer({
    item: WORD,
    answerText: "拾う",
    rejectedAnswers: { abandon: ["拾う"] },
    fetchImpl: impl,
  });

  assert.equal(outcome.status, "wrong");
  assert.equal(outcome.correct, false);
  assert.deepEqual(calls, [], "記憶済みの誤答で採点APIを呼んでいる");
});

test("それ以外だけが採点APIへ回り、AI承認は正解として返る", async () => {
  const { impl, calls } = makeFetch(
    jsonResponse({
      status: "ai_approved",
      normalizedAnswers: ["見捨てる", "捨てる"],
      aiScore: 0.9,
    }),
  );
  const outcome = await gradeAnswer({
    item: WORD,
    answerText: "置き去りにする",
    fetchImpl: impl,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/check");
  assert.equal(outcome.status, "ai_approved");
  assert.equal(outcome.correct, true);
  assert.equal(outcome.aiScore, 0.9);
});

test("AIが返した不正解には理由と aiScore が乗る（記憶して次回の往復を省ける）", async () => {
  const { impl } = makeFetch(
    jsonResponse({
      status: "wrong",
      normalizedAnswers: ["見捨てる"],
      aiFeedback: "意味が離れている",
      posViolation: "品詞が違う",
      aiScore: 0.1,
    }),
  );
  const outcome = await gradeAnswer({ item: WORD, answerText: "机", fetchImpl: impl });

  assert.equal(outcome.correct, false);
  assert.equal(outcome.aiFeedback, "意味が離れている");
  assert.equal(outcome.posViolation, "品詞が違う");
  assert.equal(outcome.aiScore, 0.1);
});

test("採点APIが落ちても完全一致までの判定で学習を続けられる", async () => {
  const failing = async () => {
    throw new Error("offline");
  };
  const outcome = await gradeAnswer({
    item: WORD,
    answerText: "置き去りにする",
    fetchImpl: failing,
  });

  assert.equal(outcome.status, "wrong");
  assert.equal(outcome.correct, false);
  assert.deepEqual(outcome.normalizedAnswers, ["見捨てる", "捨てる"]);
  assert.equal(outcome.aiScore, undefined, "AI判定なしなのに aiScore が付いている");
});

test("採点APIがエラー応答でも例外にしない", async () => {
  const { impl } = makeFetch({ ok: false, json: async () => ({}) });
  const outcome = await gradeAnswer({ item: WORD, answerText: "あ", fetchImpl: impl });
  assert.equal(outcome.correct, false);
});

test("正解として扱う status は3つだけ", () => {
  for (const status of ["exact", "alternative", "ai_approved"]) {
    assert.equal(isCorrectStatus(status), true, status);
  }
  for (const status of ["wrong", "blank", "skipped", ""]) {
    assert.equal(isCorrectStatus(status), false, status);
  }
});

test("10問ぶんの採点を同時に走らせても互いに干渉しない", async () => {
  // 小テスト形式では、確定した回答の採点が次の問題のタイピングと並走する。
  // 応答順が入れ替わっても、それぞれの結果が自分の設問に返ること。
  const items = Array.from({ length: 10 }, (_, i) => ({
    id: `w${i}`,
    target: `word${i}`,
    partOfSpeech: "noun",
    answers: [`訳${i}`],
  }));
  const slowFetch = async (_url, init) => {
    const { input } = JSON.parse(init.body);
    const slot = Number(input.replace("回答", ""));
    // 後ろの設問ほど早く返す（応答順を入力順とわざと逆にする）
    await new Promise((resolve) => setTimeout(resolve, (10 - slot) * 2));
    return jsonResponse({ status: "ai_approved", aiScore: slot });
  };

  const outcomes = await Promise.all(
    items.map((item, slot) =>
      gradeAnswer({ item, answerText: `回答${slot}`, fetchImpl: slowFetch }),
    ),
  );

  assert.deepEqual(
    outcomes.map((o) => o.aiScore),
    items.map((_, slot) => slot),
  );
});
