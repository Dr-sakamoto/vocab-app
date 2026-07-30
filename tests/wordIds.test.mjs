import assert from "node:assert/strict";
import test from "node:test";

import {
  QUESTIONS,
  VOCAB_IDS,
  VOCAB_ITEMS,
  resolveWordId,
  toWordId,
  wordIndexOf,
} from "../lib/vocab/index.js";
import { LEGACY_WORD_ID_ORDER } from "../lib/vocab/legacyWordIds.js";
import {
  buildStatsMapFromStoredProgress,
  hydrateStats,
  mergeRemoteWordStats,
  migrateApprovedAnswers,
} from "../lib/wordProgress.js";

// ── ID生成規則 ──────────────────────────────────────────────────────────────

test("word ids are derived from target and part of speech, not array position", () => {
  assert.equal(toWordId("severe", "adjective"), "severe:adjective");
  assert.equal(toWordId("take a break", "phrase"), "take-a-break:phrase");
  assert.equal(toWordId("Well-Known", "noun/verb"), "well-known:noun-verb");
});

test("every word in the vocabulary has a unique id", () => {
  const seen = new Map();
  const collisions = [];
  VOCAB_ITEMS.forEach((item, i) => {
    if (seen.has(item.id)) {
      collisions.push(`${item.id}: #${seen.get(item.id)} と #${i}`);
    } else {
      seen.set(item.id, i);
    }
  });
  assert.deepEqual(collisions, [], `IDが衝突している: ${collisions.join(", ")}`);
  assert.equal(seen.size, QUESTIONS.length);
});

test("same target with different parts of speech does not collide", () => {
  for (const target of ["digest", "retreat", "hug", "sneeze"]) {
    const items = VOCAB_ITEMS.filter((v) => v.target === target);
    assert.equal(items.length, 2, `${target} は品詞違いで2件あるはず`);
    assert.notEqual(items[0].id, items[1].id);
    assert.ok(items.every((v) => v.id.startsWith(`${target}:`)));
  }
});

// ── 配列順の変更に耐えること ────────────────────────────────────────────────

/** 途中に1語追加した語彙配列を作る */
function withInsertedWord(items, at) {
  const inserted = {
    id: toWordId("newlyadded", "noun"),
    target: "newlyadded",
    partOfSpeech: "noun",
    answers: ["新出単語"],
  };
  return [...items.slice(0, at), inserted, ...items.slice(at)];
}

test("inserting a word mid-array keeps existing stats on the right words", () => {
  // 3語だけ進捗があるユーザーの localStorage 相当
  const touched = [3, 100, 2000];
  const stored = touched.map((i, n) => ({
    id: VOCAB_IDS[i],
    target: VOCAB_ITEMS[i].target,
    correct: n + 1,
    wrong: n,
  }));

  const reordered = withInsertedWord(VOCAB_ITEMS, 50);
  const stats = hydrateStats(reordered, buildStatsMapFromStoredProgress(stored, reordered));

  touched.forEach((i, n) => {
    const at = reordered.findIndex((v) => v.id === VOCAB_IDS[i]);
    assert.equal(stats[at].correct, n + 1, `${VOCAB_ITEMS[i].target} の正解数`);
    assert.equal(stats[at].wrong, n, `${VOCAB_ITEMS[i].target} の不正解数`);
  });

  // 挿入された新語は未挑戦のまま
  assert.deepEqual(stats[50], { correct: 0, wrong: 0 });
  // 進捗のない語に統計が漏れていない
  assert.equal(
    stats.filter((s) => s.correct > 0 || s.wrong > 0).length,
    touched.length,
  );
});

test("remote stats survive a mid-array insertion too", () => {
  const remote = [
    { word_id: VOCAB_IDS[7], correct: 5, wrong: 2 },
    { word_id: VOCAB_IDS[900], correct: 1, wrong: 4 },
  ];

  const reordered = withInsertedWord(VOCAB_ITEMS, 5);
  const ids = reordered.map((v) => v.id);
  const merged = mergeRemoteWordStats(ids, [], remote);

  assert.deepEqual(merged[ids.indexOf(VOCAB_IDS[7])], { correct: 5, wrong: 2 });
  assert.deepEqual(merged[ids.indexOf(VOCAB_IDS[900])], { correct: 1, wrong: 4 });
});

// ── 旧 `w${i}` 形式からの移行 ───────────────────────────────────────────────

test("legacy snapshot covers the vocabulary as it was, without duplicates", () => {
  assert.equal(new Set(LEGACY_WORD_ID_ORDER).size, LEGACY_WORD_ID_ORDER.length);
  // スナップショットの各IDは（現行の語彙に残っている限り）そのまま安定IDとして通る
  for (const id of LEGACY_WORD_ID_ORDER) {
    if (wordIndexOf(id) !== null) assert.equal(resolveWordId(id), id);
  }
});

test("legacy w-ids resolve through the frozen snapshot", () => {
  assert.equal(resolveWordId("w0"), LEGACY_WORD_ID_ORDER[0]);
  assert.equal(resolveWordId("w123"), LEGACY_WORD_ID_ORDER[123]);
  assert.equal(resolveWordId(`w${LEGACY_WORD_ID_ORDER.length - 1}`), LEGACY_WORD_ID_ORDER.at(-1));
});

