import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeEnglish,
  normalizeJapanese,
  tokenizeEnglish,
} from "../lib/compose/normalize.js";

// 表記の揺れで不正解にしないための正規化。ここが緩すぎても厳しすぎても、
// 学習者は自分の英語ではなく「アプリの好む書き方」を学びはじめる。

test("大文字・句読点・空白の違いは消える", () => {
  assert.equal(normalizeEnglish("  He is  a doctor. "), "he is a doctor");
  assert.equal(normalizeEnglish("Is he a doctor?"), "is he a doctor");
});

test("縮約は展開してから比べる", () => {
  assert.equal(normalizeEnglish("I'm not a doctor."), normalizeEnglish("I am not a doctor"));
  assert.equal(normalizeEnglish("He doesn't know."), normalizeEnglish("He does not know"));
  assert.equal(normalizeEnglish("I can't swim."), normalizeEnglish("I cannot swim"));
  assert.equal(normalizeEnglish("She won't come."), normalizeEnglish("She will not come"));
  assert.equal(normalizeEnglish("They've seen it."), normalizeEnglish("They have seen it"));
});

test("タイポグラフィのアポストロフィも同じ扱いにする", () => {
  assert.equal(normalizeEnglish("I don’t know."), normalizeEnglish("I do not know"));
});

test("語に分けたものは空要素を含まない", () => {
  assert.deepEqual(tokenizeEnglish("  He   is a doctor.  "), ["he", "is", "a", "doctor"]);
  assert.deepEqual(tokenizeEnglish("   "), []);
});

test("和文は空白・句読点・全角英数の違いを吸収する", () => {
  assert.equal(normalizeJapanese("彼は、医者です。"), "彼は医者です");
  assert.equal(normalizeJapanese("彼は 医者 です"), "彼は医者です");
  assert.equal(normalizeJapanese("ＡＢＣ"), "abc");
});
