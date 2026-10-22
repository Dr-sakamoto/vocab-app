import assert from "node:assert/strict";
import test from "node:test";

import { CONFUSABLES } from "../lib/vocab/confusables.js";
import { VOCAB_ITEMS, getConfusable, wordIndexOf } from "../lib/vocab/index.js";

test("紛らわしい語のキーはすべて収録語の安定ID", () => {
  for (const id of Object.keys(CONFUSABLES)) {
    assert.notEqual(wordIndexOf(id), null, `${id} は収録語に無い`);
  }
});

test("相手の語は自分自身ではなく、訳と関係が埋まっている", () => {
  for (const [id, c] of Object.entries(CONFUSABLES)) {
    const { target } = VOCAB_ITEMS[wordIndexOf(id)];
    assert.notEqual(c.word, target, `${id} が自分自身を指している`);
    assert.ok(c.meaning.trim().length > 0, `${id} の訳が空`);
    assert.ok(["form", "meaning", "opposite"].includes(c.relation), `${id} の関係が不正`);
  }
});

test("相手が収録語なら逆向きも引ける", () => {
  assert.equal(getConfusable("evaluate:verb")?.word, "evacuate");
  const reverse = getConfusable("evacuate:verb");
  assert.equal(reverse?.word, "evaluate");
  assert.equal(reverse?.relation, "form");
});

test("記載の無い語は null", () => {
  assert.equal(getConfusable("no-such-word:noun"), null);
});
