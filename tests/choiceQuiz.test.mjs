import assert from "node:assert/strict";
import test from "node:test";

import { buildChoiceOptions } from "../lib/choiceQuiz.js";

const ITEMS = [
  { id: "w0", target: "mainly", partOfSpeech: "adverb", answers: ["主に", "主として"] },
  { id: "w1", target: "adopt", partOfSpeech: "verb", answers: ["採用する"] },
  { id: "w2", target: "maintain", partOfSpeech: "verb", answers: ["維持する"] },
  { id: "w3", target: "evaluate", partOfSpeech: "verb", answers: ["評価する"] },
  { id: "w4", target: "severe", partOfSpeech: "adjective", answers: ["厳しい"] },
  { id: "w5", target: "novel", partOfSpeech: "adjective", answers: ["斬新な"] },
  { id: "w6", target: "chiefly", partOfSpeech: "adverb", answers: ["主に"] }, // w0と同じ訳
  { id: "w7", target: "obtain", partOfSpeech: "verb", answers: ["得る"] },
];

test("正解1つ+ダミー3つの4択を返す", () => {
  const options = buildChoiceOptions({
    items: ITEMS,
    index: 1,
    unlockedPoolSize: ITEMS.length,
    seed: "s1",
  });
  assert.equal(options.length, 4);
  assert.equal(options.filter((o) => o.correct).length, 1);
  assert.equal(options.find((o) => o.correct).text, "採用する");
  // 表示テキストは重複しない
  assert.equal(new Set(options.map((o) => o.text)).size, 4);
});

test("同じシードなら同じ選択肢・並び順になる（再レンダーで揺れない）", () => {
  const a = buildChoiceOptions({ items: ITEMS, index: 2, unlockedPoolSize: 8, seed: "fixed" });
  const b = buildChoiceOptions({ items: ITEMS, index: 2, unlockedPoolSize: 8, seed: "fixed" });
  assert.deepEqual(a, b);
});

test("出題単語の別解と同じ訳はダミーにならない", () => {
  // w0(mainly)の出題: w6(chiefly)の訳「主に」はw0の正答と同じなので除外される
  for (let s = 0; s < 10; s++) {
    const options = buildChoiceOptions({
      items: ITEMS,
      index: 0,
      unlockedPoolSize: ITEMS.length,
      seed: `s${s}`,
    });
    const texts = options.map((o) => o.text);
    assert.equal(texts.filter((t) => t === "主に").length, 1, "「主に」は正解の1回だけ");
    assert.ok(!texts.includes("主として"));
  }
});

test("ダミーは解放済みプールからのみ選ばれる", () => {
  for (let s = 0; s < 10; s++) {
    const options = buildChoiceOptions({
      items: ITEMS,
      index: 1,
      unlockedPoolSize: 4, // w0-w3のみ解放
      seed: `pool${s}`,
    });
    // 解放済み(w0-w3)の訳としても存在するテキストは正当なので除いて判定する
    const unlockedAnswers = new Set(ITEMS.slice(0, 4).map((item) => item.answers[0]));
    const lockedAnswers = ITEMS.slice(4)
      .map((item) => item.answers[0])
      .filter((text) => !unlockedAnswers.has(text));
    for (const option of options) {
      assert.ok(!lockedAnswers.includes(option.text), `${option.text} は未解放`);
    }
  }
});

test("プールが小さくても正解は必ず含まれ、選択肢は重複しない", () => {
  const options = buildChoiceOptions({
    items: ITEMS.slice(0, 2),
    index: 0,
    unlockedPoolSize: 2,
    seed: "tiny",
  });
  assert.ok(options.some((o) => o.correct));
  assert.ok(options.length >= 2);
  assert.equal(new Set(options.map((o) => o.text)).size, options.length);
});

test("正答データがない場合は空を返す", () => {
  const broken = [{ id: "x", target: "x", partOfSpeech: "noun", answers: [] }];
  assert.deepEqual(
    buildChoiceOptions({ items: broken, index: 0, unlockedPoolSize: 1, seed: "s" }),
    [],
  );
});
