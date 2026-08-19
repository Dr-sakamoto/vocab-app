import assert from "node:assert/strict";
import test from "node:test";

import {
  canSpeak,
  isPronunciationEnabled,
  setPronunciationEnabled,
  speakEnglishWord,
  stopSpeaking,
} from "../lib/speech.js";

test("canSpeak returns false outside the browser (no window)", () => {
  assert.equal(canSpeak(), false);
});

test("speakEnglishWord no-ops safely when speechSynthesis is unavailable", () => {
  assert.equal(speakEnglishWord("apple"), false);
});

test("speakEnglishWord no-ops safely for blank input", () => {
  assert.equal(speakEnglishWord("   "), false);
});

test("pronunciation is enabled by default", () => {
  assert.equal(isPronunciationEnabled(), true);
});

test("setPronunciationEnabled toggles the flag read back by isPronunciationEnabled", () => {
  setPronunciationEnabled(false);
  assert.equal(isPronunciationEnabled(), false);
  setPronunciationEnabled(true);
  assert.equal(isPronunciationEnabled(), true);
});

test("speakEnglishWord no-ops when pronunciation is disabled", () => {
  setPronunciationEnabled(false);
  assert.equal(speakEnglishWord("apple"), false);
  setPronunciationEnabled(true);
});

test("stopSpeaking does not throw when speechSynthesis is unavailable", () => {
  assert.doesNotThrow(() => stopSpeaking());
});
