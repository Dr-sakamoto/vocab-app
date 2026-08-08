import assert from "node:assert/strict";
import test from "node:test";

import { getUnlockedIndices } from "../lib/vocabPool.js";

// 出題プールは「難易度順の上位N語 ∪ 挑戦済みの語」。
// このため解放カウンタ N は「解放済みの語数」ではない。
// 画面に「◯ / 3440 語」と出す数字は必ずこの配列の length を使うこと
// （N をそのまま出すと、ヘッダーとフラッシュ画面の語数が食い違う）。

const ORDER = [0, 1, 2, 3, 4];
const NONE = { correct: 0, wrong: 0 };

function statsWithProgressAt(...indices) {
  const stats = ORDER.map(() => ({ ...NONE }));
  for (const i of indices) stats[i] = { correct: 1, wrong: 0 };
  return stats;
}

test("未挑戦なら解放カウンタと語数が一致する", () => {
  const pool = getUnlockedIndices(ORDER, 3, statsWithProgressAt());
  assert.equal(pool.length, 3);
});

test("上位N語の外で挑戦した語がある分、語数は解放カウンタより多くなる", () => {
  // 上位3語は添字 0,1,2。添字 4 は圏外だが挑戦済みなのでプールに残る。
  const pool = getUnlockedIndices(ORDER, 3, statsWithProgressAt(4));
  assert.equal(pool.length, 4);
  assert.ok(pool.includes(4));
});

test("上位N語の内側の挑戦済み語は二重に数えない", () => {
  const pool = getUnlockedIndices(ORDER, 3, statsWithProgressAt(0, 1));
  assert.equal(pool.length, 3);
  assert.equal(new Set(pool).size, pool.length);
});

test("誤答だけの語もプールに残る", () => {
  const stats = ORDER.map(() => ({ ...NONE }));
  stats[4] = { correct: 0, wrong: 2 };
  const pool = getUnlockedIndices(ORDER, 3, stats);
  assert.ok(pool.includes(4));
});

test("解放カウンタが全語数を超えても語数は全語数で頭打ちになる", () => {
  const pool = getUnlockedIndices(ORDER, 999, statsWithProgressAt(0, 4));
  assert.equal(pool.length, ORDER.length);
});
