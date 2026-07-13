import assert from "node:assert/strict";
import test from "node:test";

import { buildAnswerRounds } from "../lib/tileQuiz.js";

const ITEMS = [
  { id: "w0", target: "mainly", partOfSpeech: "adverb", answers: ["主に", "主として"] },
  { id: "w1", target: "adopt", partOfSpeech: "verb", answers: ["採用する"] },
  { id: "w2", target: "maintain", partOfSpeech: "verb", answers: ["維持する"] },
  { id: "w3", target: "evaluate", partOfSpeech: "verb", answers: ["評価する"] },
  { id: "w4", target: "severe", partOfSpeech: "adjective", answers: ["厳しい"] },
  { id: "w5", target: "novel", partOfSpeech: "adjective", answers: ["斬新な"] },
];

test("ラウンド数=正答の文字数、各ラウンドは8択", () => {
  const board = buildAnswerRounds({
    items: ITEMS,
    index: 1,
    unlockedPoolSize: ITEMS.length,
    seed: "s1",
  });
  assert.equal(board.answer, "採用する");
  assert.deepEqual(board.answerChars, ["採", "用", "す", "る"]);
  assert.equal(board.rounds.length, 4);
  for (const round of board.rounds) {
    assert.equal(round.length, 8);
    assert.equal(new Set(round.map((t) => t.id)).size, 8, "タイルIDはユニーク");
  }
});

test("各ラウンドは正答の該当文字をちょうど1つ含み、他はダミー", () => {
  const board = buildAnswerRounds({
    items: ITEMS,
    index: 2, // 維持する
    unlockedPoolSize: ITEMS.length,
    seed: "s2",
  });
  board.rounds.forEach((round, i) => {
    const correct = board.answerChars[i];
    const chars = round.map((t) => t.char);
    assert.ok(chars.includes(correct), `ラウンド${i}に正答文字 ${correct} が含まれる`);
    // 正答文字は重複しない（正答が1つだけになるよう、ダミーは正答文字を避ける）
    assert.equal(chars.filter((c) => c === correct).length, 1);
  });
});

test("正答文字を順に選ぶと answer に一致する", () => {
  const board = buildAnswerRounds({
    items: ITEMS,
    index: 3,
    unlockedPoolSize: ITEMS.length,
    seed: "s3",
  });
  const built = board.rounds
    .map((round, i) => round.find((t) => t.char === board.answerChars[i]).char)
    .join("");
  assert.equal(built, board.answer);
});

test("同じシードなら同じラウンド構成（再レンダーで揺れない）", () => {
  const a = buildAnswerRounds({ items: ITEMS, index: 2, unlockedPoolSize: 6, seed: "fix" });
  const b = buildAnswerRounds({ items: ITEMS, index: 2, unlockedPoolSize: 6, seed: "fix" });
  assert.deepEqual(a, b);
});

test("プールが極端に小さくても各ラウンド8択を維持する（かな等で補填）", () => {
  const board = buildAnswerRounds({
    items: [ITEMS[0]],
    index: 0,
    unlockedPoolSize: 1,
    seed: "tiny",
  });
  assert.equal(board.answer, "主に");
  assert.equal(board.rounds.length, 2);
  for (const round of board.rounds) {
    assert.equal(round.length, 8);
    assert.equal(new Set(round.map((t) => t.char)).size, 8, "重複のない8文字");
  }
});

test("空白タイルは生成されない", () => {
  const items = [
    { id: "a", target: "give up", partOfSpeech: "phrase", answers: ["諦める"] },
    { id: "b", target: "x", partOfSpeech: "phrase", answers: ["取り 消す"] },
  ];
  const board = buildAnswerRounds({ items, index: 0, unlockedPoolSize: 2, seed: "ws" });
  for (const round of board.rounds) {
    for (const tile of round) assert.ok(!/\s/.test(tile.char));
  }
});

test("文字盤は右4つ=漢字、左4つ=それ以外を厳格に守る", () => {
  const KANJI_PATTERN = /[㐀-䶿一-鿿]/;
  const isKanji = (ch) => KANJI_PATTERN.test(ch);

  for (let index = 0; index < ITEMS.length; index++) {
    const board = buildAnswerRounds({
      items: ITEMS,
      index,
      unlockedPoolSize: ITEMS.length,
      seed: `strict-${index}`,
    });
    for (const round of board.rounds) {
      const left = [round[0], round[1], round[4], round[5]];
      const right = [round[2], round[3], round[6], round[7]];
      for (const tile of left) assert.ok(!isKanji(tile.char), `左側は漢字以外: ${tile.char}`);
      for (const tile of right) assert.ok(isKanji(tile.char), `右側は漢字: ${tile.char}`);
    }
  }
});

test("候補プールが極端に偏っていても左右の文字種ルールは崩れない", () => {
  // 訳がすべて漢字のみの単語ばかりの偏ったプール
  const kanjiHeavyItems = [
    { id: "a", target: "a", partOfSpeech: "noun", answers: ["漢字"] },
    { id: "b", target: "b", partOfSpeech: "noun", answers: ["国家"] },
    { id: "c", target: "c", partOfSpeech: "noun", answers: ["世界"] },
    { id: "d", target: "d", partOfSpeech: "noun", answers: ["言語"] },
  ];
  const KANJI_PATTERN = /[㐀-䶿一-鿿]/;
  const isKanji = (ch) => KANJI_PATTERN.test(ch);

  const board = buildAnswerRounds({
    items: kanjiHeavyItems,
    index: 0,
    unlockedPoolSize: kanjiHeavyItems.length,
    seed: "kanji-heavy",
  });
  for (const round of board.rounds) {
    const left = [round[0], round[1], round[4], round[5]];
    const right = [round[2], round[3], round[6], round[7]];
    for (const tile of left) assert.ok(!isKanji(tile.char), `左側は漢字以外: ${tile.char}`);
    for (const tile of right) assert.ok(isKanji(tile.char), `右側は漢字: ${tile.char}`);
  }
});

test("正答データがない場合は null", () => {
  const broken = [{ id: "x", target: "x", partOfSpeech: "noun", answers: [] }];
  assert.equal(
    buildAnswerRounds({ items: broken, index: 0, unlockedPoolSize: 1, seed: "s" }),
    null,
  );
});
