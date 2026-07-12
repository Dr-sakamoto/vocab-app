import assert from "node:assert/strict";
import test from "node:test";

import { buildAnswerTileBoard } from "../lib/tileQuiz.js";

const ITEMS = [
  { id: "w0", target: "mainly", partOfSpeech: "adverb", answers: ["主に", "主として"] },
  { id: "w1", target: "adopt", partOfSpeech: "verb", answers: ["採用する"] },
  { id: "w2", target: "maintain", partOfSpeech: "verb", answers: ["維持する"] },
  { id: "w3", target: "evaluate", partOfSpeech: "verb", answers: ["評価する"] },
  { id: "w4", target: "severe", partOfSpeech: "adjective", answers: ["厳しい"] },
  { id: "w5", target: "novel", partOfSpeech: "adjective", answers: ["斬新な"] },
];

function countChars(chars) {
  const map = new Map();
  for (const c of chars) map.set(c, (map.get(c) ?? 0) + 1);
  return map;
}

test("正答の全文字がタイルに含まれ、スロット数は正答の文字数", () => {
  const board = buildAnswerTileBoard({
    items: ITEMS,
    index: 1,
    unlockedPoolSize: ITEMS.length,
    seed: "s1",
  });
  assert.equal(board.answer, "採用する");
  assert.deepEqual(board.answerChars, ["採", "用", "す", "る"]);

  const tileChars = countChars(board.tiles.map((t) => t.char));
  for (const [char, needed] of countChars(board.answerChars)) {
    assert.ok((tileChars.get(char) ?? 0) >= needed, `${char} が足りない`);
  }
  // タイルIDはユニーク
  assert.equal(new Set(board.tiles.map((t) => t.id)).size, board.tiles.length);
});

test("ダミーが加わり、盤面は正答より大きい（正答がそのまま並ばない）", () => {
  const board = buildAnswerTileBoard({
    items: ITEMS,
    index: 4,
    unlockedPoolSize: ITEMS.length,
    seed: "s2",
  });
  assert.ok(board.tiles.length > board.answerChars.length);
  assert.ok(board.tiles.length <= 14);
});

test("同じシードなら同じ盤面（再レンダーで揺れない）", () => {
  const a = buildAnswerTileBoard({ items: ITEMS, index: 2, unlockedPoolSize: 6, seed: "fix" });
  const b = buildAnswerTileBoard({ items: ITEMS, index: 2, unlockedPoolSize: 6, seed: "fix" });
  assert.deepEqual(a, b);
});

test("ダミー文字は解放済みプールの訳の文字（または正答自身の文字）のみ", () => {
  for (let s = 0; s < 10; s++) {
    const board = buildAnswerTileBoard({
      items: ITEMS,
      index: 1,
      unlockedPoolSize: 4, // w0-w3のみ解放
      seed: `pool${s}`,
    });
    const allowed = new Set();
    for (const item of ITEMS.slice(0, 4)) for (const c of item.answers[0]) allowed.add(c);
    for (const c of ITEMS[0].answers[1] ?? "") allowed.add(c);
    for (const tile of board.tiles) {
      assert.ok(allowed.has(tile.char), `${tile.char} は未解放の文字`);
    }
  }
});

test("プールが極端に小さくてもタイル数は維持される（正答文字で埋める）", () => {
  const board = buildAnswerTileBoard({
    items: [ITEMS[0]],
    index: 0,
    unlockedPoolSize: 1,
    seed: "tiny",
  });
  assert.equal(board.answer, "主に");
  assert.ok(board.tiles.length >= board.answerChars.length + 4);
  for (const tile of board.tiles) {
    assert.ok(["主", "に"].includes(tile.char));
  }
});

test("空白タイルは生成されない", () => {
  const items = [
    { id: "a", target: "give up", partOfSpeech: "phrase", answers: ["諦める"] },
    { id: "b", target: "x", partOfSpeech: "phrase", answers: ["取り 消す"] },
  ];
  const board = buildAnswerTileBoard({ items, index: 0, unlockedPoolSize: 2, seed: "ws" });
  for (const tile of board.tiles) {
    assert.ok(!/\s/.test(tile.char));
  }
});

test("正答データがない場合は null", () => {
  const broken = [{ id: "x", target: "x", partOfSpeech: "noun", answers: [] }];
  assert.equal(
    buildAnswerTileBoard({ items: broken, index: 0, unlockedPoolSize: 1, seed: "s" }),
    null,
  );
});
