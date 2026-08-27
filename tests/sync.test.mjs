import assert from "node:assert/strict";
import test from "node:test";

import { buildWordStatsRows, fetchAllPages, readRemoteMeta } from "../lib/sync.js";
import { VOCAB_IDS } from "../lib/vocab/index.js";

// word_id は `target:品詞` の安定ID（旧 `w${i}` から移行済み）。
// 先頭の単語のIDを語彙側から引いて、ID形式をテストに焼き込まない。
const FIRST_WORD_ID = VOCAB_IDS[0];

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
  const row = rows.find(r => r.word_id === FIRST_WORD_ID);
  assert.ok(row);
  assert.equal(row.correct, 0);
  assert.equal(row.wrong, 2);
});

test("tags every row with the given user id and stops at stats length via defaults", () => {
  const rows = buildWordStatsRows("user-42", [{ correct: 1, wrong: 0 }]);
  const row = rows.find(r => r.word_id === FIRST_WORD_ID);
  assert.equal(row.user_id, "user-42");
});

test("returns an empty array when nothing has been attempted", () => {
  const rows = buildWordStatsRows("user-1", []);
  assert.deepEqual(rows, []);
});

test("fetchAllPages follows pagination past a single page's worth of rows", async () => {
  const makeRow = (i) => ({ word_id: `w${i}`, correct: i, wrong: 0 });
  const allRows = Array.from({ length: 2500 }, (_, i) => makeRow(i));
  const requestedRanges = [];

  const fetchPage = async (from, to) => {
    requestedRanges.push([from, to]);
    return { data: allRows.slice(from, to + 1), error: null };
  };

  const rows = await fetchAllPages(fetchPage, 1000);

  assert.equal(rows.length, 2500);
  assert.deepEqual(rows[0], makeRow(0));
  assert.deepEqual(rows[2499], makeRow(2499));
  assert.deepEqual(requestedRanges, [
    [0, 999],
    [1000, 1999],
    [2000, 2999],
  ]);
});

test("fetchAllPages stops after a single short page", async () => {
  const fetchPage = async () => ({
    data: [{ word_id: "a", correct: 1, wrong: 0 }],
    error: null,
  });

  const rows = await fetchAllPages(fetchPage, 1000);
  assert.equal(rows.length, 1);
});

test("fetchAllPages surfaces an error from any page", async () => {
  const fetchPage = async (from) =>
    from === 0
      ? { data: Array(1000).fill({ word_id: "a", correct: 1, wrong: 0 }), error: null }
      : { data: null, error: { message: "boom" } };

  await assert.rejects(
    () => fetchAllPages(fetchPage, 1000),
    (err) => err.message === "boom",
  );
});

// user_meta は列が増えることがある（approved_answers / rejected_answers）。
// 本番へ列を流し忘れた環境でも、同期全体を巻き込んで落とさないための正規化。
test("readRemoteMeta treats a missing row as untouched meta", () => {
  assert.deepEqual(readRemoteMeta(null), {
    unlockedPoolSize: 0,
    approvedAnswers: undefined,
    rejectedAnswers: undefined,
  });
});

test("readRemoteMeta tolerates a row that predates the newer columns", () => {
  const meta = readRemoteMeta({ unlocked_pool_size: 953, approved_answers: { "a:noun": ["x"] } });
  assert.equal(meta.unlockedPoolSize, 953);
  assert.deepEqual(meta.approvedAnswers, { "a:noun": ["x"] });
  assert.equal(meta.rejectedAnswers, undefined);
});

test("readRemoteMeta ignores a junk pool size instead of poisoning the merge", () => {
  assert.equal(readRemoteMeta({ unlocked_pool_size: null }).unlockedPoolSize, 0);
  assert.equal(readRemoteMeta({ unlocked_pool_size: "abc" }).unlockedPoolSize, 0);
  assert.equal(readRemoteMeta({ unlocked_pool_size: -5 }).unlockedPoolSize, 0);
});
