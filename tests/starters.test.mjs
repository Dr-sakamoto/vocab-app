import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_STORY_PROGRESS, resolveBattleVictory } from "../lib/storyBattles.js";
import {
  applyStarterChoice,
  awardMissingProfessorStarters,
  awardRivalStarterSeed,
  collectionHasLineId,
  migrateStarterState,
  resolveBattleForProgress,
  RIVAL_COUNTER_STARTER,
  RIVAL_STARTER_MARKER,
} from "../lib/starters.js";
import { getBattleById } from "../lib/storyBattles.js";
import {
  createMonsterInstance,
  DEFAULT_MONSTER_COLLECTION,
  normalizeMonsterCollection,
} from "../lib/monster.js";

const LEGACY_STARTER_COLLECTION = normalizeMonsterCollection({
  ...DEFAULT_MONSTER_COLLECTION,
  activeId: "starter-charmander",
  partyIds: ["starter-charmander", "starter-squirtle", "starter-bulbasaur", null, null, null],
  monsters: [
    { id: "starter-charmander", lineId: "charmander", totalXP: 0 },
    { id: "starter-squirtle", lineId: "squirtle", totalXP: 0 },
    { id: "starter-bulbasaur", lineId: "bulbasaur", totalXP: 0 },
  ],
});

test("starter choice assigns counter rival and grants one pokemon", () => {
  const { collection, progress } = applyStarterChoice(
    DEFAULT_MONSTER_COLLECTION,
    DEFAULT_STORY_PROGRESS,
    "charmander",
  );
  assert.equal(progress.chosenStarterLineId, "charmander");
  assert.equal(progress.rivalStarterLineId, "squirtle");
  assert.equal(collection.monsters.length, 1);
  assert.equal(collection.monsters[0].lineId, "charmander");
  assert.equal(collection.activeId, "starter-charmander");
});

test("rival battles resolve starter slot from progress", () => {
  const progress = {
    ...DEFAULT_STORY_PROGRESS,
    chosenStarterLineId: "bulbasaur",
    rivalStarterLineId: "charmander",
  };
  const battle = resolveBattleForProgress(getBattleById("rival-1"), progress);
  assert.equal(battle.party.length, 1);
  assert.equal(battle.party[0].lineId, "charmander");
  assert.equal(battle.party[0].level, 5);
});

test("legacy users with all starters get random rival assignment", () => {
  const { progress } = migrateStarterState(LEGACY_STARTER_COLLECTION, DEFAULT_STORY_PROGRESS, {
    rng: () => 0,
  });
  assert.equal(progress.chosenStarterLineId, "charmander");
  assert.equal(progress.rivalStarterLineId, "bulbasaur");
});

test("champion victory awards rival starter seed at level 5", () => {
  const progress = {
    ...DEFAULT_STORY_PROGRESS,
    chosenStarterLineId: "charmander",
    rivalStarterLineId: "squirtle",
  };
  const collection = applyStarterChoice(DEFAULT_MONSTER_COLLECTION, progress, "charmander").collection;
  const result = resolveBattleVictory(progress, "champion-rival", collection, { poolSize: 2000 });
  assert.equal(collectionHasLineId(result.collection, "squirtle"), true);
  assert.equal(
    result.rewards.some(reward => reward.message.includes("ゼニガメ")),
    true,
  );
});

test("professor send after hall of fame awards missing starters once", () => {
  const progress = {
    ...DEFAULT_STORY_PROGRESS,
    chosenStarterLineId: "charmander",
    rivalStarterLineId: "squirtle",
    hallOfFame: true,
  };
  const collection = applyStarterChoice(DEFAULT_MONSTER_COLLECTION, progress, "charmander").collection;
  const first = awardMissingProfessorStarters(collection, progress);
  assert.equal(collectionHasLineId(first.collection, "bulbasaur"), true);
  assert.equal(collectionHasLineId(first.collection, "squirtle"), true);
  assert.equal(first.progress.professorStartersAwarded, true);

  const second = awardMissingProfessorStarters(first.collection, first.progress);
  assert.equal(second.awarded.length, 0);
});

test("rival counter map follows type advantage triangle", () => {
  assert.equal(RIVAL_COUNTER_STARTER.charmander, "squirtle");
  assert.equal(RIVAL_COUNTER_STARTER.squirtle, "bulbasaur");
  assert.equal(RIVAL_COUNTER_STARTER.bulbasaur, "charmander");
});

test("rival marker replaces starter slots in later battles", () => {
  const progress = {
    ...DEFAULT_STORY_PROGRESS,
    rivalStarterLineId: "squirtle",
  };
  const battle = resolveBattleForProgress(getBattleById("rival-5"), progress);
  const starterSlot = battle.party.find(slot => slot.lineId === "squirtle");
  assert.ok(starterSlot);
  assert.equal(starterSlot.level, 25);
  assert.equal(
    getBattleById("rival-5").party.some(slot => slot.lineId === RIVAL_STARTER_MARKER),
    true,
  );
});
