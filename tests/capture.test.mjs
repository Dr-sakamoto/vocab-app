import assert from "node:assert/strict";
import test from "node:test";

import {
  applyCaptureResultToCollection,
  getUnlockedHabitats,
  normalizeVersionedEncounters,
  rollCaptureEncounter,
} from "../lib/capture.js";
import { DEFAULT_MONSTER_COLLECTION } from "../lib/monster.js";

test("1ばんどうろ is unlocked at the initial pool size", () => {
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
    { lineId: "a", weight: 20 },
    { lineId: "b", weight: 15 },
    { lineId: "c", weight: 30 },
    { lineId: "d", weight: 20 },
    { lineId: "e", weight: 15 },
  ]);
});

test("S rank always reaches the route 1 encounter table when unlocked", () => {
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
    unlockedPoolSize: 60,
    habitatVisits: { "route-1": 2 },
    seed: "same-seed",
  };

  assert.deepEqual(rollCaptureEncounter(input), rollCaptureEncounter(input));
});

test("applying a caught result fills an open party slot and increments habitat visits", () => {
  const result = {
    caught: true,
    habitat: { id: "route-1", name: "1ばんどうろ" },
    lineId: "pidgey",
    monsterId: "caught-pidgey-test",
  };

  const next = applyCaptureResultToCollection(DEFAULT_MONSTER_COLLECTION, result);

  assert.equal(next.monsters.some(monster => monster.id === "caught-pidgey-test"), true);
  assert.equal(next.habitatVisits["route-1"], 1);
  assert.equal(next.partyIds.includes("caught-pidgey-test"), true);
});
