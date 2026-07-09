import assert from "node:assert/strict";
import test from "node:test";

import { _resetRateLimitState, checkRateLimit } from "../lib/rateLimit.js";

test("allows requests within the limit", () => {
  _resetRateLimitState();
  const opts = { limit: 3, windowMs: 60_000 };
  const now = 0;
  assert.equal(checkRateLimit("a", opts, now).allowed, true);
  assert.equal(checkRateLimit("a", opts, now).allowed, true);
  assert.equal(checkRateLimit("a", opts, now).allowed, true);
});

test("blocks requests once the limit is exceeded within the window", () => {
  _resetRateLimitState();
  const opts = { limit: 2, windowMs: 60_000 };
  const now = 0;
  assert.equal(checkRateLimit("b", opts, now).allowed, true);
  assert.equal(checkRateLimit("b", opts, now).allowed, true);
  const blocked = checkRateLimit("b", opts, now);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterMs, 60_000);
});

test("resets the count after the window elapses", () => {
  _resetRateLimitState();
  const opts = { limit: 1, windowMs: 1_000 };
  assert.equal(checkRateLimit("c", opts, 0).allowed, true);
  assert.equal(checkRateLimit("c", opts, 500).allowed, false);
  assert.equal(checkRateLimit("c", opts, 1_000).allowed, true);
});

test("tracks separate keys independently", () => {
  _resetRateLimitState();
  const opts = { limit: 1, windowMs: 60_000 };
  assert.equal(checkRateLimit("d1", opts, 0).allowed, true);
  assert.equal(checkRateLimit("d2", opts, 0).allowed, true);
  assert.equal(checkRateLimit("d1", opts, 0).allowed, false);
});
