import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import {
  DIFFICULTY_ORDERED_INDICES,
  VOCAB_IDS,
  VOCAB_ITEMS,
  wordIndexOf,
} from "../lib/vocab/index.js";
import { DIFFICULTY_ORDER } from "../lib/vocab/difficultyOrder.js";
import { getUnlockedIndices } from "../lib/vocabPool.js";
import { GAME } from "../lib/constants.js";

// ── 序列表の整合性 ──────────────────────────────────────────────────────────

test("difficulty order covers every word exactly once", () => {
  assert.equal(DIFFICULTY_ORDER.length, VOCAB_ITEMS.length);
  assert.equal(new Set(DIFFICULTY_ORDER).size, VOCAB_ITEMS.length);
  for (const id of DIFFICULTY_ORDER) {
    assert.notEqual(wordIndexOf(id), null, `序列表に未知のIDがある: ${id}`);
  }
});

test("ordered indices are a permutation of the vocabulary", () => {
  assert.equal(DIFFICULTY_ORDERED_INDICES.length, VOCAB_ITEMS.length);
  assert.deepEqual(
    [...DIFFICULTY_ORDERED_INDICES].sort((a, b) => a - b),
    VOCAB_ITEMS.map((_, i) => i),
  );
});

// ── 先頭が入門〜初級であること ──────────────────────────────────────────────

/** 生成時の根拠（CEFRレベル・頻度順位）。序列表と対になる監査用データ */
function readAuditRows() {
  const [header, ...lines] = readFileSync(
    new URL("../docs/vocab-difficulty.csv", import.meta.url),
    "utf8",
  )
    .trim()
    .split("\n");
  const columns = header.split(",");
  return lines.map((line) => {
    // target / partOfSpeech だけが引用符付き。カンマを含む語（day in, day out）がある
    const cells = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        cells.push(cur);
        cur = "";
      } else cur += ch;
    }
    cells.push(cur);
    return Object.fromEntries(columns.map((c, i) => [c, cells[i]]));
  });
}

const auditRows = readAuditRows();

test("audit csv matches the shipped order", () => {
  assert.equal(auditRows.length, DIFFICULTY_ORDER.length);
  assert.deepEqual(
    auditRows.map((r) => r.id),
    [...DIFFICULTY_ORDER],
  );
});

test("the first 60 words (the starting pool) are entry level", () => {
  const head = auditRows.slice(0, GAME.INITIAL_POOL_SIZE);
  const offenders = head.filter((r) => !["A1", "A2"].includes(r.cefr));
  assert.deepEqual(
    offenders.map((r) => `${r.target}:${r.cefr || "CEFR未収録"}`),
    [],
    "初期プールはCEFR A1/A2 の語だけで構成されること",
  );
});

test("difficulty rises monotonically across the order", () => {
  const bandAt = (i) => Number(auditRows[i].effectiveBand);
  const meanBand = (from, to) => {
    const slice = auditRows.slice(from, to).map((_, k) => bandAt(from + k));
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  };
  const buckets = [
    meanBand(0, 300),
    meanBand(800, 1100),
    meanBand(1700, 2000),
    meanBand(2600, 2900),
    meanBand(3140, 3440),
  ];
  for (let i = 1; i < buckets.length; i += 1) {
    assert.ok(
      buckets[i] > buckets[i - 1],
      `難易度が単調に上がっていない: ${buckets.map((b) => b.toFixed(2)).join(" → ")}`,
    );
  }
});

test("idiomatic phrases are kept out of the early pool", () => {
  const early = auditRows.slice(0, 300).filter((r) => r.isPhrase === "1");
  assert.deepEqual(early, [], "複合語・イディオムは入門帯に置かない");
});

// ── バンド内の並び順が「出る順」を反映していること ──────────────────────────
//
// 語彙データ（lib/vocab/basic.ts + advanced.ts）の配列順は、収録元
// （英語漬け.com の英検準1級プール）における出題頻度順そのもの。
// この情報を捨てて汎用の字幕コーパス頻度だけで並べ替えると、
// 準1級の頻出語が難易度バンドの奥深くに埋もれてしまう
// （例: alleviate / scrutinize / repercussions のような高頻出語）。
// CEFRバンド（学習段階の主軸）はそのままに、バンド内の順序には
// 出る順を使うことで、この情報を活かす。
test("within a band, single words follow exam order (元データの収録順)", () => {
  const singleWords = auditRows.filter((r) => r.isPhrase !== "1");
  const offenders = [];
  let prevBand = null;
  let prevExamOrder = null;
  for (const r of singleWords) {
    const band = Math.trunc(Number(r.effectiveBand));
    if (band !== prevBand) {
      prevBand = band;
      prevExamOrder = Number(r.examOrder);
      continue;
    }
    if (Number(r.examOrder) < prevExamOrder) {
      offenders.push(
        `${r.target}: band=${band} examOrder=${r.examOrder} が直前の語(${prevExamOrder})より出る順が早い`,
      );
    }
    prevExamOrder = Number(r.examOrder);
  }
  assert.deepEqual(offenders, [], "同一バンド内で出る順が逆転している語がある");
});

