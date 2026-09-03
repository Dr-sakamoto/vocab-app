import assert from "node:assert/strict";
import test from "node:test";

import {
  englishSimilarity,
  gradeLocally,
  japaneseSimilarity,
  toVerdict,
} from "../lib/compose/localGrade.js";

// AIが使えないときの採点（模範解答との照合）。
// 保険なので、厳しすぎて学習を止めないことのほうが大事。

test("模範解答と同じなら満点", () => {
  const grade = gradeLocally({
    input: "He has already finished his homework.",
    answers: ["He has already finished his homework."],
    direction: "ja-to-en",
  });
  assert.equal(grade.score, 100);
  assert.equal(grade.verdict, "pass");
  assert.equal(grade.aiJudged, false, "ローカル採点はAI判定を名乗らない");
});

test("表記の揺れ（縮約・句読点・大文字）は満点のまま", () => {
  const grade = gradeLocally({
    input: "he hasn't finished his homework",
    answers: ["He has not finished his homework."],
    direction: "ja-to-en",
  });
  assert.equal(grade.score, 100);
});

test("冠詞ひとつの違いで不合格にはしない", () => {
  const grade = gradeLocally({
    input: "He is doctor.",
    answers: ["He is a doctor."],
    direction: "ja-to-en",
  });
  assert.ok(grade.score >= 80, `冠詞1語で ${grade.score} 点まで落ちている`);
});

test("語順が違えば語彙が同じでも下がる", () => {
  const same = englishSimilarity("Tokyo is bigger than Osaka", "Tokyo is bigger than Osaka");
  const swapped = englishSimilarity("Osaka is bigger than Tokyo", "Tokyo is bigger than Osaka");
  assert.equal(same, 1);
  assert.ok(swapped < same, "主語と目的語を入れ替えても同点になっている");
});

test("複数の模範解答のうち、いちばん近いものが採点に使われる", () => {
  const grade = gradeLocally({
    input: "My father took this picture.",
    answers: ["This picture was taken by my father.", "My father took this picture."],
    direction: "ja-to-en",
  });
  assert.equal(grade.score, 100);
  assert.equal(grade.corrected, "My father took this picture.");
});

test("空の答案は0点で、責める文言を出さない", () => {
  const grade = gradeLocally({
    input: "   ",
    answers: ["He is a doctor."],
    direction: "ja-to-en",
  });
  assert.equal(grade.score, 0);
  assert.equal(grade.corrected, "He is a doctor.");
  assert.ok(grade.feedback.length > 0);
});

test("和訳は文字単位で照合する", () => {
  assert.equal(japaneseSimilarity("彼は医者です。", "彼は医者です"), 1);
  assert.ok(japaneseSimilarity("彼は医者です", "彼は教師です") < 1);
  assert.ok(
    japaneseSimilarity("彼は医者です", "彼は医者だ") > japaneseSimilarity("彼は医者です", "犬が走る"),
  );
});

test("判定のしきい値は合格80・惜しい60", () => {
  assert.equal(toVerdict(100), "pass");
  assert.equal(toVerdict(80), "pass");
  assert.equal(toVerdict(79), "close");
  assert.equal(toVerdict(60), "close");
  assert.equal(toVerdict(59), "review");
});
