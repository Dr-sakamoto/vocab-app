import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_DAILY_PROGRESS,
  getDailyGains,
  mergeDailyProgress,
  normalizeDailyProgress,
  recordDailyProgress,
} from "../lib/dailyProgress.js";

test("recordDailyProgress records today's mastered count", () => {
  const next = recordDailyProgress(EMPTY_DAILY_PROGRESS, "2026-07-07", 12);
  assert.deepEqual(next, { "2026-07-07": 12 });
});

test("recordDailyProgress overwrites the same day instead of accumulating", () => {
  let m = recordDailyProgress(EMPTY_DAILY_PROGRESS, "2026-07-07", 12);
  m = recordDailyProgress(m, "2026-07-07", 15);
  assert.deepEqual(m, { "2026-07-07": 15 });
});

test("recordDailyProgress returns the same reference when the value is unchanged", () => {
  const m = recordDailyProgress(EMPTY_DAILY_PROGRESS, "2026-07-07", 12);
  const again = recordDailyProgress(m, "2026-07-07", 12);
  assert.equal(again, m);
});

test("recordDailyProgress prunes entries older than the retention window", () => {
  let m = recordDailyProgress(EMPTY_DAILY_PROGRESS, "2026-01-01", 1);
  m = recordDailyProgress(m, "2026-04-01", 50); // 3か月近く先
  assert.equal(m["2026-01-01"], undefined);
  assert.equal(m["2026-04-01"], 50);
});

test("normalizeDailyProgress drops invalid keys and values", () => {
  const normalized = normalizeDailyProgress({
    "2026-07-07": 5,
    "not-a-date": 5,
    "2026-07-08": -1,
    "2026-07-09": "abc",
    "2026-07-10": 3.9,
  });
  assert.deepEqual(normalized, { "2026-07-07": 5, "2026-07-10": 3 });
});

test("normalizeDailyProgress tolerates junk input", () => {
  assert.deepEqual(normalizeDailyProgress(null), {});
  assert.deepEqual(normalizeDailyProgress(undefined), {});
  assert.deepEqual(normalizeDailyProgress("nope"), {});
});

test("mergeDailyProgress keeps the larger value per day", () => {
  const a = { "2026-07-07": 10, "2026-07-08": 20 };
  const b = { "2026-07-07": 15, "2026-07-09": 5 };
  const merged = mergeDailyProgress(a, b);
  assert.deepEqual(merged, { "2026-07-07": 15, "2026-07-08": 20, "2026-07-09": 5 });
});

test("mergeDailyProgress with one side empty returns the other side untouched", () => {
  const a = { "2026-07-07": 10 };
  assert.deepEqual(mergeDailyProgress(a, {}), a);
  assert.deepEqual(mergeDailyProgress({}, a), a);
});

test("getDailyGains forward-fills days with no recorded play and gains 0", () => {
  const map = { "2026-07-05": 10, "2026-07-07": 13 };
  const points = getDailyGains(map, "2026-07-07", 3);
  assert.deepEqual(points, [
    { date: "2026-07-05", total: 10, gain: 0 },
    { date: "2026-07-06", total: 10, gain: 0 },
    { date: "2026-07-07", total: 13, gain: 3 },
  ]);
});

test("getDailyGains treats days before any record as 0", () => {
  const points = getDailyGains({ "2026-07-07": 4 }, "2026-07-07", 2);
  assert.deepEqual(points, [
    { date: "2026-07-06", total: 0, gain: 0 },
    { date: "2026-07-07", total: 4, gain: 4 },
  ]);
});

test("getDailyGains reports a negative gain when mastered words drop", () => {
  const map = { "2026-07-06": 10, "2026-07-07": 8 };
  const points = getDailyGains(map, "2026-07-07", 2);
  assert.deepEqual(points[1], { date: "2026-07-07", total: 8, gain: -2 });
});