// ── 既存ユーザーの解放状況が壊れないこと ────────────────────────────────────

function emptyStats() {
  return VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 }));
}

test("a fresh user gets exactly the N easiest words", () => {
  const pool = getUnlockedIndices(
    DIFFICULTY_ORDERED_INDICES,
    GAME.INITIAL_POOL_SIZE,
    emptyStats(),
  );
  assert.equal(pool.length, GAME.INITIAL_POOL_SIZE);
  assert.deepEqual(
    [...pool].sort((a, b) => a - b),
    [...DIFFICULTY_ORDERED_INDICES.slice(0, GAME.INITIAL_POOL_SIZE)].sort((a, b) => a - b),
  );
});

test("words already studied stay in the pool after the reorder", () => {
  // 旧順（配列順）で1,000語解放していたユーザー。難語も学習中だった。
  const stats = emptyStats();
  const studied = [3, 250, 700, 999];
  for (const i of studied) stats[i] = { correct: 2, wrong: 1 };

  const pool = new Set(getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, 1000, stats));
  for (const i of studied) {
    assert.ok(
      pool.has(i),
      `学習中だった ${VOCAB_ITEMS[i].target} がプールから消えた`,
    );
  }
});

test("a word studied far beyond the unlocked range is still offered", () => {
  const stats = emptyStats();
  // 難易度順で最後尾の語をすでに学習しているケース
  const hardest = DIFFICULTY_ORDERED_INDICES.at(-1);
  stats[hardest] = { correct: 0, wrong: 3 };

  const pool = getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, GAME.INITIAL_POOL_SIZE, stats);
  assert.ok(pool.includes(hardest));
  assert.equal(pool.length, GAME.INITIAL_POOL_SIZE + 1);
});

test("unlockedPoolSize keeps meaning the number of unlocked words", () => {
  // 未挑戦なら「解放語数 = N」が保たれる（Tier倍率の前提を壊さない）
  for (const size of [60, 90, 500, 3440]) {
    assert.equal(
      getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, size, emptyStats()).length,
      size,
    );
  }
});

test("pool never exceeds the vocabulary, even with an oversized N", () => {
  const pool = getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, 99999, emptyStats());
  assert.equal(pool.length, VOCAB_ITEMS.length);
});

test("progress is keyed by index, so stats stay aligned with the words", () => {
  // 序列は出題順を変えるだけで、統計の格納位置（配列添字）は動かさない。
  // 添字と単語IDの対応が変わっていないことを確認する。
  const stats = emptyStats();
  const target = wordIndexOf(VOCAB_IDS[42]);
  stats[target] = { correct: 5, wrong: 0 };

  const pool = getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, 60, stats);
  assert.ok(pool.includes(target));
  assert.equal(VOCAB_ITEMS[target].id, VOCAB_IDS[42]);
});

// ── 語彙を追加したときの頑健性 ──────────────────────────────────────────────

test("words missing from the order table fall back to the end instead of vanishing", () => {
  // 語彙を追加して序列表を再生成し忘れた状況を、同じ組み立て規則で再現する
  const indexById = new Map(VOCAB_IDS.map((id, i) => [id, i]));
  indexById.set("newlyadded:noun", VOCAB_IDS.length);

  const ordered = [];
  const placed = new Set();
  for (const id of DIFFICULTY_ORDER) {
    const index = indexById.get(id);
    if (index === undefined || placed.has(index)) continue;
    placed.add(index);
    ordered.push(index);
  }
  for (let i = 0; i < indexById.size; i += 1) if (!placed.has(i)) ordered.push(i);

  assert.equal(ordered.length, VOCAB_IDS.length + 1);
  assert.equal(ordered.at(-1), VOCAB_IDS.length, "未収録の語は末尾に回る");
  assert.equal(new Set(ordered).size, ordered.length);
});
