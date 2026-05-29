import assert from "node:assert/strict";
import test from "node:test";

import {
  HABITATS,
  applyCaptureResultToCollection,
  getUnlockedHabitats,
  normalizeVersionedEncounters,
  rollCaptureEncounter,
} from "../lib/capture.js";
import {
  DEFAULT_MONSTER_COLLECTION,
  getMonsterLine,
  getMonsterState,
  getItemEvolutionPickup,
  getItemEvolutionName,
  getXpForLevel,
  updatePartyXP,
  getMonsterDisplayState,
} from "../lib/monster.js";

test("Route 1 is unlocked at the initial pool size", () => {
  assert.deepEqual(
    getUnlockedHabitats(60).map(habitat => habitat.id),
    ["route-1"],
  );
  assert.deepEqual(getUnlockedHabitats(59), []);
});

test("version encounter rates are averaged by version", () => {
  const encounters = normalizeVersionedEncounters({
    fireRed: [
      { lineId: "a", rate: 40 },
      { lineId: "b", rate: 30 },
      { lineId: "c", rate: 30 },
    ],
    leafGreen: [
      { lineId: "d", rate: 40 },
      { lineId: "e", rate: 30 },
      { lineId: "c", rate: 30 },
    ],
  });

  assert.deepEqual(encounters, [
    { lineId: "a", weight: 20, minLevel: 1, maxLevel: 1 },
    { lineId: "b", weight: 15, minLevel: 1, maxLevel: 1 },
    { lineId: "c", weight: 30, minLevel: 1, maxLevel: 1 },
    { lineId: "d", weight: 20, minLevel: 1, maxLevel: 1 },
    { lineId: "e", weight: 15, minLevel: 1, maxLevel: 1 },
  ]);
});

test("encounter levels follow original FRLG ranges for later pools", () => {
  const powerPlant = HABITATS.find(habitat => habitat.id === "power-plant");
  const encounters = normalizeVersionedEncounters(powerPlant.versionEncounters, powerPlant.id);

  assert.deepEqual(
    encounters.find(encounter => encounter.lineId === "magnemite"),
    { lineId: "magnemite", weight: 30, minLevel: 22, maxLevel: 25 },
  );
});

test("rollCaptureEncounter generates a level within the encounter range", () => {
  const route1 = HABITATS.find(habitat => habitat.id === "route-1");
  const result = rollCaptureEncounter({
    grade: "S",
    unlockedPoolSize: 60,
    habitat: route1,
    seed: "route-1-level-range",
  });

  assert.equal(result.caught, true);
  const encounter = normalizeVersionedEncounters(route1.versionEncounters)
    .find(encounter => encounter.lineId === result.lineId);
  assert.ok(encounter, "expected route 1 encounter to exist");
  assert.ok(result.level >= encounter.minLevel && result.level <= encounter.maxLevel);
});

test("S rank always reaches the route 1 encounter table when only route 1 is unlocked", () => {
  const result = rollCaptureEncounter({
    grade: "S",
    unlockedPoolSize: 60,
    habitatVisits: {},
    seed: "route-1-capture",
  });

  assert.equal(result.caught, true);
  assert.equal(result.habitat.id, "route-1");
  assert.ok(["pidgey", "rattata"].includes(result.lineId));
});

test("capture results are reproducible with the same seed", () => {
  const input = {
    grade: "A",
    unlockedPoolSize: 1200,
    habitatVisits: { "route-1": 2 },
    seed: "same-seed",
  };

  assert.deepEqual(rollCaptureEncounter(input), rollCaptureEncounter(input));
});

test("capture can use a habitat chosen before the play starts", () => {
  const route2 = HABITATS.find(habitat => habitat.id === "route-2");
  const result = rollCaptureEncounter({
    grade: "S",
    unlockedPoolSize: 120,
    habitatVisits: {},
    seed: "preselected-habitat",
    habitat: route2,
  });

  assert.equal(result.caught, true);
  assert.equal(result.habitat.id, "route-2");
  assert.ok(["pidgey", "rattata", "caterpie", "weedle"].includes(result.lineId));
});

test("all habitat encounter lines are defined monster lines", () => {
  for (const habitat of HABITATS) {
    const encounters = normalizeVersionedEncounters(habitat.versionEncounters);
    for (const encounter of encounters) {
      assert.equal(getMonsterLine(encounter.lineId).id, encounter.lineId);
    }
  }
});

test("applying a caught result adds a boxed pokemon and increments habitat visits", () => {
  const result = {
    caught: true,
    habitat: { id: "route-1", name: "Route 1" },
    lineId: "pidgey",
    monsterId: "caught-pidgey-test",
  };

  const next = applyCaptureResultToCollection(DEFAULT_MONSTER_COLLECTION, result);

  assert.equal(next.monsters.some(monster => monster.id === "caught-pidgey-test"), true);
  assert.equal(next.habitatVisits["route-1"], 1);
  assert.equal(next.partyIds.includes("caught-pidgey-test"), false);
});

