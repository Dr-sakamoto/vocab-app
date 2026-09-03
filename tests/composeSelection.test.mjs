import assert from "node:assert/strict";
import test from "node:test";

import { buildPromptWeights, pickSession } from "../lib/compose/selection.js";
import { applyScoreToTagStat } from "../lib/compose/mastery.js";
import { EMPTY_PROGRESS } from "../lib/compose/progress.js";
import { COMPOSE } from "../lib/compose/constants.js";
import { COMPOSE_PROMPTS } from "../lib/compose/prompts/index.js";

// 「苦手な文法から出る」というアプリの主張が、実際に重みへ現れているかを見張る。

const NOW = Date.UTC(2026, 8, 1);
const DAY = 86_400_000;

/** 乱数を固定して抽選を再現可能にする */
const sequence = (values) => {
  let i = 0;
  return () => values[i++ % values.length];
};

function progressWithTag(tagId, scores) {
  let stat;
  for (const score of scores) stat = applyScoreToTagStat(stat, score, undefined, NOW - DAY * 10);
  return { ...EMPTY_PROGRESS, tags: { [tagId]: stat }, totalAttempts: scores.length, scoreSum: scores.reduce((a, b) => a + b, 0) };
}

test("苦手なタグを含む問題のほうが重い", () => {
  const progress = progressWithTag("relative", [20, 25, 30]);
  const weights = buildPromptWeights({ progress, mode: "compose", now: NOW });

  const withWeak = weights.filter((w) => w.prompt.tags.includes("relative"));
  const withoutWeak = weights.filter((w) => !w.prompt.tags.includes("relative"));
  const avg = (list) => list.reduce((sum, w) => sum + w.weight, 0) / list.length;

  assert.ok(withWeak.length > 0);
  assert.ok(
    avg(withWeak) > avg(withoutWeak),
    `苦手タグの問題が重くない: ${avg(withWeak)} vs ${avg(withoutWeak)}`,
  );
});

test("弱点特訓では弱いタグを含む問題だけが候補になる", () => {
  const progress = progressWithTag("relative", [20, 25, 30]);
  const weights = buildPromptWeights({ progress, mode: "weakness", now: NOW });
  assert.ok(weights.length > 0);
  for (const { prompt } of weights) {
    assert.ok(prompt.tags.includes("relative"), `${prompt.id} が弱点と無関係`);
  }
});

test("弱点がまだ測れていないときは通常の出題へ落とす（行き止まりを作らない）", () => {
  const weights = buildPromptWeights({ progress: EMPTY_PROGRESS, mode: "weakness", now: NOW });
  assert.equal(weights.length, COMPOSE_PROMPTS.length);
});

test("直近に高得点で解いた問題は沈む", () => {
  const base = {
    ...EMPTY_PROGRESS,
    prompts: { b01: { attempts: 1, bestScore: 100, lastScore: 100, lastAnswered: NOW - 3600_000, passStreak: 1 } },
  };
  const weights = buildPromptWeights({ progress: base, mode: "compose", now: NOW });
  const solved = weights.find((w) => w.prompt.id === "b01").weight;
  const fresh = weights.find((w) => w.prompt.id === "b02").weight;
  assert.ok(solved < fresh, `直近に解いた問題が沈んでいない: ${solved} vs ${fresh}`);
});

test("落とした問題は次のセッションで戻ってくる", () => {
  const failed = {
    ...EMPTY_PROGRESS,
    prompts: { b01: { attempts: 1, bestScore: 30, lastScore: 30, lastAnswered: NOW - 5 * DAY, passStreak: 0 } },
  };
  const passed = {
    ...EMPTY_PROGRESS,
    prompts: { b01: { attempts: 1, bestScore: 100, lastScore: 100, lastAnswered: NOW - 5 * DAY, passStreak: 1 } },
  };
  const weightOf = (progress) =>
    buildPromptWeights({ progress, mode: "compose", now: NOW }).find((w) => w.prompt.id === "b01").weight;
  assert.ok(weightOf(failed) > weightOf(passed));
});

test("1セッションに同じ問題は入らない", () => {
  const picked = pickSession({
    progress: EMPTY_PROGRESS,
    mode: "compose",
    setSize: 8,
    now: NOW,
    random: sequence([0.1, 0.9, 0.3, 0.7, 0.5, 0.2, 0.8, 0.4]),
  });
  assert.equal(picked.length, 8);
  assert.equal(new Set(picked.map((p) => p.id)).size, 8);
});

test("同じタグばかりのセットにならない", () => {
  const progress = progressWithTag("relative", [10, 15, 10]);
  const picked = pickSession({
    progress,
    mode: "weakness",
    setSize: 5,
    now: NOW,
    random: sequence([0.05, 0.25, 0.45, 0.65, 0.85]),
  });
  const counts = new Map();
  for (const prompt of picked) {
    for (const tag of prompt.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  for (const [tag, count] of counts) {
    assert.ok(
      count <= COMPOSE.MAX_SAME_TAG_PER_SET,
      `タグ ${tag} が ${count} 問（上限 ${COMPOSE.MAX_SAME_TAG_PER_SET}）`,
    );
  }
});

test("候補が問題数に足りなくても、あるだけ返す（空セッションにしない）", () => {
  const picked = pickSession({
    progress: EMPTY_PROGRESS,
    mode: "compose",
    setSize: 5,
    now: NOW,
    prompts: COMPOSE_PROMPTS.slice(0, 2),
    random: sequence([0.5]),
  });
  assert.equal(picked.length, 2);
});
