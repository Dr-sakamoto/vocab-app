import assert from "node:assert/strict";
import test from "node:test";

import { toAiVerdictRecord } from "../lib/aiVerdictLog.js";
import { VOCAB_ITEMS } from "../lib/vocab/index.js";

const WORD = VOCAB_ITEMS[0];

test("収録語のAI判定は正規化した回答で記録する", () => {
  assert.deepEqual(toAiVerdictRecord(WORD.id, WORD.target, "  ＡＢＣ ", true), {
    wordId: WORD.id,
    answer: "abc",
    approved: true,
  });
});

test("収録語に無いIDは記録しない", () => {
  assert.equal(toAiVerdictRecord("no-such-word:noun", WORD.target, "訳", true), null);
  assert.equal(toAiVerdictRecord(undefined, WORD.target, "訳", true), null);
});

test("target が収録語と食い違う（偽装された）リクエストは記録しない", () => {
  assert.equal(toAiVerdictRecord(WORD.id, "something-else", "訳", true), null);
});

test("空の回答は記録しない", () => {
  assert.equal(toAiVerdictRecord(WORD.id, WORD.target, "   ", false), null);
});
