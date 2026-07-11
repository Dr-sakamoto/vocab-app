import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAnswerToMissions,
  areAllMissionsDone,
  generateMissions,
  getMissionCountForLevel,
  isNewWordStat,
  isWeakWordStat,
  normalizeMission,
} from "../lib/missions.js";

function makeRng(seedValues) {
  let i = 0;
  return () => {
    const value = seedValues[i % seedValues.length];
    i += 1;
    return value;
  };
}

const baseEvent = {
  correct: true,
  wasWeakWord: false,
  wasNewWord: false,
  streak: 1,
  partyLineIds: [],
  partyMaxLevel: 10,
};

test("苦手単語判定: 間違いがあり正解貯金が薄い単語だけを苦手とみなす", () => {
  assert.equal(isWeakWordStat({ correct: 0, wrong: 1 }), true);
  assert.equal(isWeakWordStat({ correct: 2, wrong: 1 }), true);
  assert.equal(isWeakWordStat({ correct: 3, wrong: 1 }), false);
  assert.equal(isWeakWordStat({ correct: 5, wrong: 0 }), false);
  assert.equal(isWeakWordStat(undefined), false);
});

test("新出単語判定: 挑戦0回のみ新出", () => {
  assert.equal(isNewWordStat({ correct: 0, wrong: 0 }), true);
  assert.equal(isNewWordStat({ correct: 1, wrong: 0 }), false);
  assert.equal(isNewWordStat(undefined), true);
});

test("ミッション数はレベルに応じて増える", () => {
  assert.equal(getMissionCountForLevel(1), 2);
  assert.equal(getMissionCountForLevel(20), 3);
  assert.equal(getMissionCountForLevel(45), 4);
});

test("生成: 挑戦数ミッションを必ず含み、タイプは重複しない", () => {
  for (const level of [1, 10, 25, 50]) {
    const missions = generateMissions({
      level,
      ownedLineIds: ["bulbasaur", "pikachu"],
      partyMaxLevel: 12,
      rng: makeRng([0.3, 0.7, 0.1, 0.9, 0.5]),
    });
    assert.equal(missions.length, getMissionCountForLevel(level));
    assert.ok(missions.some((m) => m.type === "attempts"));
    const types = missions.map((m) => m.type);
    assert.equal(new Set(types).size, types.length);
    for (const mission of missions) {
      assert.ok(mission.goal >= 1);
      assert.equal(mission.progress, 0);
      assert.equal(mission.done, false);
      assert.ok(mission.label.length > 0);
    }
  }
});

test("生成: 所持エティモンがいなければ party-etymon は積まれない", () => {
  for (let seed = 0; seed < 20; seed++) {
    const missions = generateMissions({
      level: 50,
      ownedLineIds: [],
      partyMaxLevel: 0,
      rng: makeRng([seed / 20, 0.5, 0.25]),
    });
    assert.ok(!missions.some((m) => m.type === "party-etymon"));
    assert.ok(!missions.some((m) => m.type === "party-level"));
  }
});

test("生成: party-level の必要レベルは手持ちで達成可能な値に収まる", () => {
  for (let seed = 0; seed < 30; seed++) {
    const missions = generateMissions({
      level: 60,
      ownedLineIds: ["bulbasaur"],
      partyMaxLevel: 8,
      rng: makeRng([seed / 30, 0.9, 0.2, 0.6]),
    });
    for (const mission of missions) {
      if (mission.type === "party-level") {
        assert.ok(mission.minLevel <= 8, `minLevel=${mission.minLevel}`);
        assert.ok(mission.minLevel >= 2);
      }
    }
  }
});

test("進行: 挑戦数は正誤問わず進み、苦手/新出は正解時のみ進む", () => {
  const missions = [
    { id: "a", type: "attempts", label: "挑戦", goal: 2, progress: 0, done: false },
    { id: "w", type: "weak-word", label: "苦手", goal: 1, progress: 0, done: false },
    { id: "n", type: "new-word", label: "新出", goal: 1, progress: 0, done: false },
  ];

  const wrongAnswer = applyAnswerToMissions(missions, {
    ...baseEvent,
    correct: false,
    wasWeakWord: true,
    wasNewWord: true,
    streak: 0,
  });
  assert.equal(wrongAnswer.missions[0].progress, 1);
  assert.equal(wrongAnswer.missions[1].progress, 0);
  assert.equal(wrongAnswer.missions[2].progress, 0);
  assert.equal(wrongAnswer.completedNow.length, 0);

  const correctAnswer = applyAnswerToMissions(wrongAnswer.missions, {
    ...baseEvent,
    wasWeakWord: true,
    wasNewWord: true,
  });
  assert.equal(correctAnswer.missions[0].progress, 2);
  assert.equal(correctAnswer.missions[0].done, true);
  assert.equal(correctAnswer.missions[1].done, true);
  assert.equal(correctAnswer.missions[2].done, true);
  assert.equal(correctAnswer.completedNow.length, 3);
});

test("進行: 連続正解ミッションは最高到達を保持し、途切れても戻らない", () => {
  let missions = [
    { id: "s", type: "streak", label: "連続", goal: 3, progress: 0, done: false },
  ];
  missions = applyAnswerToMissions(missions, { ...baseEvent, streak: 2 }).missions;
  assert.equal(missions[0].progress, 2);
  missions = applyAnswerToMissions(missions, {
    ...baseEvent,
    correct: false,
    streak: 0,
  }).missions;
  assert.equal(missions[0].progress, 2);
  missions = applyAnswerToMissions(missions, { ...baseEvent, streak: 3 }).missions;
  assert.equal(missions[0].done, true);
});

test("進行: パーティ条件ミッションは編成が合致したときだけ進む", () => {
  const missions = [
    {
      id: "e",
      type: "party-etymon",
      label: "指定",
      goal: 1,
      progress: 0,
      done: false,
      lineId: "pikachu",
    },
    {
      id: "l",
      type: "party-level",
      label: "レベル",
      goal: 1,
      progress: 0,
      done: false,
      minLevel: 15,
    },
  ];

  const miss = applyAnswerToMissions(missions, {
    ...baseEvent,
    partyLineIds: ["bulbasaur"],
    partyMaxLevel: 10,
  });
  assert.equal(miss.missions[0].progress, 0);
  assert.equal(miss.missions[1].progress, 0);

  const hit = applyAnswerToMissions(missions, {
    ...baseEvent,
    partyLineIds: ["pikachu"],
    partyMaxLevel: 20,
  });
  assert.equal(hit.missions[0].done, true);
  assert.equal(hit.missions[1].done, true);
});

test("全達成判定: 空配列は未達成扱い", () => {
  assert.equal(areAllMissionsDone([]), false);
  assert.equal(
    areAllMissionsDone([
      { id: "a", type: "attempts", label: "", goal: 1, progress: 1, done: true },
    ]),
    true,
  );
});

test("normalizeMission: 壊れたデータは捨て、進捗はゴールに丸める", () => {
  assert.equal(normalizeMission(null), null);
  assert.equal(normalizeMission({ id: "x", type: "bogus", label: "a", goal: 1 }), null);
  assert.equal(normalizeMission({ id: "x", type: "attempts", label: "a", goal: 0 }), null);

  const restored = normalizeMission({
    id: "m-attempts",
    type: "attempts",
    label: "問題に10回挑戦する",
    goal: 10,
    progress: 99,
    done: false,
  });
  assert.equal(restored.progress, 10);
  assert.equal(restored.done, true);
});
