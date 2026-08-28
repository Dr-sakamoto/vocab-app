import assert from "node:assert/strict";
import test from "node:test";

import {
  pickFlashIndex,
  isNewWord,
  filterNewIndices,
  isMistakeWord,
  hasRecoveredFromMistakes,
  filterMistakeIndices,
  createFlashProgress,
  advanceFlashProgress,
} from "../lib/flashWeight.js";
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

test("isNewWord is true only before the word has ever been answered", () => {
  assert.equal(isNewWord(undefined), true);
  assert.equal(isNewWord({ correct: 0, wrong: 0 }), true);
  assert.equal(isNewWord({ correct: 1, wrong: 0 }), false);
  assert.equal(isNewWord({ correct: 0, wrong: 1 }), false);
});

test("filterNewIndices keeps only never-answered words (通常フラッシュの出題範囲)", () => {
  const stats = [
    { correct: 0, wrong: 0 }, // 未挑戦
    { correct: 1, wrong: 0 }, // 1回正解した
    { correct: 0, wrong: 1 }, // 1回落とした（苦手判定には届かない）
    { correct: 9, wrong: 0 }, // 定着済み
    { correct: 0, wrong: 0 }, // 未挑戦
  ];
  assert.deepEqual(filterNewIndices([0, 1, 2, 3, 4], stats), [0, 4]);
});

test("filterNewIndices と filterMistakeIndices の対象は重ならない", () => {
  // 未挑戦語は wrong=0 なので、どの苦手度でも苦手フラッシュ側には入らない。
  // 逆に苦手語は必ず誤答を持つので新規側にも入らない（役割分担が成立する）。
  const stats = [
    { correct: 0, wrong: 0 },
    { correct: 0, wrong: 3 },
    { correct: 1, wrong: 0 },
    { correct: 5, wrong: 3 },
  ];
  const candidates = [0, 1, 2, 3];
  for (const threshold of [1, 2, 3, 4, 5]) {
    const fresh = new Set(filterNewIndices(candidates, stats));
    const weak = filterMistakeIndices(candidates, stats, threshold);
    assert.deepEqual(
      weak.filter((i) => fresh.has(i)),
      [],
      `threshold=${threshold} で新規と苦手が重複している`,
    );
  }
});

test("isMistakeWord is true once wrong count reaches the threshold", () => {
  assert.equal(isMistakeWord(undefined), false);
  assert.equal(isMistakeWord({ correct: 0, wrong: 0 }), false);
  assert.equal(isMistakeWord({ correct: 5, wrong: 1 }), false);
  // 誤答2回に対して正解5回は「定着し直した」側なので苦手には含めない
  assert.equal(isMistakeWord({ correct: 5, wrong: 2 }), false);
  assert.equal(isMistakeWord({ correct: 1, wrong: 2 }), true);
  assert.equal(isMistakeWord({ correct: 0, wrong: 3 }), true);
});

test("hasRecoveredFromMistakes needs twice as many correct answers as mistakes", () => {
  assert.equal(hasRecoveredFromMistakes(undefined), true);
  assert.equal(hasRecoveredFromMistakes({ correct: 0, wrong: 0 }), true);
  assert.equal(hasRecoveredFromMistakes({ correct: 1, wrong: 1 }), false);
  assert.equal(hasRecoveredFromMistakes({ correct: 2, wrong: 1 }), true);
  assert.equal(hasRecoveredFromMistakes({ correct: 9, wrong: 5 }), false);
  assert.equal(hasRecoveredFromMistakes({ correct: 10, wrong: 5 }), true);
});

test("isMistakeWord separates recovered words from ones still being missed", () => {
  // 「5回間違えたがその後は定着した語」と「その後も落とし続けている語」は
  // 累計 wrong だけ見ると区別できず、どちらも苦手フラッシュに残ってしまう。
  const recovered = { correct: 12, wrong: 5 };
  const stillMissing = { correct: 2, wrong: 6 };

  for (const threshold of [1, 2, 3, 4, 5]) {
    assert.equal(
      isMistakeWord(recovered, threshold),
      false,
      `recovered word should graduate at threshold ${threshold}`,
    );
    assert.equal(
      isMistakeWord(stillMissing, threshold),
      true,
      `still-missed word should stay at threshold ${threshold}`,
    );
  }
});

