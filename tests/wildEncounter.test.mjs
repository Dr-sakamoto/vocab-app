import assert from "node:assert/strict";
import test from "node:test";

import {
  BATTLE_PARTY_SIZE,
  applyDamageToEncounter,
  getBattleParty,
  getMaxHPForLevel,
  getPartyAttackPower,
  normalizeWildEncounter,
  spawnWildEncounter,
  tryCaptureEncounter,
} from "../lib/wildEncounter.js";
import {
  normalizeMonsterCollection,
  totalXPForLevel,
} from "../lib/monster.js";

function makeCollection(levels = []) {
  const monsters = levels.map((level, i) => ({
    id: `mon-${i}`,
    lineId: "bulbasaur",
    totalXP: totalXPForLevel(level),
  }));
  const partyIds = Array.from({ length: 6 }, (_, i) => monsters[i]?.id ?? null);
  return normalizeMonsterCollection({
    monsters,
    activeId: monsters[0]?.id ?? null,
    partyIds,
  });
}

test("バトル参加パーティは先頭4枠まで", () => {
  const collection = makeCollection([5, 5, 5, 5, 5, 5]);
  assert.equal(getBattleParty(collection).length, BATTLE_PARTY_SIZE);
});

test("攻撃力は手持ちの数とレベルに対して単調に増える", () => {
  const empty = getPartyAttackPower(makeCollection([]));
  const soloWeak = getPartyAttackPower(makeCollection([5]));
  const soloStrong = getPartyAttackPower(makeCollection([40]));
  const fullStrong = getPartyAttackPower(makeCollection([40, 40, 40, 40]));

  assert.ok(empty > 0);
  assert.ok(soloWeak > empty);
  assert.ok(soloStrong > soloWeak);
  assert.ok(fullStrong > soloStrong);
});

test("最大HPはレベルに比例して増える", () => {
  assert.ok(getMaxHPForLevel(1) > 0);
  assert.ok(getMaxHPForLevel(30) > getMaxHPForLevel(5));
});

test("捕獲猶予: 弱い手持ちほど倒すまでの正解数が多い（乱獲防止の駆け引き）", () => {
  const hp = getMaxHPForLevel(10);
  const weakHits = Math.ceil(hp / getPartyAttackPower(makeCollection([5])));
  const strongHits = Math.ceil(
    hp / getPartyAttackPower(makeCollection([40, 40, 40, 40])),
  );
  assert.ok(weakHits > strongHits);
  // 強パーティでも即死はしない（最低でも数問の猶予がある）
  assert.ok(strongHits >= 3, `strongHits=${strongHits}`);
});

test("スポーン: 解放済み生息地から出現し、ミッションとHPが積まれる", () => {
  const collection = makeCollection([10, 8]);
  const encounter = spawnWildEncounter({
    unlockedPoolSize: 60,
    seed: "test-seed-1",
    collection,
  });
  assert.ok(encounter);
  assert.equal(encounter.status, "active");
  assert.ok(encounter.level >= 1);
  assert.equal(encounter.hp, encounter.maxHP);
  assert.ok(encounter.missions.length >= 2);
  assert.ok(encounter.name.length > 0);
  assert.ok(encounter.habitatId.length > 0);
});

test("スポーン: 生息地が未解放なら出現しない", () => {
  const encounter = spawnWildEncounter({
    unlockedPoolSize: 10,
    seed: "test-seed-2",
    collection: makeCollection([5]),
  });
  assert.equal(encounter, null);
});

test("ダメージ: HPが尽きると逃げられる", () => {
  const collection = makeCollection([10]);
  const spawned = spawnWildEncounter({
    unlockedPoolSize: 60,
    seed: "test-seed-3",
    collection,
  });
  const first = applyDamageToEncounter(spawned, 10);
  assert.equal(first.escaped, false);
  assert.equal(first.encounter.hp, spawned.maxHP - 10);

  const finished = applyDamageToEncounter(first.encounter, 999999);
  assert.equal(finished.escaped, true);
  assert.equal(finished.encounter.status, "escaped");
  assert.equal(finished.encounter.hp, 0);

  // 終了後は変化しない
  const after = applyDamageToEncounter(finished.encounter, 10);
  assert.equal(after.escaped, false);
  assert.equal(after.encounter.hp, 0);
});

test("捕獲: 全ミッション達成時のみ捕獲でき、結果はコレクション反映形式", () => {
  const spawned = spawnWildEncounter({
    unlockedPoolSize: 60,
    seed: "test-seed-4",
    collection: makeCollection([10]),
  });

  const notYet = tryCaptureEncounter(spawned);
  assert.equal(notYet.capture, null);
  assert.equal(notYet.encounter.status, "active");

  const allDone = {
    ...spawned,
    missions: spawned.missions.map((m) => ({ ...m, progress: m.goal, done: true })),
  };
  const captured = tryCaptureEncounter(allDone);
  assert.ok(captured.capture);
  assert.equal(captured.capture.caught, true);
  assert.equal(captured.capture.lineId, spawned.lineId);
  assert.equal(captured.encounter.status, "captured");

  // 逃げられた後は捕獲できない
  const escaped = { ...allDone, status: "escaped" };
  assert.equal(tryCaptureEncounter(escaped).capture, null);
});

test("normalizeWildEncounter: 有効なactiveエンカウントだけ復元する", () => {
  const spawned = spawnWildEncounter({
    unlockedPoolSize: 60,
    seed: "test-seed-5",
    collection: makeCollection([10]),
  });
  const restored = normalizeWildEncounter(JSON.parse(JSON.stringify(spawned)));
  assert.ok(restored);
  assert.equal(restored.id, spawned.id);
  assert.equal(restored.missions.length, spawned.missions.length);

  assert.equal(normalizeWildEncounter(null), null);
  assert.equal(normalizeWildEncounter({ ...spawned, status: "captured" }), null);
  assert.equal(normalizeWildEncounter({ ...spawned, hp: 0 }), null);
  assert.equal(normalizeWildEncounter({ ...spawned, lineId: "no-such-line" }), null);
  assert.equal(normalizeWildEncounter({ ...spawned, missions: [] }), null);
});
