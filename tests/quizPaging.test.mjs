import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { pageSlots } from "../lib/quizSet.js";
import { GAME } from "../lib/constants.js";

// 10問は1セットのまま、画面に出すのは2問ずつにする。
//
// 目的はスクロールを消すこと。答案を縦に10問並べると、1問送るたびに紙が
// 動いて次の設問を目で探し直すことになる。2問ならキーボードが出ていても
// 1画面に収まるので、答案は「入れ替わる」だけで動かない。
//
// 前提として崩してはいけないのは、採点が回答と並走することのほう。
// 1問だけを出すと確定した瞬間に打つものが消え、採点の往復が待ち時間として
// 表に出てしまう（＝1問1答へ戻る）。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

test("1ページは2問。1問ずつには落とさない（採点と並走できなくなる）", () => {
  assert.equal(GAME.QUIZ_PAGE_SIZE, 2);
  assert.ok(GAME.QUIZ_PAGE_SIZE >= 2, "1問ずつだと採点が待ち時間として表に出る");
  assert.ok(
    GAME.PLAY_LIMIT % GAME.QUIZ_PAGE_SIZE === 0,
    "1セットが割り切れないと最後のページだけ問題数が変わる",
  );
});

test("いま入力中の設問が乗っているページを返す", () => {
  assert.deepEqual(pageSlots(0, 10, 2), [0, 1]);
  assert.deepEqual(pageSlots(1, 10, 2), [0, 1]);
  assert.deepEqual(pageSlots(2, 10, 2), [2, 3]);
  assert.deepEqual(pageSlots(9, 10, 2), [8, 9]);
});

test("ページが替わるのは2問打ち終えたとき（1問ごとには入れ替わらない）", () => {
  // 0→1 は同じ紙のまま。1→2 で初めて入れ替わる
  assert.deepEqual(pageSlots(0, 10, 2), pageSlots(1, 10, 2));
  assert.notDeepEqual(pageSlots(1, 10, 2), pageSlots(2, 10, 2));
});

test("飛ばした設問へ戻ると、その設問のページが出る", () => {
  // 10問目まで行って、2問目を空けたまま戻ってきた状態
  assert.deepEqual(pageSlots(1, 10, 2), [0, 1]);
});

test("端数のページは残りだけを出す", () => {
  assert.deepEqual(pageSlots(4, 5, 2), [4]);
  assert.deepEqual(pageSlots(0, 1, 2), [0]);
});

test("設問が無い・添字が範囲外でも壊れない", () => {
  assert.deepEqual(pageSlots(0, 0, 2), []);
  assert.deepEqual(pageSlots(-3, 10, 2), [0, 1], "負の添字は先頭のページへ寄せる");
  assert.deepEqual(pageSlots(42, 10, 2), [8, 9], "行き過ぎた添字は末尾のページへ寄せる");
  assert.deepEqual(pageSlots(0, 10, 0), []);
});

test("出題中は1ページぶんだけ、結果発表では10問すべてを描く", () => {
  const page = readSrc("app/page.tsx");
  assert.ok(
    /phase === "result"\s*\?\s*entries\.map\(\(_, slot\) => slot\)\s*:\s*pageSlots\(/.test(
      page,
    ),
    "答案に出す設問が「出題中はページぶん／結果発表は全問」になっていない",
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

test("設問の番号は1セットの通し番号のまま（ページ内で振り直さない）", () => {
  const sheet = readSrc("app/components/game/QuizSheet.tsx");
  assert.ok(
    sheet.includes("number={slot + 1}"),
    "番号がページ内の位置になっている（10問のどこにいるか分からなくなる）",
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

test("ページをまたぐフォーカス移動は同期的に描き替える（キーボードが閉じる）", () => {
  // 次のページの入力欄が描かれる前に focus() を呼ぶと空振りし、スマホでは
  // そこでソフトウェアキーボードが閉じてセットが続けられなくなる。
  // ユーザー操作の中で描き替え（flushSync）→ フォーカス まで済ませる。
  const page = readSrc("app/page.tsx");
  assert.ok(page.includes("const focusQuestion = useCallback"), "focusQuestion が無い");
  assert.ok(
    /flushSync\(\(\) => setActiveSlot\([^)]*\)\);\s*inputRefs\.current\[[^\]]*\]\?\.focus\(\);/.test(
      page,
    ),
    "描き替えを待たずに focus() している（次のページの入力欄がまだ無い）",
  );
});

test("回答の確定は次の設問へ送るところまでを1つの操作で済ませる", () => {
  const page = readSrc("app/page.tsx");
  const submit = page.slice(
    page.indexOf("const submitSlot = useCallback"),
    page.indexOf("/** 回答欄にカーソルが入ったら"),
  );
  assert.ok(submit.includes("focusQuestion(next)"), "確定後にページをまたげていない");
  assert.ok(
    !submit.includes("await"),
    "確定が採点を待っている（打つ手が止まる）",
  );
});
