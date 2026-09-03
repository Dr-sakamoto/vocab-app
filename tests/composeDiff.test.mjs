import assert from "node:assert/strict";
import test from "node:test";

import { diffWords, hasEdits } from "../lib/compose/diff.js";

// 添削のどこが変わったかを示す差分。学習者が自力では見つけられない
// 「直された箇所」を機械の側で出すためのもの。

const render = (segments) => segments.map((s) => `${s.type}:${s.text}`).join("|");

test("同じ文なら差分は出ない", () => {
  const segments = diffWords("I have a pen.", "I have a pen.");
  assert.equal(render(segments), "same:I have a pen.");
  assert.equal(hasEdits(segments), false);
});

test("語の置き換えは削除と追加で表す", () => {
  const segments = diffWords("I go to school yesterday", "I went to school yesterday");
  assert.equal(render(segments), "same:I|removed:go|added:went|same:to school yesterday");
  assert.equal(hasEdits(segments), true);
});

test("挿入された語だけが added になる", () => {
  const segments = diffWords("He is doctor", "He is a doctor");
  assert.equal(render(segments), "same:He is|added:a|same:doctor");
});

test("削除された語だけが removed になる", () => {
  const segments = diffWords("I discussed about it", "I discussed it");
  assert.equal(render(segments), "same:I discussed|removed:about|same:it");
});

test("大文字と句読点の違いだけでは差分にしない（直された点だけを見せる）", () => {
  const segments = diffWords("he is a doctor", "He is a doctor.");
  assert.equal(hasEdits(segments), false);
});

test("空の答案では添削文がすべて追加になる", () => {
  const segments = diffWords("", "I have a pen.");
  assert.equal(render(segments), "added:I have a pen.");
});
