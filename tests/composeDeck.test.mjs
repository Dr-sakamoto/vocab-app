import assert from "node:assert/strict";
import test from "node:test";

import { COMPOSE_PROMPTS, findPrompt } from "../lib/compose/prompts/index.js";
import { GRAMMAR_TAGS, isGrammarTagId } from "../lib/compose/grammarTags.js";

// 出題データの健全性を見張るテスト。
// 弱点分析はタグを単位に回るので、「定義されていないタグが付いている」
// 「そのタグの問題が1問しかない」といった穴があると、分析画面に
// 埋めようのない弱点が出る（出題できない弱点は行き止まりになる）。

test("問題IDが重複していない（IDは統計の保存キー）", () => {
  const ids = COMPOSE_PROMPTS.map((prompt) => prompt.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("すべての問題が定義済みのタグだけを持つ", () => {
  for (const prompt of COMPOSE_PROMPTS) {
    assert.ok(prompt.tags.length > 0, `${prompt.id} にタグが無い`);
    for (const tag of prompt.tags) {
      assert.ok(isGrammarTagId(tag), `${prompt.id} に未定義のタグ: ${tag}`);
    }
  }
});

test("どのタグにも十分な問題数がある（弱点と分かっても出す問題が無い状態を作らない）", () => {
  for (const tag of GRAMMAR_TAGS) {
    const count = COMPOSE_PROMPTS.filter((prompt) => prompt.tags.includes(tag.id)).length;
    assert.ok(count >= 3, `タグ「${tag.label}」の問題が ${count} 問しかない`);
  }
});

test("設問と模範解答がそろっている", () => {
  for (const prompt of COMPOSE_PROMPTS) {
    assert.ok(prompt.ja.trim().length > 0, `${prompt.id} の和文が空`);
    assert.ok(prompt.answers.length > 0, `${prompt.id} に模範解答が無い`);
    for (const answer of prompt.answers) {
      assert.ok(answer.trim().length > 0, `${prompt.id} に空の模範解答がある`);
      // 和文と英文の取り違え（向きを入れ替えて出す設計なので致命的になる）
      assert.ok(
        !/[ぁ-んァ-ヶ一-龠]/.test(answer),
        `${prompt.id} の模範解答に日本語が混ざっている: ${answer}`,
      );
    }
    assert.ok(
      /[ぁ-んァ-ヶ一-龠]/.test(prompt.ja),
      `${prompt.id} の和文に日本語が無い: ${prompt.ja}`,
    );
  }
});

test("模範解答が重複していない（同じ文を別解として並べない）", () => {
  for (const prompt of COMPOSE_PROMPTS) {
    const normalized = prompt.answers.map((answer) => answer.toLowerCase().trim());
    assert.equal(new Set(normalized).size, normalized.length, `${prompt.id} の別解が重複`);
  }
});

test("レベルは1〜3で、どのレベルにも十分な問題がある", () => {
  const counts = { 1: 0, 2: 0, 3: 0 };
  for (const prompt of COMPOSE_PROMPTS) {
    assert.ok([1, 2, 3].includes(prompt.level), `${prompt.id} のレベルが不正`);
    counts[prompt.level] += 1;
  }
  for (const level of [1, 2, 3]) {
    assert.ok(counts[level] >= 20, `レベル${level}が ${counts[level]} 問しかない`);
  }
});

test("findPrompt はIDで引ける／知らないIDには null を返す", () => {
  const first = COMPOSE_PROMPTS[0];
  assert.equal(findPrompt(first.id)?.id, first.id);
  assert.equal(findPrompt("no-such-prompt"), null);
});

test("タグの説明とヒントが全タグそろっている（分析画面はこれを読ませる）", () => {
  for (const tag of GRAMMAR_TAGS) {
    assert.ok(tag.label.length > 0, `${tag.id} に label が無い`);
    assert.ok(tag.description.length >= 10, `${tag.id} の description が短すぎる`);
    assert.ok(tag.hint.length >= 10, `${tag.id} の hint が短すぎる`);
  }
});
