import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_DAILY_PROGRESS,
  getActivityCalendar,
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

// ── 学習カレンダー ───────────────────────────────────────────────────────

test("カレンダーは月曜始まりの週ごとに並び、今日より後のマスは空ける", () => {
  // 2026-10-21 は水曜
  const weeks = getActivityCalendar({}, "2026-10-21", 2);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0][0].date, "2026-10-12"); // 前の週の月曜
  assert.equal(weeks[1][0].date, "2026-10-19"); // 今週の月曜
  assert.equal(weeks[1][2].date, "2026-10-21"); // 今日（水）
  assert.equal(weeks[1][3].date, null); // 木曜以降はまだ来ていない
  assert.equal(weeks[1][6].date, null);
});

test("記録のある日が学習した日で、伸びは前日比", () => {
  const map = { "2026-10-19": 10, "2026-10-21": 15 };
  const [week] = getActivityCalendar(map, "2026-10-21", 1);
  assert.deepEqual(
    week.slice(0, 3).map(({ played, gain }) => [played, gain]),
    [
      [true, 10],
      [false, 0],
      [true, 5],
    ],
  );
});

test("日曜が今日なら最終週は7マスすべて埋まる", () => {
  const [week] = getActivityCalendar({}, "2026-10-25", 1);
  assert.equal(week[6].date, "2026-10-25");
  assert.equal(week.every((day) => day.date !== null), true);
});
