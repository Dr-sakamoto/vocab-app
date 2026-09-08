import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { resolveResultContinue } from "../lib/quizSet.js";
import { GAME } from "../lib/constants.js";

// 結果発表は10問で唯一の「読む場」なので、勢いで飛び越えられてはいけない。
// 10問を Enter／タップで送り続けた最後の1打が余ったまま結果発表へ着地すると、
// 答案を一度も見ないまま次のセットへ飛んでしまう（スマホでは仮想キーボードが
// 閉じたあとのゴーストクリックでも同じことが起きる）。

const root = new URL("../", import.meta.url);
const readSrc = (p) => readFileSync(new URL(p, root), "utf8");

test("出てすぐの「次へ」は弾く", () => {
  const { allowed } = resolveResultContinue(1_000, 1_300, GAME.RESULT_CONTINUE_LOCK_MS);
  assert.equal(allowed, false);
});

test("猶予が明けていれば通す", () => {
  const shownAt = 1_000;
  const { allowed } = resolveResultContinue(
    shownAt,
    shownAt + GAME.RESULT_CONTINUE_LOCK_MS,
    GAME.RESULT_CONTINUE_LOCK_MS,
  );
  assert.equal(allowed, true);
});

test("弾いた入力は起点をずらす（連打しているあいだは窓が明けない）", () => {
  // 固定の窓だと、明けた直後に届いた「余りの1打」でそのまま飛んでしまう。
  const grace = GAME.RESULT_CONTINUE_LOCK_MS;
  let anchor = 1_000; // 結果発表が出た時刻
  // 200ms間隔の連打。窓（1_000+grace）を越えても通らないこと
  for (let now = 1_200; now <= 1_000 + grace * 2; now += 200) {
    const gate = resolveResultContinue(anchor, now, grace);
    anchor = gate.anchorAt;
    assert.equal(gate.allowed, false, `${now}ms の連打が通ってしまった`);
  }
  // 手が止まって猶予ぶん静かになれば通る
  const settled = resolveResultContinue(anchor, anchor + grace, grace);
  assert.equal(settled.allowed, true);
});

test("通した判定では起点をずらさない", () => {
  const gate = resolveResultContinue(1_000, 5_000, GAME.RESULT_CONTINUE_LOCK_MS);
  assert.equal(gate.allowed, true);
  assert.equal(gate.anchorAt, 1_000);
});

test("「次のセットへ」はボタン・Enterの両方がこの判定を通る", () => {
  const context = readSrc("app/contexts/QuizGameContext.tsx");
  // 判定は continueToNextSet の中に1つだけ置く。経路ごとに書くと、
  // 片方（過去にはボタン経由）だけ守られていない状態へ静かに戻る。
  assert.ok(
    context.includes("resolveResultContinue("),
    "continueToNextSet が結果発表の猶予判定を通っていない",
  );
  assert.ok(
    /if \(!gate\.allowed\) return;/.test(context),
    "猶予に掛かった呼び出しが素通りしている",
  );
  const enterHandler = context.slice(context.indexOf('if (phase === "result") {'));
  assert.ok(
    enterHandler.slice(0, 200).includes("continueToNextSet()"),
    "Enterキーの経路が continueToNextSet を通っていない",
  );
});

test("結果発表が出た直後の「次のセットへ」は押せない状態で描かれる", () => {
  const inlineResult = readSrc("app/components/InlineResult.tsx");
  // disabled にしておくと、ゴーストクリックはクリックとして届かない。
  assert.ok(
    /disabled=\{locked\}/.test(inlineResult),
    "「次のセットへ」が出た直後も押せる状態になっている",
  );
  assert.ok(
    inlineResult.includes("GAME.RESULT_CONTINUE_LOCK_MS"),
    "錠の長さが猶予判定と同じ定数になっていない",
  );
  assert.ok(
    /locked \? "btn-quiet" : "btn-accent"/.test(inlineResult),
    "押せない状態が色で示されていない（無反応に見える）",
  );
});
