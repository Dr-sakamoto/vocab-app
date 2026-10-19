import assert from "node:assert/strict";
import test from "node:test";

import {
  createLapState,
  isLapLocked,
  lapOrder,
  normalizeLapState,
  pickLapSet,
} from "../lib/lapOrder.js";

test("1周の並びは全語をちょうど1回ずつ含み、同じ seed・lap なら再現する", () => {
  const order = lapOrder(100, 42, 0);
  assert.equal(order.length, 100);
  assert.deepEqual([...order].sort((a, b) => a - b), Array.from({ length: 100 }, (_, i) => i));
  assert.deepEqual(lapOrder(100, 42, 0), order);
  // 周が変われば並びも変わる
  assert.notDeepEqual(lapOrder(100, 42, 1), order);
});

test("セットを重ねると1周のあいだ同じ語が二度出ない", () => {
  let state = createLapState(7);
  const seen = new Set();
  for (let i = 0; i < 10; i += 1) {
    const { indices, next } = pickLapSet(state, 100, 10);
    assert.equal(indices.length, 10);
    for (const index of indices) {
      assert.ok(!seen.has(index));
      seen.add(index);
    }
    state = next;
  }
  assert.equal(seen.size, 100);
  // 割り切れる語数なら、ちょうど次の周の先頭に立つ
  assert.deepEqual(state, { seed: 7, lap: 1, cursor: 0 });
});

test("周の切れ目をまたぐセットでも同じ語は1セットに一度だけ", () => {
  const state = { seed: 3, lap: 0, cursor: 8 };
  const { indices, next } = pickLapSet(state, 12, 10);
  assert.equal(indices.length, 10);
  assert.equal(new Set(indices).size, 10);
  assert.equal(next.lap, 1);
});

test("pickLapSet は渡した状態を書き換えない（締めで next を確定させる）", () => {
  const state = createLapState(1);
  pickLapSet(state, 50, 10);
  assert.deepEqual(state, { seed: 1, lap: 0, cursor: 0 });
});

test("収録語数がセットより少なければ全語だけ返す", () => {
  const { indices } = pickLapSet(createLapState(5), 4, 10);
  assert.equal(indices.length, 4);
});

test("指定の周回数を終えるまでパーソナライズをロックする", () => {
  assert.equal(isLapLocked({ seed: 1, lap: 0, cursor: 0 }, 5), true);
  assert.equal(isLapLocked({ seed: 1, lap: 4, cursor: 999 }, 5), true);
  assert.equal(isLapLocked({ seed: 1, lap: 5, cursor: 0 }, 5), false);
});

test("保存値が壊れていれば1周目から始め直す", () => {
  assert.deepEqual(normalizeLapState({ seed: 9, lap: 2, cursor: 30 }), { seed: 9, lap: 2, cursor: 30 });
  const fresh = normalizeLapState(null);
  assert.equal(fresh.lap, 0);
  assert.equal(fresh.cursor, 0);
  assert.ok(Number.isInteger(fresh.seed));
  assert.equal(normalizeLapState({ seed: "x" }).lap, 0);
});
