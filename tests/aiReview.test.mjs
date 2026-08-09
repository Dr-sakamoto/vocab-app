import test from "node:test";
import assert from "node:assert/strict";

import {
  AI_APPROVAL_THRESHOLD,
  buildReviewPrompt,
  parseAiVerdict,
} from "../lib/aiReview.ts";

test("素のJSON応答を判定として読める", () => {
  const verdict = parseAiVerdict('{"score": 85, "feedback": "妥当な訳"}');
  assert.deepEqual(verdict, { approved: true, score: 85, feedback: "妥当な訳" });
});

test("コードフェンスで囲まれた応答からJSONを取り出せる", () => {
  const verdict = parseAiVerdict('```json\n{"score": 90, "feedback": "同義"}\n```');
  assert.equal(verdict?.approved, true);
  assert.equal(verdict?.score, 90);
});

test("前後に説明文が付いた応答からJSONを取り出せる", () => {
  const verdict = parseAiVerdict('判定結果は以下です。{"score": 20, "feedback": "別語"} 以上。');
  assert.equal(verdict?.approved, false);
  assert.equal(verdict?.score, 20);
});

test("閾値ちょうどは合格", () => {
  const verdict = parseAiVerdict(`{"score": ${AI_APPROVAL_THRESHOLD}}`);
  assert.equal(verdict?.approved, true);
});

test("閾値未満は不合格", () => {
  const verdict = parseAiVerdict(`{"score": ${AI_APPROVAL_THRESHOLD - 1}}`);
  assert.equal(verdict?.approved, false);
});

test("feedback が無くても空文字で成立する", () => {
  const verdict = parseAiVerdict('{"score": 75}');
  assert.deepEqual(verdict, { approved: true, score: 75, feedback: "" });
});

test("文字列のスコアも数値として解釈する", () => {
  const verdict = parseAiVerdict('{"score": "80", "feedback": "可"}');
  assert.equal(verdict?.approved, true);
  assert.equal(verdict?.score, 80);
});

test("範囲外のスコアは0〜100にクランプする", () => {
  assert.equal(parseAiVerdict('{"score": 500}')?.score, 100);
  assert.equal(parseAiVerdict('{"score": -30}')?.score, 0);
  assert.equal(parseAiVerdict('{"score": -30}')?.approved, false);
});

// ここが自動フォールバックの肝。解析できなかった応答を「0点＝不正解」と
// 丸めてしまうと、AIの不調がそのまま誤採点になる。null を返して
// 「AI判定なし」に倒し、既存の判定結果を尊重させる。
test("解析できない応答は null（0点に丸めない）", () => {
  assert.equal(parseAiVerdict("判定できませんでした"), null);
  assert.equal(parseAiVerdict("{壊れたJSON"), null);
  assert.equal(parseAiVerdict(""), null);
  assert.equal(parseAiVerdict("   "), null);
});

// Number(null) === 0 / Number(true) === 1 に頼ると、これらが
// 「AIが0点と判定した」と区別できなくなる。
test("スコアが読めない応答は null", () => {
  assert.equal(parseAiVerdict('{"feedback": "理由だけ"}'), null);
  assert.equal(parseAiVerdict('{"score": "たぶん正解"}'), null);
  assert.equal(parseAiVerdict('{"score": null}'), null);
  assert.equal(parseAiVerdict('{"score": ""}'), null);
  assert.equal(parseAiVerdict('{"score": true}'), null);
  assert.equal(parseAiVerdict('{"score": []}'), null);
});

test("文字列以外の入力は null", () => {
  assert.equal(parseAiVerdict(null), null);
  assert.equal(parseAiVerdict(undefined), null);
  assert.equal(parseAiVerdict(42), null);
  assert.equal(parseAiVerdict({ score: 90 }), null);
});

test("配列で1件だけ返ってきた場合は中身を取り出す", () => {
  assert.equal(parseAiVerdict('[{"score": 90}]')?.score, 90);
});

// どれを採用すべきか決められない応答は判定なしに倒す。
test("判定が複数並んだ応答は null", () => {
  assert.equal(parseAiVerdict('[{"score": 90}, {"score": 10}]'), null);
});

test("プロンプトに単語・回答・閾値が含まれる", () => {
  const prompt = buildReviewPrompt("和らげる", "alleviate");
  assert.match(prompt, /alleviate/);
  assert.match(prompt, /和らげる/);
  assert.match(prompt, new RegExp(String(AI_APPROVAL_THRESHOLD)));
});
