import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// フラッシュのカード表示の方針を構造として固定するテスト。
//
// 方針
//   1. 読み上げが英語なので、画面は日本語を主役にする（耳＝英語 / 目＝日本語）。
//   2. 並びは「日本語 → 英語」。日本語が最大で、英語はその下に一段小さく置く。
//   3. 品詞は出さない。英語と訳を同時に見せるフラッシュでは意味が曖昧にならず、
//      品詞が要るのは「入力して答える」テスト側だけ（採点の品詞チェックにも使う）。

const root = new URL("../", import.meta.url);
const flash = readFileSync(new URL("app/components/flash/FlashScreen.tsx", root), "utf8");
const card = flash.slice(flash.indexOf("<AnimatePresence"), flash.indexOf("</AnimatePresence>"));

test("フラッシュのカードは日本語を英語より先に置く", () => {
  const ja = card.indexOf("{q.answers[0]}");
  const en = card.indexOf("{q.target}");
  assert.ok(ja >= 0, "カードに訳（q.answers[0]）が無い");
  assert.ok(en >= 0, "カードに単語（q.target）が無い");
  assert.ok(ja < en, "英語が日本語より先に置かれている");
});

/** JSX の className から text-* のサイズ指定を拾う（sm: などの接頭辞ごと） */
function textSizes(jsx, marker) {
  const line = jsx.lastIndexOf("<div", jsx.indexOf(marker));
  const cls = /className="([^"]*)"/.exec(jsx.slice(line, jsx.indexOf(marker)));
  assert.ok(cls, `${marker} の className が読めない`);
  return cls[1].split(/\s+/).filter((c) => /^(?:sm:)?text-(?:xs|sm|base|[2-9]?xl)$/.test(c));
}

test("フラッシュのカードは日本語が英語より大きい", () => {
  const scale = ["text-xs", "text-sm", "text-base", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];
  const rank = (c) => scale.indexOf(c.replace("sm:", ""));

  for (const prefix of ["", "sm:"]) {
    const pick = (marker) =>
      textSizes(card, marker).find((c) => (prefix ? c.startsWith("sm:") : !c.startsWith("sm:")));
    const ja = pick("{q.answers[0]}");
    const en = pick("{q.target}");
    assert.ok(ja && en, `${prefix || "base"} のサイズ指定が揃っていない`);
    assert.ok(rank(ja) > rank(en), `${prefix || "base"} で日本語(${ja})が英語(${en})より大きくない`);
  }
});

test("フラッシュのカードに品詞を出さない", () => {
  assert.ok(!flash.includes("partOfSpeech"), "FlashScreen に品詞の表示が残っている");
});

test("テスト側のカードは品詞を出す（1単語に複数品詞がある語の区別に要る）", () => {
  const question = readFileSync(new URL("app/components/game/QuestionCard.tsx", root), "utf8");
  assert.ok(question.includes("{partOfSpeech}"), "QuestionCard から品詞の表示が消えている");
});
