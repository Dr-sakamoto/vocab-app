import assert from "node:assert/strict";
import test from "node:test";

import { COLLOCATIONS } from "../lib/vocab/collocations.js";
import { CONTEXT_PHRASES } from "../lib/vocab/contextPhrases.js";
import { VOCAB_ITEMS, wordIndexOf } from "../lib/vocab/index.js";
import { getPromptPhrase } from "../lib/vocab/phrase.js";

test("連語のキーはすべて収録語の安定ID", () => {
  const unknown = Object.keys(CONTEXT_PHRASES).filter((id) => wordIndexOf(id) === null);
  assert.deepEqual(unknown, []);
});

test("句動詞の目的語と同じ語には付けない（どちらを出すか曖昧になる）", () => {
  const both = Object.keys(CONTEXT_PHRASES).filter((id) => COLLOCATIONS[id]);
  assert.deepEqual(both, []);
});

test("連語は4語以内の英字と空白だけ", () => {
  for (const [id, phrase] of Object.entries(CONTEXT_PHRASES)) {
    assert.match(phrase, /^[A-Za-z][A-Za-z' ]*[A-Za-z]$/, `${id}: "${phrase}"`);
    assert.ok(phrase.split(/\s+/).length <= 4, `${id}: 語数が多すぎる`);
  }
});

test("収録語に連語が載り、表示・採点用の句はそこから引ける", () => {
  const novel = VOCAB_ITEMS.find((item) => item.id === "novel:adjective");
  assert.equal(novel.context, "approach");
  assert.equal(novel.collocation, undefined);
  assert.equal(getPromptPhrase(novel), "approach");
});

test("句動詞の目的語があればそちらを優先する", () => {
  assert.equal(getPromptPhrase({ collocation: "nutrients", context: "x" }), "nutrients");
  assert.equal(getPromptPhrase({}), undefined);
});
