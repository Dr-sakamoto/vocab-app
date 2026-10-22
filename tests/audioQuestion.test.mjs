import assert from "node:assert/strict";
import test from "node:test";

import { pickAudioOnlySlots } from "../lib/audioQuestion.js";
import { AUDIO_ONLY } from "../lib/constants.js";

const always = () => 0;
const never = () => 0.99;

test("定着の浅い語は音だけにしない", () => {
  assert.deepEqual(pickAudioOnlySlots([0, 1, 2], always), [false, false, false]);
});

test("定着が進んだ語は確率に当たれば音だけにする", () => {
  assert.deepEqual(pickAudioOnlySlots([AUDIO_ONLY.MIN_LEVEL, 5], always), [true, true]);
  assert.deepEqual(pickAudioOnlySlots([AUDIO_ONLY.MIN_LEVEL, 5], never), [false, false]);
});

test("1セットあたりの上限を超えない", () => {
  const flags = pickAudioOnlySlots(Array(10).fill(5), always);
  assert.equal(flags.filter(Boolean).length, AUDIO_ONLY.MAX_PER_SET);
});
