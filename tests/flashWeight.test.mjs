import assert from "node:assert/strict";
import test from "node:test";

import { pickFlashIndex } from "../lib/flashWeight.js";
import { weightedPickIndex } from "../lib/weightedPick.js";

test("pickFlashIndex only returns indices from the given candidate list", () => {
  const stats = Array.from({ length: 20 }, () => ({ correct: 0, wrong: 0 }));
  const candidates = [3, 7, 11, 15, 19];
  for (let i = 0; i < 200; i++) {
    const picked = pickFlashIndex(candidates, stats, null);
    assert.ok(picked !== null && candidates.includes(picked));
  }
});

test("pickFlashIndex avoids repeating the same word twice in a row when possible", () => {
  const stats = Array.from({ length: 5 }, () => ({ correct: 0, wrong: 0 }));
  const candidates = [0, 1, 2, 3, 4];
  for (let i = 0; i < 200; i++) {
    const picked = pickFlashIndex(candidates, stats, 2);
    assert.notEqual(picked, 2);
  }
});

test("pickFlashIndex returns null for an empty candidate list", () => {
  assert.equal(pickFlashIndex([], [], null), null);
});

test("pickFlashIndex favors unseen words over mastered ones", () => {
  const stats = [
    { correct: 0, wrong: 0 }, // 未挑戦
    { correct: 5, wrong: 0 }, // 定着済み
  ];
  let unseenCount = 0;
  const trials = 2000;
  for (let i = 0; i < trials; i++) {
    if (pickFlashIndex([0, 1], stats, null) === 0) unseenCount++;
  }
  // 4 : 0.3 の重みなので、大まかに7割以上は未挑戦側に寄るはず
  assert.ok(unseenCount / trials > 0.7, `unseen ratio too low: ${unseenCount / trials}`);
});

test("pickFlashIndex does not repeat a word within the same lap even when heavily weighted", () => {
  // 未挑戦(重み4) 1語 + 定着済み(重み0.3) 4語。seenInLap を渡さないと
  // 未挑戦側ばかり引かれて1周し切る前に重複してしまう。
  const stats = [
    { correct: 0, wrong: 0 },
    { correct: 5, wrong: 0 },
    { correct: 5, wrong: 0 },
    { correct: 5, wrong: 0 },
    { correct: 5, wrong: 0 },
  ];
  const candidates = [0, 1, 2, 3, 4];
  const seen = new Set([0]);
  let prevIndex = 0;
  while (seen.size < candidates.length) {
    const picked = pickFlashIndex(candidates, stats, prevIndex, seen);
    assert.ok(picked !== null);
    assert.ok(!seen.has(picked), `word ${picked} repeated before completing a lap`);
    seen.add(picked);
    prevIndex = picked;
  }
});

test("weightedPickIndex rarely selects a near-zero-weight index over a heavily weighted one", () => {
  const indices = [0, 1];
  let zeroWeightPicks = 0;
  const trials = 2000;
  for (let i = 0; i < trials; i++) {
    if (weightedPickIndex(indices, (i) => (i === 0 ? 0 : 100)) === 0) zeroWeightPicks++;
  }
  assert.ok(zeroWeightPicks / trials < 0.05, `zero-weight ratio too high: ${zeroWeightPicks / trials}`);
});
