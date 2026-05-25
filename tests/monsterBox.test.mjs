import assert from "node:assert/strict";
import test from "node:test";

import {
  BOX_LIMIT,
  DEFAULT_MONSTER_COLLECTION,
  createMonsterInstance,
  getBoxCount,
  getBoxMonsters,
  normalizeMonsterCollection,
  sendMonstersToProfessor,
} from "../lib/monster.js";

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
