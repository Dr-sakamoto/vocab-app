import assert from "node:assert/strict";
import test from "node:test";

import { COLLOCATIONS, VOCAB_ITEMS, toWordId } from "../lib/vocab/index.js";
import { buildReviewPrompt } from "../lib/aiReview.ts";

const ITEM_BY_ID = new Map(VOCAB_ITEMS.map((item) => [item.id, item]));

/** 句動詞の後ろに置ける不変化詞（前置詞・副詞） */
const PARTICLES = new Set([
  "up", "down", "in", "out", "on", "off", "over", "through", "away", "back",
  "into", "onto", "around", "about", "after", "for", "with", "to", "by",
  "along", "across", "apart", "aside", "forward", "ahead", "together",
  "behind", "under", "against", "upon", "round", "past",
]);

function isVerbParticleShaped(target) {
  const words = target.trim().split(/\s+/);
  if (words.length < 2 || words.length > 3) return false;
  if (!/^[A-Za-z]+$/.test(words[0])) return false;
  return words.slice(1).every((w) => PARTICLES.has(w.toLowerCase()));
}

// ── データの整合性 ──────────────────────────────────────────────────────────

test("コロケーションのキーはすべて実在する単語のIDを指す", () => {
  const unknown = Object.keys(COLLOCATIONS).filter((id) => !ITEM_BY_ID.has(id));
  assert.deepEqual(unknown, [], `語彙に無いIDが残っている: ${unknown.join(", ")}`);
});

test("コロケーションが付くのは動詞＋不変化詞の語だけ", () => {
  const misfits = Object.keys(COLLOCATIONS).filter(
    (id) => !isVerbParticleShaped(ITEM_BY_ID.get(id).target),
  );
  assert.deepEqual(misfits, [], `句動詞ではない語に付いている: ${misfits.join(", ")}`);
});

test("コロケーションは短い英語で、括弧は含まない", () => {
  const invalid = [];
  for (const [id, collocation] of Object.entries(COLLOCATIONS)) {
    // 括弧はUI側が付ける。データに混ぜると二重になる
    if (/[[\]（）()]/.test(collocation)) invalid.push(`${id}: 括弧が入っている`);
    if (!/^[A-Za-z][A-Za-z' ]*[A-Za-z]$/.test(collocation)) {
      invalid.push(`${id}: 英字と空白以外が入っている ("${collocation}")`);
    }
    // 読ませる量が増えるほど1問あたりの負荷が上がる。目的語は短く保つ
    if (collocation.split(/\s+/).length > 4) invalid.push(`${id}: 語数が多すぎる`);
  }
  assert.deepEqual(invalid, [], invalid.join(" / "));
});

// ── 既存ユーザーの統計を壊さないこと ────────────────────────────────────────

test("コロケーションを足してもIDは target + 品詞のままで変わらない", () => {
  // 目的語をIDの材料にすると、付けた瞬間に既存ユーザーの正誤統計が
  // その単語から切り離される。IDの決まり方には触れないこと。
  for (const item of VOCAB_ITEMS) {
    if (!item.collocation) continue;
    assert.equal(item.id, toWordId(item.target, item.partOfSpeech));
    assert.ok(
      !item.id.includes(item.collocation.replace(/\s+/g, "-")),
      `${item.id} のIDに目的語が混ざっている`,
    );
  }
});

test("コロケーションを持つのは COLLOCATIONS に載っている語だけ", () => {
  for (const item of VOCAB_ITEMS) {
    if (COLLOCATIONS[item.id]) {
      assert.equal(item.collocation, COLLOCATIONS[item.id]);
    } else {
      assert.equal(item.collocation, undefined, `${item.id} に想定外の目的語が付いている`);
    }
  }
});

test("目的語を持たない語は今までどおり単体で出題される", () => {
  const severe = VOCAB_ITEMS.find((item) => item.id === "severe:adjective");
  assert.ok(severe);
  assert.equal(severe.collocation, undefined);
});

// ── AI判定のプロンプト ──────────────────────────────────────────────────────

test("目的語があるプロンプトは、その文脈での語義を尋ねる", () => {
  const prompt = buildReviewPrompt("摂取する", "take in", "nutrients");
  assert.match(prompt, /take in nutrients/);
  assert.match(prompt, /摂取する/);
  // 訳す対象はあくまで句動詞のほうで、目的語ではない
  assert.match(prompt, /における「take in」の日本語訳/);
});

test("目的語が無ければプロンプトは従来どおり単体で尋ねる", () => {
  const prompt = buildReviewPrompt("和らげる", "alleviate");
  assert.match(prompt, /英語「alleviate」の日本語訳/);
  assert.doesNotMatch(prompt, /における/);
});

test("空文字の目的語は無いものとして扱う", () => {
  // クライアントは目的語を持たない語でも collocation: "" を送ってくる
  assert.equal(
    buildReviewPrompt("和らげる", "alleviate", ""),
    buildReviewPrompt("和らげる", "alleviate"),
  );
  assert.equal(
    buildReviewPrompt("和らげる", "alleviate", "   "),
    buildReviewPrompt("和らげる", "alleviate"),
  );
});

// ── 目的語を添える語の訳語 ──────────────────────────────────────────────────

test("look into の訳は動詞の形で登録されている", () => {
  // 目的語を添えると「look into [the cause]」と動詞句で読ませることになる。
  // 訳が「調査」のような名詞のままだと、表示される正解が動詞句に対応しない。
  const item = VOCAB_ITEMS.find((v) => v.target === "look into");
  assert.ok(item);
  assert.equal(item.collocation, "the cause");
  assert.ok(!item.answers.includes("調査"));
  assert.ok(item.answers.includes("調査する"));
});
