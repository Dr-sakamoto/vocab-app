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

test("keeps unrelated answers wrong", async () => {
  const result = await evaluateAnswer({
    input: "破産",
    answers: ["緩和する"],
  });

  assert.equal(result.status, "wrong");
});
