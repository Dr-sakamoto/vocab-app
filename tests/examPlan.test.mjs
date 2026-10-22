import assert from "node:assert/strict";
import test from "node:test";

import { buildExamPlan, getPacePerDay, normalizeExamDate } from "../lib/examPlan.js";

test("試験日までの残り日数と、1日に要る語数", () => {
  const plan = buildExamPlan({
    examDate: "2026-11-01",
    todayKey: "2026-10-22",
    retained: 400,
    totalWords: 1000,
    pacePerDay: 0,
  });
  assert.equal(plan.daysLeft, 10);
  assert.equal(plan.remaining, 600);
  assert.equal(plan.requiredPerDay, 60);
  assert.equal(plan.projectedDate, null);
  assert.equal(plan.onTrack, false);
});

test("今のペースでの到達日と、間に合うか", () => {
  const base = { examDate: "2026-11-01", todayKey: "2026-10-22", retained: 900, totalWords: 1000 };
  const fast = buildExamPlan({ ...base, pacePerDay: 20 });
  assert.equal(fast.projectedDate, "2026-10-27");
  assert.equal(fast.onTrack, true);
  const slow = buildExamPlan({ ...base, pacePerDay: 3 });
  assert.equal(slow.projectedDate, "2026-11-25");
  assert.equal(slow.onTrack, false);
});

test("試験日を過ぎたら必要ペースは出さない", () => {
  const plan = buildExamPlan({
    examDate: "2026-10-01",
    todayKey: "2026-10-22",
    retained: 1,
    totalWords: 10,
    pacePerDay: 1,
  });
  assert.equal(plan.daysLeft, -21);
  assert.equal(plan.requiredPerDay, null);
});

test("全語定着済みなら今日が到達日", () => {
  const plan = buildExamPlan({
    examDate: "2026-11-01",
    todayKey: "2026-10-22",
    retained: 10,
    totalWords: 10,
    pacePerDay: 0,
  });
  assert.equal(plan.remaining, 0);
  assert.equal(plan.projectedDate, "2026-10-22");
  assert.equal(plan.onTrack, true);
});

test("直近のペースは期間の正味の伸びを日数で割る", () => {
  const points = [
    { date: "2026-10-20", total: 10, gain: 0 },
    { date: "2026-10-21", total: 14, gain: 4 },
    { date: "2026-10-22", total: 16, gain: 2 },
  ];
  assert.equal(getPacePerDay(points), 3);
  assert.equal(getPacePerDay(points.slice(0, 1)), 0);
});

test("試験日の保存値を正規化する", () => {
  assert.equal(normalizeExamDate("2026-11-01"), "2026-11-01");
  assert.equal(normalizeExamDate("11/01"), null);
  assert.equal(normalizeExamDate(null), null);
});
