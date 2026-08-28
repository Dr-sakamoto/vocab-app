import assert from "node:assert/strict";
import test from "node:test";

import { isRetained, countRetained, countRetentionGain } from "../lib/retention.js";
import { hasRecoveredFromMistakes } from "../lib/flashWeight.js";

test("定着の判定には正解2回以上が要る（1回はまぐれと区別できない）", () => {
  assert.equal(isRetained({ correct: 0, wrong: 0 }), false);
  assert.equal(isRetained({ correct: 1, wrong: 0 }), false);
  assert.equal(isRetained({ correct: 2, wrong: 0 }), true);
  assert.equal(isRetained(undefined), false);
});

test("誤答があっても、誤答の2倍以上正解していれば定着", () => {
  assert.equal(isRetained({ correct: 2, wrong: 1 }), true);
  assert.equal(isRetained({ correct: 3, wrong: 2 }), false);
  assert.equal(isRetained({ correct: 4, wrong: 2 }), true);
});

test("定着ラインは苦手フラッシュの卒業ラインと食い違わない", () => {
  // 苦手フラッシュを卒業していない語が定着に数えられると、
  // 「苦手なのに定着済み」という矛盾した表示になる。
  for (const stat of [
    { correct: 0, wrong: 3 },
    { correct: 2, wrong: 3 },
    { correct: 5, wrong: 3 },
    { correct: 6, wrong: 3 },
  ]) {
    if (!hasRecoveredFromMistakes(stat)) {
      assert.equal(isRetained(stat), false, JSON.stringify(stat));
    }
  }
});

test("countRetained は渡された添字の語だけを数える", () => {
  const stats = [
    { correct: 5, wrong: 0 }, // 定着
    { correct: 1, wrong: 0 }, // 未定着
    { correct: 4, wrong: 1 }, // 定着
    { correct: 0, wrong: 4 }, // 未定着
  ];
  assert.equal(countRetained([0, 1, 2, 3], stats), 2);
  assert.equal(countRetained([1, 3], stats), 0);
  assert.equal(countRetained([], stats), 0);
});

test("正解して定着ラインを越えた語だけが増分に数えられる", () => {
  const gain = countRetentionGain([
    // (1,0) → (2,0)：定着した
    { id: "a", correct: true, previousCorrect: 1, previousWrong: 0 },
    // (5,0) → (6,0)：もともと定着済みなので増分ではない
    { id: "b", correct: true, previousCorrect: 5, previousWrong: 0 },
    // (0,0) → (1,0)：まだ正解1回なので定着していない
    { id: "c", correct: true, previousCorrect: 0, previousWrong: 0 },
  ]);
  assert.equal(gain, 1);
});

test("定着から外れた語はマイナスに数える", () => {
  // (2,1) は定着（2 >= 1*2）だが、落として (2,2) になると外れる
  const gain = countRetentionGain([
    { id: "a", correct: false, previousCorrect: 2, previousWrong: 1 },
  ]);
  assert.equal(gain, -1);
});

test("定着済みの語を1問落としただけでは外れない", () => {
  const gain = countRetentionGain([
    { id: "a", correct: false, previousCorrect: 5, previousWrong: 1 },
  ]);
  assert.equal(gain, 0);
});

test("増えた語と外れた語は相殺される", () => {
  const gain = countRetentionGain([
    { id: "a", correct: true, previousCorrect: 1, previousWrong: 0 },   // +1
    { id: "b", correct: false, previousCorrect: 2, previousWrong: 1 },  // -1
    { id: "c", correct: true, previousCorrect: 1, previousWrong: 0 },   // +1
  ]);
  assert.equal(gain, 1);
});

test("同じ語に複数回答えても二重に数えない", () => {
  const gain = countRetentionGain([
    { id: "a", correct: true, previousCorrect: 1, previousWrong: 0 }, // (1,0)→(2,0)
    { id: "a", correct: true, previousCorrect: 2, previousWrong: 0 }, // (2,0)→(3,0)
  ]);
  assert.equal(gain, 1);
});

test("回答がなければ増減は0", () => {
  assert.equal(countRetentionGain(null), 0);
  assert.equal(countRetentionGain([]), 0);
});
