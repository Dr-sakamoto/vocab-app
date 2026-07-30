import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAnswer } from "../lib/answerEvaluation.js";
import { normalizeAnswer } from "../lib/answerNormalization.js";

test("normalizes width, case, spaces, and punctuation on the client-safe path", () => {
  assert.equal(normalizeAnswer("  ＩＭＰＬＥＭＥＮＴ！ "), "implement");
});

test("returns exact for normalized answer matches", async () => {
  const result = await evaluateAnswer({
    input: " 緩和する ",
    answers: ["緩和する"],
  });

  assert.equal(result.status, "exact");
});

test("accepts particle and inflection differences as alternatives", async () => {
  const result = await evaluateAnswer({
    input: "調査をした",
    answers: ["調査する"],
  });

  assert.equal(result.status, "alternative");
});

test("accepts hiragana and kanji reading differences as alternatives", async () => {
  const result = await evaluateAnswer({
    input: "かんわ",
    answers: ["緩和"],
  });

  assert.equal(result.status, "alternative");
});

test("rejects kanji homophones with different meanings", async () => {
  const result = await evaluateAnswer({
    input: "昇華する",
    answers: ["消化する"],
  });

  assert.equal(result.status, "wrong");
});

test("accepts dictionary-based synonyms as alternatives", async () => {
  const result = await evaluateAnswer({
    input: "目立たせる",
    answers: ["強調する"],
  });

  assert.equal(result.status, "alternative");
});

test("accepts いう/言う kana-kanji orthography variants as alternatives", async () => {
  const result = await evaluateAnswer({
    input: "悪口をいう",
    answers: ["を呪う", "悪口を言う"],
    partOfSpeech: "verb",
  });

  assert.equal(result.status, "alternative");
});

test("accepts conjugated forms via dictionary base form", async () => {
  const result = await evaluateAnswer({
    input: "食べた",
    answers: ["食べる"],
  });

  assert.equal(result.status, "alternative");
});

test("keeps unrelated answers wrong", async () => {
  const result = await evaluateAnswer({
    input: "破産",
    answers: ["緩和する"],
  });

  assert.equal(result.status, "wrong");
});

test("does not raise a pos hint for adjective phrases with a leading degree adverb", async () => {
  for (const input of ["とても危険な", "極めて重要な", "きちんとした", "はっきりとした", "まっすぐな"]) {
    const result = await evaluateAnswer({
      input,
      answers: ["誠実な"],
      partOfSpeech: "adjective",
    });

    assert.equal(result.posViolation ?? null, null, `unexpected hint for "${input}"`);
  }
});

test("does not raise a pos hint when a na-adjective modifies a later adjective", async () => {
  const result = await evaluateAnswer({
    input: "健康に良い",
    answers: ["誠実な"],
    partOfSpeech: "adjective",
  });

  assert.equal(result.posViolation ?? null, null);
});

test("raises a pos hint for na-adjectives answered in adverbial に form", async () => {
  for (const input of ["危険に", "静かに"]) {
    const result = await evaluateAnswer({
      input,
      answers: ["誠実な"],
      partOfSpeech: "adjective",
    });

    assert.ok(result.posViolation, `expected hint for "${input}"`);
  }
});

test("raises a pos hint for i-adjectives answered in adverbial く form", async () => {
  const result = await evaluateAnswer({
    input: "美しく",
    answers: ["誠実な"],
    partOfSpeech: "adjective",
  });

  assert.ok(result.posViolation);
});

test("strips parenthetical usage notes on the client-safe path", () => {
  assert.equal(normalizeAnswer("（データを）検索する"), "検索する");
});

test("accepts an answer without its parenthetical usage note", async () => {
  const result = await evaluateAnswer({
    input: "検索する",
    answers: ["（データを）検索する"],
  });

  assert.notEqual(result.status, "wrong");
});

test("still accepts the answer when the usage note is typed in full", async () => {
  const result = await evaluateAnswer({
    input: "（データを）検索する",
    answers: ["（データを）検索する"],
  });

  assert.equal(result.status, "exact");
});

test("does not strip parenthetical notes that share a tilde placeholder", () => {
  assert.equal(normalizeAnswer("少しの〜も（ない）"), normalizeAnswer("少しの〜も(ない)"));
  assert.equal(normalizeAnswer("(～を)えさとする"), "えさとする");
});

test("falls back to the original text when an answer is entirely parenthetical", () => {
  assert.equal(normalizeAnswer("（注記）"), "注記");
});
