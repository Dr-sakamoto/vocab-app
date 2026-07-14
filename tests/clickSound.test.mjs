import assert from "node:assert/strict";
import test from "node:test";

import { isSoundEnabled, setSoundEnabled } from "../lib/clickSound.js";

test("sound is enabled by default", () => {
  assert.equal(isSoundEnabled(), true);
});

test("setSoundEnabled toggles the flag read back by isSoundEnabled", () => {
  setSoundEnabled(false);
  assert.equal(isSoundEnabled(), false);
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);
});
