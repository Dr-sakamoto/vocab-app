import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCompositionPrompt,
  parseCompositionVerdict,
  sanitizeTagJudgements,
} from "../lib/compose/aiCompositionReview.js";

// AIの応答をそのまま信じない層のテスト。
// ここが緩いと、AIが作った架空のタグが弱点データに入り、
// 「出題できない弱点」が分析画面に居座る。

const verdictJson = JSON.stringify({
  score: 82,
  corrected: "He has already finished his homework.",
  feedback: "already の位置が違います。",
  good: "現在完了を選べています。",
  tags: [{ id: "perfect", verdict: "ok", note: "have + 過去分詞が正しい" }],
});

test("正しいJSONは採点として読める", () => {
  const verdict = parseCompositionVerdict(verdictJson, ["perfect"]);
  assert.equal(verdict.score, 82);
  assert.equal(verdict.corrected, "He has already finished his homework.");
  assert.equal(verdict.tags.length, 1);
  assert.equal(verdict.tags[0].verdict, "ok");
});

test("前後に説明文が付いていても中のJSONを拾う", () => {
  const verdict = parseCompositionVerdict("```json\n" + verdictJson + "\n```", ["perfect"]);
  assert.equal(verdict.score, 82);
});

test("スコアが読めない応答は「採点なし」（0点に丸めない）", () => {
  assert.equal(parseCompositionVerdict("{}"), null);
  assert.equal(parseCompositionVerdict('{"score": "たぶん80点"}'), null);
  assert.equal(parseCompositionVerdict("採点できませんでした"), null);
  assert.equal(parseCompositionVerdict(""), null);
  assert.equal(parseCompositionVerdict(undefined), null);
});

test("スコアは0〜100に収める", () => {
  assert.equal(parseCompositionVerdict('{"score": 140}').score, 100);
  assert.equal(parseCompositionVerdict('{"score": -20}').score, 0);
  assert.equal(parseCompositionVerdict('{"score": "75"}').score, 75);
});

test("知らないタグIDは捨てる", () => {
  const judgements = sanitizeTagJudgements([
    { id: "perfect", verdict: "ok", note: "" },
    { id: "articles-plural", verdict: "missed", note: "" },
    { id: "grammar", verdict: "ok", note: "" },
  ]);
  assert.deepEqual(judgements.map((j) => j.id), ["perfect"]);
});

test("その問題が試していないタグの判定も捨てる（弱点の因果を濁らせない）", () => {
  const judgements = sanitizeTagJudgements(
    [
      { id: "perfect", verdict: "ok", note: "" },
      { id: "articles", verdict: "missed", note: "" },
    ],
    ["perfect"],
  );
  assert.deepEqual(judgements.map((j) => j.id), ["perfect"]);
});

test("判定の値が想定外なら、そのタグごと捨てる", () => {
  const judgements = sanitizeTagJudgements([
    { id: "perfect", verdict: "perfect!", note: "" },
    { id: "articles", verdict: "shaky", note: "" },
  ]);
  assert.deepEqual(judgements.map((j) => j.id), ["articles"]);
});

test("同じタグが二重に返っても1つにまとめる", () => {
  const judgements = sanitizeTagJudgements([
    { id: "perfect", verdict: "ok", note: "1つ目" },
    { id: "perfect", verdict: "missed", note: "2つ目" },
  ]);
  assert.equal(judgements.length, 1);
  assert.equal(judgements[0].note, "1つ目");
});

test("プロンプトには設問・答案・模範解答・狙いのタグが載る", () => {
  const prompt = buildCompositionPrompt({
    question: "彼はもう宿題を終えました。",
    input: "He already has finished his homework.",
    answers: ["He has already finished his homework."],
    tagIds: ["perfect"],
    direction: "ja-to-en",
  });
  assert.match(prompt, /彼はもう宿題を終えました。/);
  assert.match(prompt, /He already has finished his homework\./);
  assert.match(prompt, /He has already finished his homework\./);
  assert.match(prompt, /perfect: 完了形/);
  assert.match(prompt, /JSON/);
  // 模範解答を唯一の正解として押し付けない指示が入っていること
  assert.match(prompt, /これと違ってもよい/);
});

test("和訳では設問と模範解答が入れ替わる", () => {
  const prompt = buildCompositionPrompt({
    question: "He has already finished his homework.",
    input: "彼はもう宿題を終わらせた。",
    answers: ["彼はもう宿題を終えました。"],
    tagIds: ["perfect"],
    direction: "en-to-ja",
  });
  assert.match(prompt, /英文和訳/);
  assert.match(prompt, /学習者の和訳/);
});
