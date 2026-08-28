import assert from "node:assert/strict";
import test from "node:test";

import { getSoundVolume, setSoundVolume } from "../lib/clickSound.js";

test("sound volume defaults to 0.7", () => {
  assert.equal(getSoundVolume(), 0.7);
});

test("setSoundVolume updates the value read back by getSoundVolume", () => {
  setSoundVolume(0.3);
  assert.equal(getSoundVolume(), 0.3);
  setSoundVolume(1);
  assert.equal(getSoundVolume(), 1);
});

test("setSoundVolume clamps out-of-range values to [0, 1]", () => {
  setSoundVolume(-1);
  assert.equal(getSoundVolume(), 0);
  setSoundVolume(2);
  assert.equal(getSoundVolume(), 1);
  setSoundVolume(0.7);
});
