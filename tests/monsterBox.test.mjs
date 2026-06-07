import assert from "node:assert/strict";
import test from "node:test";

import { getHabitatMinPoolMap } from "../lib/capture.js";
import {
  BOX_LIMIT,
  DEFAULT_MONSTER_COLLECTION,
  awardEligibleGiftMonsters,
  claimFossilGift,
  createMonsterInstance,
  getBoxCount,
  getBoxMonsters,
  getMonsterDisplayState,
  getPendingFossilGift,
  getTotalProfessorTransfers,
  getXpForLevel,
  normalizeMonsterCollection,
  sendMonstersToProfessor,
  sortBoxMonsters,
} from "../lib/monster.js";

const habitatMinPools = getHabitatMinPoolMap();

test("box limit is 500", () => {
  assert.equal(BOX_LIMIT, 500);
});

test("normalizes professor transfer counts", () => {
  const normalized = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    professorTransfers: {
      pidgey: 2,
      rattata: "3",
    },
  });

  assert.deepEqual(normalized.professorTransfers, { pidgey: 2, rattata: 3 });
});

test("sending boxed monsters to professor removes only boxed selections and records counts", () => {
  const boxedPidgey = createMonsterInstance({ id: "box-pidgey", lineId: "pidgey" });
  const boxedRattata = createMonsterInstance({ id: "box-rattata", lineId: "rattata" });
  const partyBulbasaur = DEFAULT_MONSTER_COLLECTION.monsters.find(monster => monster.id === "starter-bulbasaur");
  const collection = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    monsters: [
      ...DEFAULT_MONSTER_COLLECTION.monsters,
      boxedPidgey,
      boxedRattata,
    ],
  });

  const next = sendMonstersToProfessor(collection, [
    boxedPidgey.id,
    boxedRattata.id,
    partyBulbasaur.id,
  ]);

  assert.equal(getBoxMonsters(next).some(monster => monster.id === boxedPidgey.id), false);
  assert.equal(getBoxMonsters(next).some(monster => monster.id === boxedRattata.id), false);
  assert.equal(next.monsters.some(monster => monster.id === partyBulbasaur.id), true);
  assert.deepEqual(next.professorTransfers, { pidgey: 1, rattata: 1 });
});

test("total professor transfers are counted across species", () => {
  const normalized = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    professorTransfers: {
      pidgey: 49,
      rattata: 1,
    },
  });

  assert.equal(getTotalProfessorTransfers(normalized), 50);
});

test("professor transfer gifts are awarded once at thresholds", () => {
  const collection = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    professorTransfers: {
      pidgey: 50,
    },
  });

  const first = awardEligibleGiftMonsters(collection, { trigger: "professor-transfer" });
  const second = awardEligibleGiftMonsters(first.collection, { trigger: "professor-transfer" });
  const farfetchd = first.collection.monsters.find(monster => monster.id === "gift-professor-farfetchd-50");

  assert.equal(first.awarded.map(gift => gift.lineId).includes("farfetchd"), true);
  assert.equal(Boolean(first.collection.giftClaims["professor-farfetchd-50"]), true);
  assert.equal(getMonsterDisplayState(farfetchd).level, 20);
  assert.equal(second.awarded.length, 0);
});

test("professor transfer gifts are awarded at higher thresholds too", () => {
  const base = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    professorTransfers: {
      pidgey: 100,
    },
  });

  const result100 = awardEligibleGiftMonsters({
    ...base,
    giftClaims: { "professor-farfetchd-50": true },
  }, { trigger: "professor-transfer" });

  assert.equal(result100.awarded.map(gift => gift.lineId).includes("mr-mime"), true);
  assert.equal(Boolean(result100.collection.giftClaims["professor-mr-mime-100"]), true);

  const result120 = awardEligibleGiftMonsters({
    ...result100.collection,
    professorTransfers: { pidgey: 120 },
  }, { trigger: "professor-transfer" });

  assert.equal(result120.awarded.map(gift => gift.lineId).includes("lickitung"), true);
  assert.equal(Boolean(result120.collection.giftClaims["professor-lickitung-120"]), true);

  const result150 = awardEligibleGiftMonsters({
    ...result120.collection,
    professorTransfers: { pidgey: 150 },
  }, { trigger: "professor-transfer" });

  assert.equal(result150.awarded.map(gift => gift.lineId).includes("jynx"), true);
  assert.equal(Boolean(result150.collection.giftClaims["professor-jynx-150"]), true);
});