test("isMistakeWord keeps a word until enough correct answers pile up after the mistakes", () => {
  // 誤答5回の語は、正解を積み上げていく途中では苦手に残り、10回で卒業する
  for (let correct = 0; correct < 10; correct++) {
    assert.equal(isMistakeWord({ correct, wrong: 5 }, 5), true, `correct=${correct}`);
  }
  assert.equal(isMistakeWord({ correct: 10, wrong: 5 }, 5), false);
});

test("filterMistakeIndices keeps only frequently-missed words from the candidate list", () => {
  const stats = [
    { correct: 0, wrong: 0 }, // 未挑戦
    { correct: 5, wrong: 0 }, // 定着済み
    { correct: 1, wrong: 2 }, // よく間違える
    { correct: 0, wrong: 4 }, // よく間違える
    { correct: 12, wrong: 5 }, // よく間違えたが、その後定着した
  ];
  assert.deepEqual(filterMistakeIndices([0, 1, 2, 3, 4], stats), [2, 3]);
  assert.deepEqual(filterMistakeIndices([0, 1], stats), []);
});

test("isMistakeWord and filterMistakeIndices honor a custom threshold", () => {
  const stats = [
    { correct: 0, wrong: 1 },
    { correct: 0, wrong: 3 },
    { correct: 0, wrong: 5 },
  ];
  assert.equal(isMistakeWord(stats[0], 1), true);
  assert.equal(isMistakeWord(stats[0], 3), false);
  assert.deepEqual(filterMistakeIndices([0, 1, 2], stats, 1), [0, 1, 2]);
  assert.deepEqual(filterMistakeIndices([0, 1, 2], stats, 3), [1, 2]);
  assert.deepEqual(filterMistakeIndices([0, 1, 2], stats, 5), [2]);
});

test("advanceFlashProgress keeps advancing step when only one word is a candidate", () => {
  // 苦手フラッシュで該当語が1語しかない場合、pickFlashIndex は同じ index を返す。
  // step が進まないと FlashScreen のタイマー依存配列が変化せず、1コマで自動送りが
  // 止まってしまう（=「1問したら落ちる」）ため、step の単調増加を保証する。
  const stats = [{ correct: 0, wrong: 3 }];
  const candidates = [0];
  let progress = createFlashProgress(candidates, stats);
  assert.equal(progress.index, 0);
  assert.equal(progress.step, 0);

  for (let i = 1; i <= 5; i++) {
    progress = advanceFlashProgress(progress, candidates, stats);
    assert.equal(progress.index, 0, "single candidate should stay on the same word");
    assert.equal(progress.step, i, "step must increase on every advance");
    assert.equal(progress.lap, i + 1, "a one-word pool completes a lap every advance");
  }
});

test("advanceFlashProgress increments step for multi-word pools too", () => {
  const stats = Array.from({ length: 4 }, () => ({ correct: 0, wrong: 3 }));
  const candidates = [0, 1, 2, 3];
  let progress = createFlashProgress(candidates, stats);
  for (let i = 1; i <= 12; i++) {
    const prev = progress;
    progress = advanceFlashProgress(progress, candidates, stats);
    assert.equal(progress.step, i);
    assert.notEqual(progress.index, prev.index, "should not show the same word twice in a row");
    assert.ok(candidates.includes(progress.index));
  }
});

test("advanceFlashProgress shows the full lap (e.g. 3/3) before resetting on the next word", () => {
  // 59/60 の次が 1/60 に飛ばず、まず 60/60 を表示してから次のコマで 1/60 に
  // リセットされることを確認する（表示上の境目の飛びを防ぐ）。
  const stats = Array.from({ length: 3 }, () => ({ correct: 0, wrong: 3 }));
  const candidates = [0, 1, 2];
  let progress = createFlashProgress(candidates, stats);
  const seenFirstLap = new Set(progress.seen);

  // 3語プールなので2回進めると3語すべて出そろうが、まだリセットはされない
  progress = advanceFlashProgress(progress, candidates, stats);
  seenFirstLap.add(progress.index);
  progress = advanceFlashProgress(progress, candidates, stats);
  seenFirstLap.add(progress.index);

  assert.equal(seenFirstLap.size, 3, "a lap should cover every candidate exactly once");
  assert.equal(progress.seen.size, 3, "seen should still show the full lap (e.g. 3/3), not reset yet");
  assert.equal(progress.lap, 1, "lap should not increment until the full-lap state has been shown");

  // 次のコマでようやくリセットされ、周回数が上がる
  progress = advanceFlashProgress(progress, candidates, stats);
  assert.equal(progress.lap, 2);
  assert.deepEqual([...progress.seen], [progress.index], "seen resets to the current word");
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
