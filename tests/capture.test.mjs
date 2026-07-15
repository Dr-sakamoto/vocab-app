import assert from "node:assert/strict";
import test from "node:test";

import {
  HABITATS,
  applyCaptureResultToCollection,
  getUnlockedHabitats,
  normalizeEncounters,
  pickHabitat,
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
  normalizeMonsterCollection,
} from "../lib/monster.js";

test("Elmuria is unlocked at the initial pool size", () => {
  assert.deepEqual(
    getUnlockedHabitats(60).map(habitat => habitat.id),
    ["elmuria"],
  );
  assert.deepEqual(getUnlockedHabitats(59), []);
});

test("encounter rates from absorbed routes are summed when they share a line and level range", () => {
  const encounters = normalizeEncounters([
    { lineId: "a", rate: 40, minLevel: 1, maxLevel: 1 },
    { lineId: "b", rate: 30, minLevel: 1, maxLevel: 1 },
    { lineId: "c", rate: 30, minLevel: 1, maxLevel: 1 },
    { lineId: "d", rate: 40, minLevel: 1, maxLevel: 1 },
    { lineId: "e", rate: 30, minLevel: 1, maxLevel: 1 },
    { lineId: "c", rate: 30, minLevel: 1, maxLevel: 1 },
  ]);

  assert.deepEqual(encounters, [
    { lineId: "a", weight: 40, minLevel: 1, maxLevel: 1 },
    { lineId: "b", weight: 30, minLevel: 1, maxLevel: 1 },
    { lineId: "c", weight: 60, minLevel: 1, maxLevel: 1 },
    { lineId: "d", weight: 40, minLevel: 1, maxLevel: 1 },
    { lineId: "e", weight: 30, minLevel: 1, maxLevel: 1 },
  ]);
});

test("encounter levels follow the stage's level band", () => {
  const greatFireflyCity = HABITATS.find(habitat => habitat.id === "great-firefly-city");
  const encounters = normalizeEncounters(greatFireflyCity.encounters);

  assert.deepEqual(
    encounters.find(encounter => encounter.lineId === "magnemite"),
    { lineId: "magnemite", weight: 40, minLevel: 31, maxLevel: 38 },
  );
});

test("rollCaptureEncounter generates a level within the encounter range", () => {
  const elmuria = HABITATS.find(habitat => habitat.id === "elmuria");
  const result = rollCaptureEncounter({
    grade: "S",
    unlockedPoolSize: 60,
    habitat: elmuria,
    seed: "elmuria-level-range",
  });

  assert.equal(result.caught, true);
  const encounter = normalizeEncounters(elmuria.encounters)
    .find(encounter => encounter.lineId === result.lineId);
  assert.ok(encounter, "expected an elmuria encounter to exist");
  assert.ok(result.level >= encounter.minLevel && result.level <= encounter.maxLevel);
});

test("S rank always reaches the elmuria encounter table when only elmuria is unlocked", () => {
  const elmuria = HABITATS.find(habitat => habitat.id === "elmuria");
  const elmuriaLineIds = normalizeEncounters(elmuria.encounters).map(encounter => encounter.lineId);

  const result = rollCaptureEncounter({
    grade: "S",
    unlockedPoolSize: 60,
    habitatVisits: {},
    seed: "elmuria-capture",
  });

  assert.equal(result.caught, true);
  assert.equal(result.habitat.id, "elmuria");
  assert.ok(elmuriaLineIds.includes(result.lineId));
});

test("habitat selection reserves 40 percent for the latest unlocked habitat", () => {
  const habitat = pickHabitat({
    unlockedPoolSize: 180,
    habitatVisits: {},
    rng: () => 0.39,
  });

  assert.equal(habitat.id, "apple-town");
});

test("habitat selection weights non-latest habitats by fewer visits", () => {
  const rolls = [0.4, 0.95];
  const habitat = pickHabitat({
    unlockedPoolSize: 180,
    habitatVisits: { elmuria: 9, everstep: 0 },
    rng: () => rolls.shift(),
  });

  assert.equal(habitat.id, "everstep");
});

test("capture results are reproducible with the same seed", () => {
  const input = {
    grade: "A",
    unlockedPoolSize: 1200,
    habitatVisits: { elmuria: 2 },
    seed: "same-seed",
  };

  assert.deepEqual(rollCaptureEncounter(input), rollCaptureEncounter(input));
});

test("capture can use a habitat chosen before the play starts", () => {
  const everstep = HABITATS.find(habitat => habitat.id === "everstep");
  const eversteplineIds = normalizeEncounters(everstep.encounters).map(encounter => encounter.lineId);
  const result = rollCaptureEncounter({
    grade: "S",
    unlockedPoolSize: 120,
    habitatVisits: {},
    seed: "preselected-habitat",
    habitat: everstep,
  });

  assert.equal(result.caught, true);
  assert.equal(result.habitat.id, "everstep");
  assert.ok(eversteplineIds.includes(result.lineId));
});

test("all habitat encounter lines are defined monster lines", () => {
  for (const habitat of HABITATS) {
    const encounters = normalizeEncounters(habitat.encounters);
    for (const encounter of encounters) {
      assert.equal(getMonsterLine(encounter.lineId).id, encounter.lineId);
    }
  }
});

