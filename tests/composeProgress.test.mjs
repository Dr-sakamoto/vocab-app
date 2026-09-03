import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_PROGRESS,
  applyAttemptToProgress,
  normalizeProgress,
  normalizeSettings,
  summarizeProgress,
} from "../lib/compose/progress.js";
import { COMPOSE } from "../lib/compose/constants.js";

// 端末に貯める学習状態。壊れた保存値でもアプリが立ち上がることを保証する。

const NOW = Date.UTC(2026, 8, 1);

const attempt = (overrides = {}) => ({
  promptId: "b03",
  direction: "ja-to-en",
  question: "私はもう昼食を食べました。",
  input: "I already have eaten lunch.",
  answers: ["I have already had lunch."],
  tags: ["perfect"],
  score: 70,
  verdict: "close",
  corrected: "I have already eaten lunch.",
  feedback: "already の位置",
  good: "現在完了は選べています",
  tagJudgements: [{ id: "perfect", verdict: "shaky", note: "語順" }],
  hintUsed: false,
  answeredAt: NOW,
  ...overrides,
});

test("壊れた保存値は空の状態として読む", () => {
  assert.deepEqual(normalizeProgress(null), EMPTY_PROGRESS);
  assert.deepEqual(normalizeProgress("なにか"), EMPTY_PROGRESS);
  assert.deepEqual(normalizeProgress({ tags: 3, prompts: [], history: "x" }), EMPTY_PROGRESS);
});

test("定義されていないタグの統計は読み込みの時点で落とす", () => {
  const progress = normalizeProgress({
    tags: {
      perfect: { attempts: 3, ema: 70, passStreak: 1, missCount: 0 },
      "made-up-tag": { attempts: 5, ema: 20, passStreak: 0, missCount: 3 },
    },
  });
  assert.deepEqual(Object.keys(progress.tags), ["perfect"]);
});

test("1答案でタグ・問題・履歴・通算が同時に動く", () => {
  const next = applyAttemptToProgress(EMPTY_PROGRESS, attempt());
  assert.equal(next.tags.perfect.attempts, 1);
  assert.equal(next.prompts.b03.attempts, 1);
  assert.equal(next.prompts.b03.lastScore, 70);
  assert.equal(next.prompts.b03.passStreak, 0, "合格ライン未満で連続数は0のまま");
  assert.equal(next.history.length, 1);
  assert.equal(next.totalAttempts, 1);
  assert.equal(next.scoreSum, 70);
});

test("合格すると問題ごとの連続数が伸びる", () => {
  let progress = applyAttemptToProgress(EMPTY_PROGRESS, attempt({ score: 90 }));
  progress = applyAttemptToProgress(progress, attempt({ score: 95 }));
  assert.equal(progress.prompts.b03.passStreak, 2);
  assert.equal(progress.prompts.b03.bestScore, 95);
});

test("履歴は上限で打ち切る（増え続けない）", () => {
  let progress = EMPTY_PROGRESS;
  for (let i = 0; i < COMPOSE.HISTORY_LIMIT + 10; i += 1) {
    progress = applyAttemptToProgress(progress, attempt({ answeredAt: NOW + i }));
  }
  assert.equal(progress.history.length, COMPOSE.HISTORY_LIMIT);
  assert.equal(progress.totalAttempts, COMPOSE.HISTORY_LIMIT + 10, "通算は履歴と別に数える");
  assert.equal(progress.history[0].answeredAt, NOW + COMPOSE.HISTORY_LIMIT + 9, "新しい順");
});

test("平均点と直近の合格率を出せる", () => {
  let progress = applyAttemptToProgress(EMPTY_PROGRESS, attempt({ score: 100 }));
  progress = applyAttemptToProgress(progress, attempt({ score: 50 }));
  const summary = summarizeProgress(progress);
  assert.equal(summary.totalAttempts, 2);
  assert.equal(summary.averageScore, 75);
  assert.equal(summary.passRate, 50);
});

test("保存済みの答案を読み直しても中身が保たれる", () => {
  const saved = applyAttemptToProgress(EMPTY_PROGRESS, attempt());
  const restored = normalizeProgress(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(restored.history[0].tagJudgements, saved.history[0].tagJudgements);
  assert.equal(restored.tags.perfect.attempts, 1);
  assert.equal(restored.prompts.b03.lastScore, 70);
});

test("設定は想定内の値だけを受け付ける", () => {
  assert.equal(normalizeSettings({ setSize: 99 }).setSize, COMPOSE.DEFAULT_SET_SIZE);
  assert.equal(normalizeSettings({ setSize: 8 }).setSize, 8);
  assert.equal(normalizeSettings({ showHints: "yes" }).showHints, false);
  assert.equal(normalizeSettings({ showHints: true }).showHints, true);
});
