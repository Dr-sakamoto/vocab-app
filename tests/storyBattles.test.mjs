import assert from "node:assert/strict";
import test from "node:test";

import { getPoolUnlockStepWithBossGate } from "../lib/battleSession.js";
import {
  canUseMasterBall,
  DEFAULT_STORY_PROGRESS,
  getBattlePlayLimit,
  getBattleProgressAccuracy,
  getOpponentPokemonIndex,
  getPoolUnlockBlocker,
  getStartScreenBattle,
  getTrainerSprite,
  isBattleWon,
  normalizeStoryProgress,
  pickNextBattleTrigger,
  resolveBattleDefeat,
  resolveBattleVictory,
  setPendingChallenge,
  startBattleSession,
  syncRetroactiveBattles,
} from "../lib/storyBattles.js";

function makeBattle(party, tier = "normal") {
  return {
    id: "test-battle",
    name: "テスト",
    location: "テスト場所",
    tier,
    minPool: 0,
    party,
  };
}

test("battle progress accuracy is based on play limit", () => {
  assert.equal(getBattleProgressAccuracy(0, 10), 0);
  assert.equal(getBattleProgressAccuracy(3, 10), 0.3);
  assert.equal(getBattleProgressAccuracy(4, 10), 0.4);
  assert.equal(getBattleProgressAccuracy(5, 0), 0);
});

test("rival battle triggers at route-1 pool milestone", () => {
  const battle = pickNextBattleTrigger(DEFAULT_STORY_PROGRESS, {
    unlockedPoolSize: 60,
    habitatId: "route-1",
  });
  assert.equal(battle?.id, "rival-1");
});

test("boss battle blocks pool unlock until defeated", () => {
  const progress = normalizeStoryProgress({
    ...DEFAULT_STORY_PROGRESS,
    defeated: { "rival-1": true },
    pendingChallengeId: "brock",
  });
  const blocker = getPoolUnlockBlocker(progress, 150);
  assert.equal(blocker?.id, "brock");
  const step = getPoolUnlockStepWithBossGate(10, 10, progress, 120);
  assert.equal(step, 0);
});

test("trainer battle uses higher play limits for endurance fights", () => {
  const battle = pickNextBattleTrigger(
    normalizeStoryProgress({
      ...DEFAULT_STORY_PROGRESS,
      defeated: { morty: true, zapdos: true },
    }),
    { unlockedPoolSize: 1080, habitatId: "power-plant" },
  );
  assert.equal(battle?.id, "voltorb-trap");
  assert.equal(getBattlePlayLimit(battle), 80);
});

test("battle victory awards badges and clears pending challenge", () => {
  const active = startBattleSession(
    normalizeStoryProgress({ ...DEFAULT_STORY_PROGRESS, defeated: { "rival-1": true } }),
    "brock",
  );
  const result = resolveBattleVictory(active, "brock", { monsters: [] }, { poolSize: 150 });
  assert.equal(result.progress.defeated.brock, true);
  assert.equal(result.progress.badges.includes("グレー"), true);
  assert.equal(result.progress.pendingChallengeId, null);
});

test("battle defeat relocates optional trainers but keeps boss pending", () => {
  const progress = startBattleSession(DEFAULT_STORY_PROGRESS, "rocket-scout");
  const defeat = resolveBattleDefeat(progress, "rocket-scout", { habitatId: "route-24" });
  assert.equal(defeat.progress.pendingChallengeId, null);
  assert.equal(defeat.relocatedHabitatId, "route-24");

  const bossDefeat = resolveBattleDefeat(progress, "brock", { habitatId: "route-2" });
  assert.equal(bossDefeat.progress.pendingChallengeId, "brock");
  assert.equal(bossDefeat.persistsOnStart, true);
});

test("start screen shows pending boss challenge", () => {
  const progress = setPendingChallenge(DEFAULT_STORY_PROGRESS, "misty");
  const battle = getStartScreenBattle(progress);
  assert.equal(battle?.id, "misty");
});

test("battle win accuracy respects tier", () => {
  const battle = pickNextBattleTrigger(DEFAULT_STORY_PROGRESS, { unlockedPoolSize: 120 });
  assert.equal(isBattleWon(6, 10, battle), true);
  assert.equal(isBattleWon(5, 10, battle), false);
});

test("retroactive sync queues the first undefeated required battle", () => {
  const synced = syncRetroactiveBattles(DEFAULT_STORY_PROGRESS, { unlockedPoolSize: 480 });
  assert.equal(synced.pendingChallengeId, "rival-1");

  const afterRival = syncRetroactiveBattles(
    normalizeStoryProgress({ ...DEFAULT_STORY_PROGRESS, defeated: { "rival-1": true } }),
    { unlockedPoolSize: 480 },
  );
  assert.equal(afterRival.pendingChallengeId, "brock");
});

test("trainer sprites resolve for major battles", () => {
  const brock = pickNextBattleTrigger(
    normalizeStoryProgress({ ...DEFAULT_STORY_PROGRESS, defeated: { "rival-1": true } }),
    { unlockedPoolSize: 120 },
  );
  assert.match(getTrainerSprite(brock), /trainers\/brock\.png$/);
});

test("master ball availability follows inventory flags", () => {
  assert.equal(canUseMasterBall({ masterBall: true, usedMasterBall: false }), true);
  assert.equal(canUseMasterBall({ masterBall: false, usedMasterBall: false }), false);
  assert.equal(canUseMasterBall({ masterBall: true, usedMasterBall: true }), false);
});
