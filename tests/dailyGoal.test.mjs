import assert from "node:assert/strict";
import test from "node:test";

import {
  clampDailyGoal,
  getTodaySets,
  normalizeDailySets,
  recordSetCompleted,
} from "../lib/dailyGoal.js";

test("セットを解き終えるたびに今日の数が1つ増える", () => {
  let map = recordSetCompleted({}, "2026-10-21");
  map = recordSetCompleted(map, "2026-10-21");
  assert.equal(getTodaySets(map, "2026-10-21"), 2);
});

test("日付が変われば今日の数は0から数え直す", () => {
  const map = recordSetCompleted({ "2026-10-20": 5 }, "2026-10-21");
  assert.equal(getTodaySets(map, "2026-10-21"), 1);
  assert.equal(map["2026-10-20"], 5);
});

test("古い記録は切り捨てる", () => {
  const map = recordSetCompleted({ "2026-09-01": 3 }, "2026-10-21");
  assert.equal("2026-09-01" in map, false);
});

test("不正な保存値を正規化する", () => {
  assert.deepEqual(normalizeDailySets(null), {});
  assert.deepEqual(normalizeDailySets({ bad: 1, "2026-10-21": -1, "2026-10-20": 2.7 }), {
    "2026-10-20": 2,
  });
});

test("目標セット数は範囲内の整数に丸める", () => {
  assert.equal(clampDailyGoal(0), 1);
  assert.equal(clampDailyGoal(99), 10);
  assert.equal(clampDailyGoal(2.6), 3);
  assert.equal(clampDailyGoal("x"), 3);
});
