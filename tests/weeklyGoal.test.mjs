import assert from "node:assert/strict";
import test from "node:test";

import { EMPTY_STREAK, mergeStreaks, normalizeStreak, recordPlay } from "../lib/streak.js";
import {
  collectPlayedDates,
  getWeeklyGoalStatus,
  weekStartKey,
} from "../lib/weeklyGoal.js";

// 2026-10-19 は月曜日
const week = (start, days) =>
  days.map((offset) => {
    const d = new Date(start + "T00:00:00");
    d.setDate(d.getDate() + offset);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

test("weekStartKey returns the Monday of the week", () => {
  assert.equal(weekStartKey("2026-10-19"), "2026-10-19"); // 月
  assert.equal(weekStartKey("2026-10-21"), "2026-10-19"); // 水
  assert.equal(weekStartKey("2026-10-25"), "2026-10-19"); // 日
  assert.equal(weekStartKey("2026-11-01"), "2026-10-26"); // 月をまたぐ
});

test("counts the days played this week", () => {
  const status = getWeeklyGoalStatus(week("2026-10-19", [0, 2]), "2026-10-21", 5);
  assert.equal(status.daysThisWeek, 2);
  assert.equal(status.achievedThisWeek, false);
  assert.equal(status.weekStreak, 0);
});

test("resting two days a week keeps the weekly streak", () => {
  const played = [
    ...week("2026-10-05", [0, 1, 2, 3, 4]), // 土日休み
    ...week("2026-10-12", [0, 2, 3, 5, 6]), // 火・金休み
    ...week("2026-10-19", [0]),
  ];
  const status = getWeeklyGoalStatus(played, "2026-10-20", 5);
  // 今週は未達だが、週が終わるまでは途切れていない
  assert.equal(status.weekStreak, 2);
  assert.equal(status.achievedThisWeek, false);
});

test("this week counts once the goal is reached", () => {
  const played = [...week("2026-10-12", [0, 1, 2, 3, 4]), ...week("2026-10-19", [0, 1, 2, 3, 4])];
  const status = getWeeklyGoalStatus(played, "2026-10-23", 5);
  assert.equal(status.achievedThisWeek, true);
  assert.equal(status.weekStreak, 2);
});

test("a missed week breaks the weekly streak", () => {
  const played = [
    ...week("2026-10-05", [0, 1, 2, 3, 4]),
    ...week("2026-10-12", [0, 1]), // 未達
    ...week("2026-10-19", [0, 1, 2, 3, 4]),
  ];
  assert.equal(getWeeklyGoalStatus(played, "2026-10-25", 5).weekStreak, 1);
});

test("future dates from clock skew are ignored", () => {
  const status = getWeeklyGoalStatus(["2026-10-19", "2026-10-24"], "2026-10-20", 5);
  assert.equal(status.daysThisWeek, 1);
});

test("collectPlayedDates backfills from the current streak and extra dates", () => {
  const dates = collectPlayedDates(
    { current: 3, longest: 3, lastPlayedDate: "2026-10-20" },
    ["2026-10-14", "2026-10-20"],
  );
  assert.deepEqual(dates, ["2026-10-14", "2026-10-18", "2026-10-19", "2026-10-20"]);
});

test("recordPlay records played dates without duplicates", () => {
  let s = recordPlay(EMPTY_STREAK, "2026-10-19");
  s = recordPlay(s, "2026-10-19");
  s = recordPlay(s, "2026-10-21");
  assert.deepEqual(s.playedDates, ["2026-10-19", "2026-10-21"]);
  assert.equal(s.current, 1); // 毎日ストリーク自体の挙動は従来どおり
});

test("mergeStreaks unions played dates across devices", () => {
  const pc = { current: 1, longest: 1, lastPlayedDate: "2026-10-19", playedDates: ["2026-10-19"] };
  const phone = {
    current: 1,
    longest: 1,
    lastPlayedDate: "2026-10-21",
    playedDates: ["2026-10-17", "2026-10-21"],
  };
  assert.deepEqual(mergeStreaks(pc, phone).playedDates, ["2026-10-17", "2026-10-19", "2026-10-21"]);
});

test("normalizeStreak drops junk and old played dates", () => {
  const s = normalizeStreak({
    current: 1,
    longest: 1,
    lastPlayedDate: "2026-10-20",
    playedDates: ["2026-10-20", "bad", 3, "2024-01-01", "2026-10-20"],
  });
  assert.deepEqual(s.playedDates, ["2026-10-20"]);
});