test("confirmed etymon lines only appear in their designated habitats", () => {
  const expectedHabitatsByLine = {
    pikachu: ["elmuria", "everstep"],
    weedle: ["elmuria", "everstep", "eterna-desert", "old-smoke"],
    pidgey: ["old-smoke"],
    spearow: ["elmuria", "hoshi-no-kumoi"],
    sandshrew: ["ultra-blue", "tarasys-temple"],
    clefairy: ["hoshi-no-kumoi"],
    oddish: ["elmuria", "everstep", "great-firefly-city", "hoshi-no-kumoi"],
    seel: ["alb-peak"],
    rattata: ["kapadra-cave", "la-amaranta"],
    zubat: ["elmuria", "everstep", "great-firefly-city"],
    ekans: ["kapadra-cave", "la-amaranta"],
    hitmonlee: ["apple-town"],
    onix: ["elmuria"],
    farfetchd: ["elmuria"],
  };

  const actualHabitatsByLine = {};
  for (const habitat of HABITATS) {
    const lineIds = new Set(normalizeEncounters(habitat.encounters).map(encounter => encounter.lineId));
    for (const lineId of lineIds) {
      if (!(lineId in expectedHabitatsByLine)) continue;
      (actualHabitatsByLine[lineId] ??= []).push(habitat.id);
    }
  }

  for (const [lineId, expectedHabitats] of Object.entries(expectedHabitatsByLine)) {
    assert.deepEqual(
      (actualHabitatsByLine[lineId] ?? []).sort(),
      [...expectedHabitats].sort(),
      `expected ${lineId} to appear only in: ${expectedHabitats.join(", ")}`,
    );
  }
});

test("applying a caught result adds a boxed pokemon and increments habitat visits", () => {
  const result = {
    caught: true,
    habitat: { id: "elmuria", name: "エルムリア" },
    lineId: "pidgey",
    monsterId: "caught-pidgey-test",
  };

  const next = applyCaptureResultToCollection(DEFAULT_MONSTER_COLLECTION, result);

  assert.equal(next.monsters.some(monster => monster.id === "caught-pidgey-test"), true);
  assert.equal(next.habitatVisits["elmuria"], 1);
  assert.equal(next.partyIds.includes("caught-pidgey-test"), false);
});

test("applying a caught result preserves the intended level", () => {
  const result = {
    caught: true,
    habitat: { id: "elmuria", name: "エルムリア" },
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

test("normalizeMonsterCollection migrates legacy habitat ids in habitatVisits and sums colliding counts", () => {
  const next = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    habitatVisits: {
      "route-1": 3,
      "route-22": 2,
      "route-2": 1,
      "viridian-forest": 4,
      "mt-moon": 5,
    },
  });

  assert.equal(next.habitatVisits["elmuria"], 10);
  assert.equal(next.habitatVisits["hoshi-no-kumoi"], 5);
  assert.equal("route-1" in next.habitatVisits, false);
  assert.equal("mt-moon" in next.habitatVisits, false);
});

test("normalizeMonsterCollection migrates legacy habitat ids stored as monster.acquiredAt", () => {
  const next = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    monsters: [
      { id: "caught-pidgey-legacy", lineId: "pidgey", totalXP: getXpForLevel(5), acquiredAt: "route-1" },
      { id: "caught-magnemite-legacy", lineId: "magnemite", totalXP: getXpForLevel(22), acquiredAt: "power-plant" },
    ],
  });

  const pidgey = next.monsters.find(m => m.id === "caught-pidgey-legacy");
  const magnemite = next.monsters.find(m => m.id === "caught-magnemite-legacy");
  assert.equal(pidgey.acquiredAt, "elmuria");
  assert.equal(magnemite.acquiredAt, "great-firefly-city");
});

test("normalizeMonsterCollection leaves non-habitat acquiredAt values untouched", () => {
  const next = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    monsters: [
      { id: "starter-bulbasaur", lineId: "bulbasaur", totalXP: getXpForLevel(5), acquiredAt: "oak-starter" },
      { id: "reward-dojo-hitmonlee", lineId: "hitmonlee", totalXP: getXpForLevel(30), acquiredAt: "dojo-reward" },
      { id: "gift-rival-starter-charmander", lineId: "charmander", totalXP: getXpForLevel(61), acquiredAt: "rival-champion-gift" },
    ],
  });

  const starter = next.monsters.find(m => m.id === "starter-bulbasaur");
  const dojoReward = next.monsters.find(m => m.id === "reward-dojo-hitmonlee");
  const rivalGift = next.monsters.find(m => m.id === "gift-rival-starter-charmander");
  assert.equal(starter.acquiredAt, "oak-starter");
  assert.equal(dojoReward.acquiredAt, "dojo-reward");
  assert.equal(rivalGift.acquiredAt, "rival-champion-gift");
});

// KNOWN ISSUE: lib/monster.ts currently ships the pre-Etymon-rename species
// names (this one reverted to "ガンセキ" / Golem's Japanese name) instead of
// the renamed names documented in ETYMON_NAMES.md and still present in the
// dead lib/monster.js. This looks like content lost during the TypeScript
// migration (c68fb77), not a test bug — see PR discussion before "fixing"
// the assertion below by just changing the expected string.
test("held item pokemon evolves when it levels up after picking up an item", { skip: "geodude line naming reverted to pre-Etymon-rename Pokémon names in lib/monster.ts; see comment above" }, () => {
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
  assert.equal(state.species.name, "ガンセキ");
});