test("unknown ids resolve to null instead of pointing at a random word", () => {
  assert.equal(resolveWordId(`w${LEGACY_WORD_ID_ORDER.length + 10}`), null);
  assert.equal(resolveWordId("w-1"), null);
  assert.equal(resolveWordId("wx"), null);
  assert.equal(resolveWordId("deleted-word:noun"), null);
});

test("migrates legacy localStorage records to stable ids", () => {
  const stored = [
    { id: "w0", target: VOCAB_ITEMS[0].target, correct: 4, wrong: 1 },
    { id: "w5", target: VOCAB_ITEMS[5].target, correct: 0, wrong: 3 },
  ];

  const map = buildStatsMapFromStoredProgress(stored);
  assert.deepEqual(map.get(LEGACY_WORD_ID_ORDER[0]), { correct: 4, wrong: 1 });
  assert.deepEqual(map.get(LEGACY_WORD_ID_ORDER[5]), { correct: 0, wrong: 3 });

  const stats = hydrateStats(VOCAB_ITEMS, map);
  assert.deepEqual(stats[wordIndexOf(LEGACY_WORD_ID_ORDER[0])], { correct: 4, wrong: 1 });
  assert.deepEqual(stats[wordIndexOf(LEGACY_WORD_ID_ORDER[5])], { correct: 0, wrong: 3 });
});

test("legacy records land on the right word even after a reorder", () => {
  const stored = [{ id: "w10", correct: 7, wrong: 2 }];
  const expectedId = LEGACY_WORD_ID_ORDER[10];

  const reordered = withInsertedWord(VOCAB_ITEMS, 3);
  const stats = hydrateStats(reordered, buildStatsMapFromStoredProgress(stored, reordered));

  const at = reordered.findIndex((v) => v.id === expectedId);
  assert.deepEqual(stats[at], { correct: 7, wrong: 2 });
  assert.equal(stats.filter((s) => s.correct > 0 || s.wrong > 0).length, 1);
});

test("legacy and migrated records for the same word merge instead of overwriting", () => {
  const stored = [
    { id: "w0", correct: 4, wrong: 5 },
    { id: LEGACY_WORD_ID_ORDER[0], correct: 6, wrong: 1 },
  ];
  const map = buildStatsMapFromStoredProgress(stored);
  assert.equal(map.size, 1);
  assert.deepEqual(map.get(LEGACY_WORD_ID_ORDER[0]), { correct: 6, wrong: 5 });
});

test("records without an id still fall back to target matching", () => {
  const stored = [{ target: VOCAB_ITEMS[2].target, correct: 2, wrong: 0 }];
  const map = buildStatsMapFromStoredProgress(stored);
  assert.deepEqual(map.get(VOCAB_IDS[2]), { correct: 2, wrong: 0 });
});

test("broken records are ignored rather than corrupting other words", () => {
  const stored = [
    null,
    "nope",
    { id: "w0", correct: "abc", wrong: -3 },
    { id: "unknown-word:noun", correct: 9, wrong: 9 },
  ];
  const map = buildStatsMapFromStoredProgress(stored);
  assert.equal(map.size, 1);
  assert.deepEqual(map.get(LEGACY_WORD_ID_ORDER[0]), { correct: 0, wrong: 0 });
});

test("legacy remote rows migrate on download and merge with local progress", () => {
  const local = hydrateStats(VOCAB_ITEMS, new Map());
  local[wordIndexOf(LEGACY_WORD_ID_ORDER[1])] = { correct: 1, wrong: 9 };

  const merged = mergeRemoteWordStats(VOCAB_IDS, local, [
    { word_id: "w1", correct: 8, wrong: 2 },
    { word_id: "w2", correct: 3, wrong: 0 },
  ]);

  // ローカルとリモートの大きい方が残る
  assert.deepEqual(merged[wordIndexOf(LEGACY_WORD_ID_ORDER[1])], { correct: 8, wrong: 9 });
  assert.deepEqual(merged[wordIndexOf(LEGACY_WORD_ID_ORDER[2])], { correct: 3, wrong: 0 });
});

test("legacy and stable remote rows for the same word do not cancel each other", () => {
  const merged = mergeRemoteWordStats(VOCAB_IDS, [], [
    { word_id: "w3", correct: 2, wrong: 7 },
    { word_id: LEGACY_WORD_ID_ORDER[3], correct: 5, wrong: 1 },
  ]);
  assert.deepEqual(merged[wordIndexOf(LEGACY_WORD_ID_ORDER[3])], { correct: 5, wrong: 7 });
});

test("approved answers keyed by legacy ids are migrated", () => {
  const migrated = migrateApprovedAnswers({
    w0: ["きびしい"],
    [LEGACY_WORD_ID_ORDER[0]]: ["厳しい", "きびしい"],
    w999999: ["消えた単語"],
    broken: "not-an-array",
  });

  assert.deepEqual(Object.keys(migrated), [LEGACY_WORD_ID_ORDER[0]]);
  assert.deepEqual(migrated[LEGACY_WORD_ID_ORDER[0]], ["きびしい", "厳しい"]);
});

test("approved answers migration tolerates junk input", () => {
  assert.deepEqual(migrateApprovedAnswers(null), {});
  assert.deepEqual(migrateApprovedAnswers([1, 2]), {});
  assert.deepEqual(migrateApprovedAnswers("x"), {});
});
