import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_SET_DURATION_MS,
  clampSetDuration,
  formatDayTime,
  formatSetDuration,
  getTodayTime,
  normalizeDailyTime,
  recordStudyTime,
} from "../lib/studyTime.js";

test("セットの所要時間を今日の学習時間に積む", () => {
  let map = recordStudyTime({}, "2026-10-21", 90_000);
  map = recordStudyTime(map, "2026-10-21", 30_000);
  assert.equal(getTodayTime(map, "2026-10-21"), 120_000);
  assert.equal(getTodayTime(map, "2026-10-22"), 0);
});

test("席を立ったセットは上限までしか数えない", () => {
  assert.equal(clampSetDuration(60 * 60_000), MAX_SET_DURATION_MS);
  assert.equal(clampSetDuration(-5), 0);
  assert.equal(clampSetDuration(Number.NaN), 0);
});

test("古い記録は切り捨て、不正な値は捨てる", () => {
  const map = recordStudyTime({ "2026-09-01": 5, bad: 3 }, "2026-10-21", 1000);
  assert.deepEqual(Object.keys(map), ["2026-10-21"]);
  assert.deepEqual(normalizeDailyTime({ "2026-10-21": -1 }), {});
});

test("表示の書式", () => {
  assert.equal(formatSetDuration(102_000), "1分42秒");
  assert.equal(formatSetDuration(65_000), "1分05秒");
  assert.equal(formatSetDuration(42_400), "42秒");
  assert.equal(formatDayTime(12 * 60_000 + 5000), "12分");
  assert.equal(formatDayTime(30_000), "1分未満");
});
