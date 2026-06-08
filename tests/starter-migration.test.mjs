import assert from 'assert';
import { normalizeMonsterCollection, createMonsterInstance, totalXPForLevel } from '../lib/monster.js';
import { migrateStarterState } from '../lib/starters.js';

// Test: when collection already contains a starter, migrateStarterState should
// populate chosenStarterLineId and set the starter as active.
(async function() {
  const starter = createMonsterInstance({ id: 'starter-bulbasaur', lineId: 'bulbasaur', totalXP: totalXPForLevel(5) });
  const collection = normalizeMonsterCollection({ monsters: [starter], activeId: null, partyIds: [null, null, null, null, null, null] });
  const progress = {};
  const { collection: nextCollection, progress: nextProgress } = migrateStarterState(collection, progress, { rng: () => 0 });

  assert.strictEqual(nextProgress.chosenStarterLineId, 'bulbasaur', 'chosenStarterLineId should be inferred as bulbasaur');
  const normalizedNext = normalizeMonsterCollection(nextCollection);
  assert.ok(normalizedNext.activeId, 'activeId should be set');
  const active = normalizedNext.monsters.find(m => m.id === normalizedNext.activeId);
  assert.ok(active, 'active monster should exist');
  assert.strictEqual(active.lineId, 'bulbasaur', 'active monster should be the inferred starter');

  console.log('Test A passed');
})();

(async function() {
  // Test: when collection has non-starter monsters, migration should not set chosenStarterLineId
  const other = createMonsterInstance({ id: 'mon-1', lineId: 'pidgey', totalXP: totalXPForLevel(5) });
  const collection = normalizeMonsterCollection({ monsters: [other] });
  const progress = {};
  const { progress: nextProgress } = migrateStarterState(collection, progress, { rng: () => 0 });
  assert.strictEqual(nextProgress.chosenStarterLineId, undefined, 'chosenStarterLineId should remain undefined for non-starter collection');

  console.log('Test B passed');
})();
