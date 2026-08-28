import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSyncBase,
  hydrateStats,
  mergeRemoteWordStats,
  readSyncBase,
} from "../lib/wordProgress.js";
import { VOCAB_IDS, VOCAB_ITEMS } from "../lib/vocab/index.js";
import { LEGACY_WORD_ID_ORDER } from "../lib/vocab/legacyWordIds.js";
import { buildWordStatsRows } from "../lib/sync.js";

const USER = "user-1";
const WORD = VOCAB_IDS[4];

/** 指定の語だけ統計を持つローカル配列を作る */
function localWith(stat, at = 4) {
  const stats = hydrateStats(VOCAB_ITEMS, new Map());
  stats[at] = stat;
  return stats;
}

/** `{ userId, words }` 形式の保存済み基準点を作る */
function storedBase(correct, wrong, userId = USER) {
  return { userId, words: { [WORD]: [correct, wrong] } };
}

function mergeOnce({ base, local, remote }) {
  return mergeRemoteWordStats(
    VOCAB_IDS,
    localWith(local),
    [{ word_id: WORD, correct: remote.correct, wrong: remote.wrong }],
    readSyncBase(base, USER),
  )[4];
}

// ── 並行して解いたぶんの合流 ────────────────────────────────────────────────

test("counts from two devices are both kept instead of one being rounded away", () => {
  // 前回の同期時点は (3,1)。そこから端末A（ローカル）が2回、端末B
  // （リモート）が1回正解している。max では 5 に丸められ、端末Bの1回が消える。
  const merged = mergeOnce({
    base: storedBase(3, 1),
    local: { correct: 5, wrong: 1 },
    remote: { correct: 4, wrong: 1 },
  });

  assert.deepEqual(merged, { correct: 6, wrong: 1 });
});

test("wrong counts add up the same way, so weakness survives a second device", () => {
  // 苦手度は wrong / (correct + 1)。誤答が片方の端末ぶん消えると、
  // 実際より得意な語として扱われて出題が引いてしまう。
  const merged = mergeOnce({
    base: storedBase(2, 2),
    local: { correct: 2, wrong: 4 },
    remote: { correct: 2, wrong: 5 },
  });

  assert.deepEqual(merged, { correct: 2, wrong: 7 });
});

test("a device that did not move contributes nothing (no inflation)", () => {
  const merged = mergeOnce({
    base: storedBase(3, 1),
    local: { correct: 3, wrong: 1 },
    remote: { correct: 7, wrong: 2 },
  });

  assert.deepEqual(merged, { correct: 7, wrong: 2 });
});

test("syncing twice without answering anything does not double count", () => {
  // 同期は毎回「ダウンロード→マージ→アップロード」を全量でまわす。
  // 基準点を見ずに加算すると、同じ解答が同期のたびに増えていく。
  const merged = mergeOnce({
    base: storedBase(5, 2),
    local: { correct: 5, wrong: 2 },
    remote: { correct: 5, wrong: 2 },
  });

  assert.deepEqual(merged, { correct: 5, wrong: 2 });
});

test("repeated merges converge instead of drifting upward", () => {
  // 1回目の結果をそのまま基準点にして、もう一度同じリモートと合流させる。
  const first = mergeOnce({
    base: storedBase(3, 1),
    local: { correct: 5, wrong: 1 },
    remote: { correct: 4, wrong: 1 },
  });
  const second = mergeOnce({
    base: storedBase(first.correct, first.wrong),
    local: first,
    remote: { correct: first.correct, wrong: first.wrong },
  });

  assert.deepEqual(second, first);
});

// ── 基準点を持たない語（導入前のデータ・初回同期）────────────────────────────

test("without a base the merge stays on the previous max behavior", () => {
  const merged = mergeOnce({
    base: null,
    local: { correct: 5, wrong: 1 },
    remote: { correct: 4, wrong: 3 },
  });

  assert.deepEqual(merged, { correct: 5, wrong: 3 });
});

test("a word missing from the base falls back to max on its own", () => {
  const merged = mergeOnce({
    base: { userId: USER, words: { [VOCAB_IDS[9]]: [1, 1] } },
    local: { correct: 5, wrong: 1 },
    remote: { correct: 4, wrong: 3 },
  });

  assert.deepEqual(merged, { correct: 5, wrong: 3 });
});

