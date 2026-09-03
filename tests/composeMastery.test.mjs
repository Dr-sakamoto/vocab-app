import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_TAG_STAT,
  applyScoreToTagStat,
  buildTagProgressRows,
  getMastery,
  getTagWeight,
  getWeakTagIds,
  getWeakness,
} from "../lib/compose/mastery.js";
import { EMPTY_PROGRESS } from "../lib/compose/progress.js";

// 文法タグごとの習熟度。出題も分析も、この数字の上に乗っている。

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 1);

function statAfter(scores, verdicts = []) {
  let stat = undefined;
  scores.forEach((score, i) => {
    stat = applyScoreToTagStat(stat, score, verdicts[i], NOW - (scores.length - i) * DAY);
  });
  return stat;
}

test("答案が無いタグは中庸（50）として扱う", () => {
  assert.equal(getMastery(undefined), 50);
  assert.equal(getMastery(EMPTY_TAG_STAT), 50);
  assert.equal(getWeakness(undefined), 50);
});

test("1問できただけでは「得意」と判定しない（縮小推定）", () => {
  const stat = statAfter([100]);
  assert.ok(getMastery(stat) < 80, `1問100点で ${getMastery(stat)} まで上がっている`);
});

test("正解を重ねれば習熟度は上がっていく", () => {
  const series = [1, 2, 3, 5, 8].map((n) => getMastery(statAfter(Array(n).fill(100))));
  for (let i = 1; i < series.length; i += 1) {
    assert.ok(series[i] > series[i - 1], `習熟度が上がっていない: ${series.join(",")}`);
  }
  assert.ok(series.at(-1) >= 85);
});

test("直近を重く見る（昔の失点で「苦手」と言われ続けない）", () => {
  const improving = statAfter([20, 30, 90, 95, 100]);
  const declining = statAfter([100, 95, 90, 30, 20]);
  assert.ok(
    getMastery(improving) > getMastery(declining),
    `伸びている側が低い: ${getMastery(improving)} vs ${getMastery(declining)}`,
  );
});

test("AIのタグ判定はスコアより優先される（文全体は良くても狙いを外していれば下がる）", () => {
  const missed = statAfter([90], ["missed"]);
  const ok = statAfter([90], ["ok"]);
  assert.ok(getMastery(missed) < getMastery(ok));
  assert.equal(missed.missCount, 1);
  assert.equal(ok.missCount, 0);
});

test("合格が続くと連続数が伸び、落とすと0に戻る", () => {
  let stat = applyScoreToTagStat(undefined, 90, "ok", NOW);
  stat = applyScoreToTagStat(stat, 95, "ok", NOW);
  assert.equal(stat.passStreak, 2);
  stat = applyScoreToTagStat(stat, 40, "missed", NOW);
  assert.equal(stat.passStreak, 0);
});

test("弱いタグほど出題の重みが大きい", () => {
  const weak = getTagWeight(statAfter([20, 30, 25]), NOW);
  const strong = getTagWeight(statAfter([95, 100, 95]), NOW);
  const untouched = getTagWeight(undefined, NOW);
  assert.ok(weak > strong, `弱いタグが出にくい: ${weak} vs ${strong}`);
  assert.ok(untouched > strong, "未挑戦のタグが得意なタグより出にくい");
});

test("さっき解いたタグは沈み、間隔が空いたタグは浮く（分散学習）", () => {
  const scores = [95, 90, 95];
  const justNow = getTagWeight(
    applyScoreToTagStat(statAfter(scores), 95, "ok", NOW),
    NOW,
  );
  const longAgo = getTagWeight(
    applyScoreToTagStat(statAfter(scores), 95, "ok", NOW - 60 * DAY),
    NOW,
  );
  assert.ok(longAgo > justNow, `間隔が効いていない: ${longAgo} vs ${justNow}`);
});

test("分析の並びは「実測で弱い順 → 未挑戦」", () => {
  const progress = {
    ...EMPTY_PROGRESS,
    tags: {
      relative: statAfter([30, 25, 20]),
      articles: statAfter([95, 90, 100]),
    },
  };
  const rows = buildTagProgressRows(progress);
  assert.equal(rows[0].tag.id, "relative", "いちばん弱いタグが先頭に来ていない");
  assert.ok(rows.findIndex((r) => r.tag.id === "articles") < rows.findIndex((r) => r.untouched));
  assert.ok(rows.at(-1).untouched, "未挑戦のタグが最後に来ていない");
});

test("弱点特訓の母集団は実測で弱いタグだけ（未挑戦は含めない）", () => {
  const progress = {
    ...EMPTY_PROGRESS,
    tags: {
      relative: statAfter([30, 25, 20]),
      articles: statAfter([95, 90, 100]),
    },
  };
  const weak = getWeakTagIds(progress);
  assert.deepEqual(weak, ["relative"]);
});