test("applying a caught result preserves the intended level", () => {
  const result = {
    caught: true,
    habitat: { id: "route-1", name: "Route 1" },
    lineId: "pidgey",
    monsterId: "caught-pidgey-level-test",
    level: 5,
  };

  const next = applyCaptureResultToCollection(DEFAULT_MONSTER_COLLECTION, result);
  const monster = next.monsters.find(m => m.id === "caught-pidgey-level-test");

  assert.ok(monster, "monster should be created");
  assert.equal(getMonsterState(monster.totalXP, monster.lineId).level, 5);
});

test("item evolution candidates can pick up an item and assign it to a party Pokemon", () => {
  const gravelerXPTarget = getXpForLevel(25);
  const collection = {
    ...DEFAULT_MONSTER_COLLECTION,
    partyIds: ["graveler-1", null, null, null, null, null],
    monsters: [
      { id: "graveler-1", lineId: "geodude", totalXP: gravelerXPTarget },
    ],
  };

  const itemPickup = getItemEvolutionPickup(collection, () => 0.01);
  assert.ok(itemPickup, "expected item pickup candidate");
  assert.equal(itemPickup.monsterId, "graveler-1");
  assert.equal(itemPickup.itemName, getItemEvolutionName(itemPickup.itemType));
});

test("item evolution pickup respects absolute item rarity for a single candidate", () => {
  const gravelerXPTarget = getXpForLevel(25);
  const collection = {
    ...DEFAULT_MONSTER_COLLECTION,
    partyIds: ["graveler-1", null, null, null, null, null],
    monsters: [
      { id: "graveler-1", lineId: "geodude", totalXP: gravelerXPTarget },
    ],
  };

  const itemPickup = getItemEvolutionPickup(collection, () => 0.1);
  assert.equal(itemPickup, null, "expected no item pickup when a rarer absolute item type is selected");
});

test("item evolution pickup chooses across eligible item types by absolute rarity", () => {
  const fireTarget = getXpForLevel(1);
  const cableTarget = getXpForLevel(25);
  const collection = {
    ...DEFAULT_MONSTER_COLLECTION,
    partyIds: ["vulpix-1", "graveler-1", null, null, null, null],
    monsters: [
      { id: "vulpix-1", lineId: "vulpix", totalXP: fireTarget },
      { id: "graveler-1", lineId: "geodude", totalXP: cableTarget },
    ],
  };

  const itemPickup = getItemEvolutionPickup(collection, () => 0.1);
  assert.ok(itemPickup, "expected an item pickup candidate");
  assert.equal(itemPickup.itemName, getItemEvolutionName("fire"));
  assert.equal(itemPickup.itemType, "fire");
  assert.equal(itemPickup.monsterId, "vulpix-1");
});

test("applying an item pickup result assigns a held item to the selected monster", () => {
  const gravelerXPTarget = getXpForLevel(25);
  const collection = {
    ...DEFAULT_MONSTER_COLLECTION,
    partyIds: ["graveler-1", null, null, null, null, null],
    monsters: [
      { id: "graveler-1", lineId: "geodude", totalXP: gravelerXPTarget },
    ],
  };
  const result = {
    caught: false,
    reason: "item-drop",
    itemPickup: {
      monsterId: "graveler-1",
      itemType: "cable",
      itemName: "つうしんケーブル",
    },
  };

  const next = applyCaptureResultToCollection(collection, result);
  const monster = next.monsters.find(m => m.id === "graveler-1");

  assert.ok(monster, "monster should still exist");
  assert.equal(monster.heldItemType, "cable");
  assert.equal(monster.heldItemName, "つうしんケーブル");
});

test("held item pokemon evolves when it levels up after picking up an item", () => {
  const initialXP = getXpForLevel(25);
  const collection = {
    ...DEFAULT_MONSTER_COLLECTION,
    activeId: "graveler-1",
    partyIds: ["graveler-1", null, null, null, null, null],
    monsters: [
      {
        id: "graveler-1",
        lineId: "geodude",
        totalXP: initialXP,
        heldItemType: "cable",
        heldItemName: "つうしんケーブル",
      },
    ],
  };

  const updated = updatePartyXP(collection, 12500);
  const monster = updated.monsters.find(m => m.id === "graveler-1");
  const state = getMonsterDisplayState(monster);

  assert.equal(monster.heldItemType, null);
  assert.equal(monster.heldItemName, null);
  assert.equal(state.species.name, "ゴローニャ");
});
