import assert from "node:assert/strict";
import test from "node:test";

import { buildWordStatsRows } from "../lib/sync.js";

test("excludes untouched words (correct and wrong both 0)", () => {
  const rows = buildWordStatsRows("user-1", [
    { correct: 0, wrong: 0 },
    { correct: 3, wrong: 1 },
  ]);
  assert.ok(rows.every(row => !(row.correct === 0 && row.wrong === 0)));
});

test("includes words with any progress, even wrong-only", () => {
  const rows = buildWordStatsRows("user-1", [
    { correct: 0, wrong: 2 },
  ]);
  const row = rows.find(r => r.word_id === "w0");
  assert.ok(row);
  assert.equal(row.correct, 0);
  assert.equal(row.wrong, 2);
});

test("tags every row with the given user id and stops at stats length via defaults", () => {
  const rows = buildWordStatsRows("user-42", [{ correct: 1, wrong: 0 }]);
  const row = rows.find(r => r.word_id === "w0");
  assert.equal(row.user_id, "user-42");
});

test("returns an empty array when nothing has been attempted", () => {
  const rows = buildWordStatsRows("user-1", []);
  assert.deepEqual(rows, []);
});