test("pool gifts are awarded when the original-route milestone is reached", () => {
  const result = awardEligibleGiftMonsters(DEFAULT_MONSTER_COLLECTION, {
    unlockedPoolSize: habitatMinPools["route-7"],
    trigger: "pool",
    habitatMinPools,
  });

  assert.deepEqual(result.awarded.map(gift => gift.lineId), ["eevee", "porygon"]);
  assert.equal(result.collection.monsters.some(monster => monster.id === "gift-celadon-eevee"), true);
  assert.equal(result.collection.monsters.some(monster => monster.id === "gift-celadon-porygon"), true);
});

test("pool gifts are awarded for later story milestones", () => {
  const result960 = awardEligibleGiftMonsters({
    ...DEFAULT_MONSTER_COLLECTION,
    giftClaims: {
      "celadon-eevee": true,
      "celadon-porygon": true,
    },
  }, {
    unlockedPoolSize: habitatMinPools["pokemon-tower"],
    trigger: "pool",
    habitatMinPools,
  });

  assert.equal(result960.awarded.map(gift => gift.lineId).includes("lapras"), true);
  assert.equal(Boolean(result960.collection.giftClaims["silph-lapras"]), true);
});

test("fossil gift waits for player choice and awards only one fossil", () => {
  const pending = getPendingFossilGift(DEFAULT_MONSTER_COLLECTION, {
    unlockedPoolSize: habitatMinPools["pokemon-mansion"],
    habitatMinPools,
  });
  assert.equal(pending?.id, "cinnabar-fossil");

  const autoAward = awardEligibleGiftMonsters(DEFAULT_MONSTER_COLLECTION, {
    unlockedPoolSize: habitatMinPools["pokemon-mansion"],
    trigger: "pool",
    habitatMinPools,
  });
  assert.equal(autoAward.awarded.some(gift => gift.lineId === "omanyte"), false);

  const claimed = claimFossilGift(DEFAULT_MONSTER_COLLECTION, "kabuto", { habitatMinPools });
  assert.equal(claimed.awarded?.lineId, "kabuto");
  assert.equal(Boolean(claimed.collection.giftClaims["cinnabar-fossil-kabuto"]), true);
  assert.equal(claimed.collection.monsters.some(monster => monster.id === "gift-cinnabar-fossil-kabuto"), true);

  const secondClaim = claimFossilGift(claimed.collection, "omanyte", { habitatMinPools });
  assert.equal(secondClaim.awarded, null);
});

test("box count excludes party members", () => {
  const collection = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    monsters: [
      ...DEFAULT_MONSTER_COLLECTION.monsters,
      createMonsterInstance({ id: "box-pidgey", lineId: "pidgey" }),
    ],
  });

  assert.equal(getBoxCount(collection), 1);
});

test("sorting the box by dex number permanently reorders only boxed monsters", () => {
  const collection = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    monsters: [
      ...DEFAULT_MONSTER_COLLECTION.monsters,
      createMonsterInstance({ id: "box-rattata", lineId: "rattata" }),
      createMonsterInstance({ id: "box-pidgey", lineId: "pidgey" }),
    ],
  });

  const next = sortBoxMonsters(collection, "dex");

  assert.deepEqual(getBoxMonsters(next).map(monster => monster.id), ["box-pidgey", "box-rattata"]);
  assert.deepEqual(next.partyIds, collection.partyIds);
});

test("sorting the box by level permanently uses highest level first", () => {
  const collection = normalizeMonsterCollection({
    ...DEFAULT_MONSTER_COLLECTION,
    monsters: [
      ...DEFAULT_MONSTER_COLLECTION.monsters,
      createMonsterInstance({ id: "box-pidgey", lineId: "pidgey", totalXP: getXpForLevel(2) }),
      createMonsterInstance({ id: "box-rattata", lineId: "rattata", totalXP: getXpForLevel(10) }),
    ],
  });

  const next = sortBoxMonsters(collection, "level");

  assert.deepEqual(getBoxMonsters(next).map(monster => monster.id), ["box-rattata", "box-pidgey"]);
  assert.deepEqual(next.partyIds, collection.partyIds);
});