// ── 壊れた基準点で進捗を巻き戻さないこと ────────────────────────────────────

test("a remote row reset to zero does not drag the local counts down", () => {
  const merged = mergeOnce({
    base: storedBase(5, 2),
    local: { correct: 5, wrong: 2 },
    remote: { correct: 0, wrong: 0 },
  });

  assert.deepEqual(merged, { correct: 5, wrong: 2 });
});

test("local storage restored from an older backup keeps the remote counts", () => {
  const merged = mergeOnce({
    base: storedBase(5, 2),
    local: { correct: 1, wrong: 0 },
    remote: { correct: 5, wrong: 2 },
  });

  assert.deepEqual(merged, { correct: 5, wrong: 2 });
});

test("a word with no remote row at all is left untouched", () => {
  // 行が無いのは「0回」ではなく「まだ載っていない」。ここで基準点からの
  // 増分を計算すると、ページングの都合で欠けた行が進捗を削ってしまう。
  const merged = mergeRemoteWordStats(
    VOCAB_IDS,
    localWith({ correct: 5, wrong: 2 }),
    [],
    readSyncBase(storedBase(5, 2), USER),
  )[4];

  assert.deepEqual(merged, { correct: 5, wrong: 2 });
});

// ── 復習状態は従来どおり組で扱うこと ────────────────────────────────────────

test("review state still travels as a pair while counts add up", () => {
  const older = Date.UTC(2026, 0, 10);
  const newer = Date.UTC(2026, 0, 20);
  const merged = mergeRemoteWordStats(
    VOCAB_IDS,
    localWith({ correct: 5, wrong: 1, lastAnswered: newer, correctStreak: 2 }),
    [
      {
        word_id: WORD,
        correct: 4,
        wrong: 1,
        last_answered: new Date(older).toISOString(),
        correct_streak: 7,
      },
    ],
    readSyncBase(storedBase(3, 1), USER),
  )[4];

  assert.deepEqual(merged, {
    correct: 6,
    wrong: 1,
    lastAnswered: newer,
    correctStreak: 2,
  });
});

// ── 基準点の読み書き ────────────────────────────────────────────────────────

test("a base written by another account is discarded", () => {
  // 共用端末でログインし直したとき、別人の回数を起点に増分を数えると
  // 相手の進捗がまるごと自分の統計に流れ込む。
  assert.equal(readSyncBase(storedBase(3, 1, "someone-else"), USER).size, 0);
});

test("a missing or broken base reads as empty rather than throwing", () => {
  for (const raw of [null, undefined, "nope", 42, [], { userId: USER }]) {
    assert.equal(readSyncBase(raw, USER).size, 0);
  }
});

test("junk entries are skipped without poisoning the rest of the base", () => {
  const base = readSyncBase(
    {
      userId: USER,
      words: {
        [WORD]: [3, 1],
        [VOCAB_IDS[9]]: "not-a-pair",
        "deleted-word:noun": [9, 9],
        [VOCAB_IDS[10]]: [-5, "x"],
      },
    },
    USER,
  );

  assert.deepEqual(base.get(WORD), { correct: 3, wrong: 1 });
  assert.equal(base.has(VOCAB_IDS[9]), false);
  assert.deepEqual(base.get(VOCAB_IDS[10]), { correct: 0, wrong: 0 });
});

test("legacy w-ids in a stored base resolve to stable ids", () => {
  const base = readSyncBase({ userId: USER, words: { w1: [4, 2] } }, USER);
  assert.deepEqual(base.get(LEGACY_WORD_ID_ORDER[1]), { correct: 4, wrong: 2 });
});

test("the base holds exactly what was uploaded, and nothing untouched", () => {
  const stats = localWith({ correct: 3, wrong: 1 });
  const base = buildSyncBase(USER, VOCAB_IDS, stats);
  const rows = buildWordStatsRows(USER, stats);

  assert.equal(base.userId, USER);
  assert.deepEqual(Object.keys(base.words), rows.map((row) => row.word_id));
  assert.deepEqual(base.words[WORD], [3, 1]);
});

test("a freshly written base round-trips into the reader", () => {
  const stats = localWith({ correct: 3, wrong: 1 });
  const base = readSyncBase(buildSyncBase(USER, VOCAB_IDS, stats), USER);

  assert.deepEqual(base.get(WORD), { correct: 3, wrong: 1 });
  assert.equal(base.size, 1);
});
