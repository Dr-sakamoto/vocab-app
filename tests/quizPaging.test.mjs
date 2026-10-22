import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { windowSlots, canAdvanceWindow, QUIZ_WINDOW_SIZE } from "../lib/quizSet.js";

// 10問は1セットのまま、画面に出すのは常に窓の3問（上＝採点中／採点済み、
// 下のほう＝いま回答中）。窓は静的なページ送りではなく、
// 「窓の中をすべて確定していて、かつ上の採点がすでに返っている」ときだけ
// 1つずつ前へ進む（＝随時採点：答え合わせを見ないまま次の問題が出ることはない）。
//
// 前提として崩してはいけないのは、採点が回答と並走することのほう。
// 1問だけを出すと確定した瞬間に打つものが消え、採点の往復が待ち時間として
// 表に出てしまう（＝1問1答へ戻る）。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

function entry({ committed = false, correct = null } = {}) {
  return {
    poolIndex: 0,
    item: { id: "w", target: "w", partOfSpeech: "noun", answers: ["訳"] },
    input: "",
    committed,
    outcome:
      correct === null
        ? null
        : {
            status: correct ? "exact" : "wrong",
            correct,
            normalizedAnswers: ["訳"],
            posViolation: null,
            aiFeedback: null,
          },
  };
}

test("窓は常に3問（末尾では残りの問題だけ）", () => {
  assert.equal(QUIZ_WINDOW_SIZE, 3);
  assert.deepEqual(windowSlots(0, 10), [0, 1, 2]);
  assert.deepEqual(windowSlots(5, 10), [5, 6, 7]);
  assert.deepEqual(windowSlots(8, 10), [8, 9]);
  assert.deepEqual(windowSlots(9, 10), [9]);
});

test("添字が範囲外でも壊れない", () => {
  assert.deepEqual(windowSlots(0, 0), []);
  assert.deepEqual(windowSlots(-3, 10), [0, 1, 2], "負の添字は先頭へ寄せる");
  assert.deepEqual(windowSlots(42, 10), [9], "行き過ぎた添字は末尾へ寄せる");
});

test("下がまだ確定していなければ進めない", () => {
  const entries = [entry({ committed: true, correct: true }), entry({ committed: false })];
  assert.equal(canAdvanceWindow(entries, 0), false);
});

test("下は確定していても上の採点がまだなら進めない（答え合わせを見せずに次を出さない）", () => {
  const entries = [entry({ committed: true, correct: null }), entry({ committed: true })];
  assert.equal(canAdvanceWindow(entries, 0), false);
});

test("上が未確定のままでも進めない", () => {
  const entries = [entry({ committed: false }), entry({ committed: true })];
  assert.equal(canAdvanceWindow(entries, 0), false);
});

test("下を確定していて、上の採点も済んでいれば進めてよい", () => {
  const entries = [entry({ committed: true, correct: true }), entry({ committed: true })];
  assert.equal(canAdvanceWindow(entries, 0), true);
});

test("窓の途中に未確定の設問が残っていれば進めない", () => {
  const entries = [
    entry({ committed: true, correct: true }),
    entry({ committed: false }),
    entry({ committed: true }),
  ];
  assert.equal(canAdvanceWindow(entries, 0), false);
});

test("窓の3問をすべて確定し、上の採点が済んでいれば進めてよい", () => {
  const entries = [
    entry({ committed: true, correct: false }),
    entry({ committed: true }),
    entry({ committed: true }),
    entry({ committed: false }),
  ];
  assert.equal(canAdvanceWindow(entries, 0), true);
});

test("3問目を確定していなければ、上の採点が済んでいても進めない", () => {
  const entries = [
    entry({ committed: true, correct: true }),
    entry({ committed: true }),
    entry({ committed: false }),
  ];
  assert.equal(canAdvanceWindow(entries, 0), false);
});

test("末尾（下が無い）なら進めない", () => {
  const entries = [entry({ committed: true, correct: true })];
  assert.equal(canAdvanceWindow(entries, 0), false);
});

