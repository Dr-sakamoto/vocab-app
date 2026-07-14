import assert from "node:assert/strict";
import test from "node:test";

import { canSpeak, speakEnglishWord, stopSpeaking } from "../lib/speech.js";

test("canSpeak returns false outside the browser (no window)", () => {
  assert.equal(canSpeak(), false);
});

test("speakEnglishWord no-ops safely when speechSynthesis is unavailable", () => {
  assert.equal(speakEnglishWord("apple"), false);
});

test("speakEnglishWord no-ops safely for blank input", () => {
  assert.equal(speakEnglishWord("   "), false);
});

test("stopSpeaking does not throw when speechSynthesis is unavailable", () => {
  assert.doesNotThrow(() => stopSpeaking());
});
