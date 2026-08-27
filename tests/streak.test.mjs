import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_STREAK,
  getDisplayStreak,
  hasPlayedToday,
  mergeStreaks,
  normalizeStreak,
  recordPlay,
  toDateKey,
} from "../lib/streak.js";

test("first play starts a 1-day streak", () => {
  const next = recordPlay(EMPTY_STREAK, "2026-07-07");
  assert.equal(next.current, 1);
  assert.equal(next.longest, 1);
  assert.equal(next.lastPlayedDate, "2026-07-07");
});

test("playing again the same day does not double-count", () => {
  const day1 = recordPlay(EMPTY_STREAK, "2026-07-07");
  const again = recordPlay(day1, "2026-07-07");
  assert.equal(again.current, 1);
  assert.deepEqual(again, day1);
});

test("consecutive days increment the streak", () => {
  let s = recordPlay(EMPTY_STREAK, "2026-07-07");
  s = recordPlay(s, "2026-07-08");
  s = recordPlay(s, "2026-07-09");
  assert.equal(s.current, 3);
  assert.equal(s.longest, 3);
});

test("a skipped day resets the current streak but keeps the longest", () => {
  let s = recordPlay(EMPTY_STREAK, "2026-07-07");
  s = recordPlay(s, "2026-07-08");
  s = recordPlay(s, "2026-07-09"); // current 3
  s = recordPlay(s, "2026-07-11"); // 1 日空いた -> リセット
  assert.equal(s.current, 1);
  assert.equal(s.longest, 3);
});

test("streak survives a month boundary", () => {
  let s = recordPlay(EMPTY_STREAK, "2026-07-31");
  s = recordPlay(s, "2026-08-01");
  assert.equal(s.current, 2);
});

test("streak survives a year boundary", () => {
  let s = recordPlay(EMPTY_STREAK, "2026-12-31");
  s = recordPlay(s, "2027-01-01");
  assert.equal(s.current, 2);
});

test("getDisplayStreak shows 0 when the streak has lapsed", () => {
  const s = recordPlay(EMPTY_STREAK, "2026-07-07");
  assert.equal(getDisplayStreak(s, "2026-07-07"), 1); // 当日
  assert.equal(getDisplayStreak(s, "2026-07-08"), 1); // 翌日はまだ継続可能
  assert.equal(getDisplayStreak(s, "2026-07-09"), 0); // 2 日空くと途切れ
});

test("hasPlayedToday reflects the last played date", () => {
  const s = recordPlay(EMPTY_STREAK, "2026-07-07");
  assert.equal(hasPlayedToday(s, "2026-07-07"), true);
  assert.equal(hasPlayedToday(s, "2026-07-08"), false);
});

test("normalizeStreak repairs malformed data", () => {
  assert.deepEqual(normalizeStreak(null), EMPTY_STREAK);
  assert.deepEqual(normalizeStreak({ current: -5, longest: "x" }), EMPTY_STREAK);
  const repaired = normalizeStreak({ current: 4, longest: 2, lastPlayedDate: "2026-07-07" });
  assert.equal(repaired.longest, 4); // longest は current 以上に補正
});

test("toDateKey formats a local date", () => {
  const key = toDateKey(new Date(2026, 6, 7));
  assert.equal(key, "2026-07-07");
});

// ── 端末をまたいだ合流 ──────────────────────────────────────────────────────
test("mergeStreaks keeps the later play date", () => {
  const pc = { current: 3, longest: 5, lastPlayedDate: "2026-08-25" };
  const phone = { current: 1, longest: 2, lastPlayedDate: "2026-08-26" };
  const merged = mergeStreaks(pc, phone);
  assert.equal(merged.lastPlayedDate, "2026-08-26");
});

test("mergeStreaks bridges a streak continued on the other device the next day", () => {
  const pc = { current: 4, longest: 4, lastPlayedDate: "2026-08-25" };
  const phone = { current: 1, longest: 1, lastPlayedDate: "2026-08-26" };
  const merged = mergeStreaks(pc, phone);
  // PCで4日続けた翌日にスマホでプレイ＝5日連続。1日にリセットしない
  assert.equal(merged.current, 5);
  assert.equal(merged.longest, 5);
});

test("mergeStreaks does not bridge across a gap of two days or more", () => {
  const pc = { current: 9, longest: 9, lastPlayedDate: "2026-08-20" };
  const phone = { current: 2, longest: 3, lastPlayedDate: "2026-08-26" };
  const merged = mergeStreaks(pc, phone);
  assert.equal(merged.current, 2);
  assert.equal(merged.longest, 9);
});

test("mergeStreaks takes the bigger count when both played the same day", () => {
  const merged = mergeStreaks(
    { current: 7, longest: 7, lastPlayedDate: "2026-08-26" },
    { current: 2, longest: 4, lastPlayedDate: "2026-08-26" },
  );
  assert.deepEqual(merged, { current: 7, longest: 7, lastPlayedDate: "2026-08-26" });
});

test("mergeStreaks falls back to whichever side has ever been played", () => {
  const played = { current: 3, longest: 3, lastPlayedDate: "2026-08-26" };
  assert.deepEqual(mergeStreaks(EMPTY_STREAK, played), played);
  assert.deepEqual(mergeStreaks(played, EMPTY_STREAK), played);
  assert.deepEqual(mergeStreaks(EMPTY_STREAK, EMPTY_STREAK), EMPTY_STREAK);
});

test("mergeStreaks tolerates junk from the cloud", () => {
  const local = { current: 3, longest: 3, lastPlayedDate: "2026-08-26" };
  assert.deepEqual(mergeStreaks(local, null), local);
  assert.deepEqual(mergeStreaks(local, "nonsense"), local);
  assert.deepEqual(mergeStreaks(local, { current: -1, lastPlayedDate: "not-a-date" }), local);
});
