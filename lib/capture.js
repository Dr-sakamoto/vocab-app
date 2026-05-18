import { createMonsterInstance, normalizeMonsterCollection } from "./monster.js";

export const CAPTURE_RATES_BY_GRADE = {
  D: 0.2,
  C: 0.5,
  B: 0.7,
  A: 0.8,
  S: 1,
};

export const HABITATS = [
  {
    id: "route-1",
    name: "1ばんどうろ",
    minPool: 60,
    encounterRule: "frlg-version-average",
    versionEncounters: {
      fireRed: [
        { lineId: "pidgey", rate: 50 },
        { lineId: "rattata", rate: 50 },
      ],
      leafGreen: [
        { lineId: "pidgey", rate: 50 },
        { lineId: "rattata", rate: 50 },
      ],
    },
  },
];

function hashSeed(seed) {
  let h = 2166136261;
  const text = String(seed ?? "capture");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed) {
  let t = hashSeed(seed);
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function getUnlockedHabitats(unlockedPoolSize, habitats = HABITATS) {
  const poolSize = Number(unlockedPoolSize);
  return habitats.filter(habitat => Number.isFinite(poolSize) && poolSize >= habitat.minPool);
}

export function normalizeVersionedEncounters(versionEncounters) {
  const versions = Object.values(versionEncounters ?? {}).filter(Array.isArray);
  if (versions.length === 0) return [];

  const weights = new Map();
  for (const encounters of versions) {
    for (const encounter of encounters) {
      const rate = Number(encounter.rate);
      if (!encounter.lineId || !Number.isFinite(rate) || rate <= 0) continue;
      weights.set(encounter.lineId, (weights.get(encounter.lineId) ?? 0) + rate / versions.length);
    }
  }

  return Array.from(weights.entries()).map(([lineId, weight]) => ({ lineId, weight }));
}

function pickWeighted(items, getWeight, rng) {
  const weighted = items
    .map(item => ({ item, weight: Math.max(0, getWeight(item)) }))
    .filter(entry => entry.weight > 0);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return null;

  let cursor = rng() * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }
  return weighted.at(-1)?.item ?? null;
}

export function pickHabitat({ unlockedPoolSize, habitatVisits = {}, rng, habitats = HABITATS }) {
  const unlocked = getUnlockedHabitats(unlockedPoolSize, habitats);
  return pickWeighted(
    unlocked,
    habitat => 1 / (1 + Math.max(0, Number(habitatVisits[habitat.id]) || 0)),
    rng,
  );
}

export function pickEncounterLine(habitat, rng) {
  const encounters = normalizeVersionedEncounters(habitat?.versionEncounters);
  return pickWeighted(encounters, encounter => encounter.weight, rng);
}

export function rollCaptureEncounter({
  grade,
  unlockedPoolSize,
  habitatVisits = {},
  seed,
  habitats = HABITATS,
}) {
  const rng = createSeededRng(seed);
  const captureRate = CAPTURE_RATES_BY_GRADE[grade] ?? 0;
  const captureRoll = rng();

  if (captureRoll >= captureRate) {
    return {
      caught: false,
      captureRate,
      captureRoll,
      reason: "missed",
    };
  }

  const habitat = pickHabitat({ unlockedPoolSize, habitatVisits, rng, habitats });
  if (!habitat) {
    return {
      caught: false,
      captureRate,
      captureRoll,
      reason: "no-habitat",
    };
  }

  const encounter = pickEncounterLine(habitat, rng);
  if (!encounter) {
    return {
      caught: false,
      captureRate,
      captureRoll,
      habitat: { id: habitat.id, name: habitat.name },
      reason: "no-encounter",
    };
  }

  return {
    caught: true,
    captureRate,
    captureRoll,
    habitat: { id: habitat.id, name: habitat.name },
    lineId: encounter.lineId,
    encounterWeight: encounter.weight,
    monsterId: `caught-${encounter.lineId}-${Math.floor(rng() * 1e9).toString(36)}`,
  };
}

export function applyCaptureResultToCollection(collection, result) {
  const normalized = normalizeMonsterCollection(collection);
  if (!result?.caught || !result.lineId || !result.monsterId) return normalized;

  const habitatVisits = {
    ...normalized.habitatVisits,
    [result.habitat.id]: (normalized.habitatVisits[result.habitat.id] ?? 0) + 1,
  };
  const monsters = [
    ...normalized.monsters,
    createMonsterInstance({
      id: result.monsterId,
      lineId: result.lineId,
      totalXP: 0,
      acquiredAt: result.habitat.id,
    }),
  ];
  const partyIds = normalized.partyIds.slice();
  const emptyPartyIndex = partyIds.findIndex(id => id === null);
  if (emptyPartyIndex >= 0) partyIds[emptyPartyIndex] = result.monsterId;

  return normalizeMonsterCollection({ ...normalized, habitatVisits, partyIds, monsters });
}