test("出題中は窓の3問だけ、結果発表では10問すべてを描く", () => {
  // 出題ロジックは `/` と `/result` の画面遷移をまたぐ Provider に置かれている。
  const page = readSrc("app/contexts/QuizGameContext.tsx");
  assert.ok(
    /phase === "result"\s*\?\s*entries\.map\(\(_, slot\) => slot\)\s*:\s*windowSlots\(/.test(
      page,
    ),
    "答案に出す設問が「出題中は窓ぶん／結果発表は全問」になっていない",
  );
});

test("答案は渡された設問だけを描く（10問を並べて隠さない）", () => {
  const sheet = readSrc("app/components/game/QuizSheet.tsx");
  assert.ok(
    sheet.includes("visibleSlots.map("),
    "QuizSheet が visibleSlots を描いていない",
  );
  assert.ok(
    !/entries\.map\(/.test(sheet),
    "QuizSheet が10問すべてを描いている（画面外に置いてもスクロールは戻る）",
  );
});

test("設問の番号は1セットの通し番号のまま（窓内で振り直さない）", () => {
  const sheet = readSrc("app/components/game/QuizSheet.tsx");
  assert.ok(
    sheet.includes("number={slot + 1}"),
    "番号が窓内の位置になっている（10問のどこにいるか分からなくなる）",
  );
});

test("出題中の答案はスクロールしない", () => {
  const studyScreen = readSrc("app/components/game/StudyScreen.tsx");
  const quizBody = studyScreen.slice(studyScreen.indexOf("<QuizSheet {...sheet} />"));
  assert.ok(
    !quizBody.includes("overflow-y-auto"),
    "出題中の答案にスクロール領域が残っている",
  );
});

test("窓をまたぐフォーカス移動は同期的に描き替える（キーボードが閉じる）", () => {
  // 窓を進めて新しい下の入力欄が描かれる前に focus() を呼ぶと空振りし、
  // スマホではそこでソフトウェアキーボードが閉じてセットが続けられなくなる。
  // ユーザー操作の中で描き替え（flushSync）→ フォーカス まで済ませる。
  const page = readSrc("app/contexts/QuizGameContext.tsx");
  assert.ok(page.includes("const advanceWindow = useCallback"), "advanceWindow が無い");
  assert.ok(
    /flushSync\(\(\) => setWindowStart\([^)]*\)\);\s*inputRefs\.current\[[^\]]*\]\?\.focus\([^)]*\);/.test(
      page,
    ),
    "描き替えを待たずに focus() している（次の入力欄がまだ無い）",
  );
});

test("下の回答の確定は、上の採点が済んでいればその場で窓を進める", () => {
  const page = readSrc("app/contexts/QuizGameContext.tsx");
  const submit = page.slice(
    page.indexOf("const submitSlot = useCallback"),
    page.indexOf("// 下を確定した時点では上の採点がまだ返っていなかった場合"),
  );
  assert.ok(submit.includes("canAdvance(windowStart)"), "確定時に窓を進めてよいか判定していない");
  assert.ok(submit.includes("advanceWindow()"), "確定後に窓を進めていない");
  assert.ok(
    !submit.includes("await"),
    "確定が採点を待っている（打つ手が止まる）",
  );
});

test("上の採点が確定後に返ってきた場合も、自動で窓を進める", () => {
  const page = readSrc("app/contexts/QuizGameContext.tsx");
  assert.ok(
    /useEffect\(\(\) => \{\s*if \(phase !== "quiz"\) return;\s*if \(!canAdvance\(windowStart\)\) return;\s*advanceWindow\(\);/.test(
      page,
    ),
    "採点待ちで足止めされたあとの自動進行が無い",
  );
});

test("縦が詰まった画面でも、回答中の欄は表示枠の下に隠れない", () => {
  // 窓の3問が収まらない小さい画面（キーボード表示中など）では、回答中の欄が
  // 見える位置まで表示枠を送る。利用者が自分でスクロールする領域にはしない。
  const studyScreen = readSrc("app/components/game/StudyScreen.tsx");
  const row = readSrc("app/components/game/TypingAnswerRow.tsx");
  assert.ok(
    studyScreen.includes('data-quiz-viewport className="min-h-0 flex-1 overflow-hidden"'),
    "答案の表示枠に目印が無い、または手でスクロールできる",
  );
  assert.match(row, /closest<HTMLElement>\("\[data-quiz-viewport\]"\)/);
  assert.match(row, /keepInView\(e\.currentTarget\);/);
});
