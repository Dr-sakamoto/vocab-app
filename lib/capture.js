import { createMonsterInstance, normalizeMonsterCollection } from "./monster.js";

export const CAPTURE_RATES_BY_GRADE = {
  D: 0.2,
  C: 0.4,
  B: 0.6,
  A: 0.8,
  S: 1,
};

const both = encounters => ({ fireRed: encounters, leafGreen: encounters });
const split = (fireRed, leafGreen) => ({ fireRed, leafGreen });

// Normal grass/cave/building encounters only. Fishing, surfing, fixed events,
// trades, roaming legendaries, and gift Pokemon are intentionally omitted.
export const HABITATS = [
  {
    id: "route-1",
    name: "1ばんどうろ",
    minPool: 60,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "pidgey", rate: 50 },
      { lineId: "rattata", rate: 50 },
    ]),
  },
  {
    id: "route-22",
    name: "22ばんどうろ",
    minPool: 90,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "rattata", rate: 45 },
      { lineId: "mankey", rate: 45 },
      { lineId: "spearow", rate: 10 },
    ]),
  },
  {
    id: "route-2",
    name: "2ばんどうろ",
    minPool: 120,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "pidgey", rate: 45 },
      { lineId: "rattata", rate: 45 },
      { lineId: "caterpie", rate: 5 },
      { lineId: "weedle", rate: 5 },
    ]),
  },
  {
    id: "viridian-forest",
    name: "トキワのもり",
    minPool: 150,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "caterpie", rate: 40 },
        { lineId: "weedle", rate: 40 },
        { lineId: "caterpie", rate: 10 },
        { lineId: "weedle", rate: 5 },
        { lineId: "pikachu", rate: 5 },
      ],
      [
        { lineId: "caterpie", rate: 40 },
        { lineId: "weedle", rate: 40 },
        { lineId: "caterpie", rate: 5 },
        { lineId: "weedle", rate: 10 },
        { lineId: "pikachu", rate: 5 },
      ],
    ),
  },
  {
    id: "route-3",
    name: "3ばんどうろ",
    minPool: 180,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "spearow", rate: 35 },
      { lineId: "pidgey", rate: 30 },
      { lineId: "jigglypuff", rate: 10 },
      { lineId: "mankey", rate: 10 },
      { lineId: "nidoran-f", rate: 10 },
      { lineId: "nidoran-m", rate: 5 },
    ]),
  },
  {
    id: "mt-moon",
    name: "おつきみやま",
    minPool: 240,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "zubat", rate: 69 },
      { lineId: "geodude", rate: 25 },
      { lineId: "paras", rate: 5 },
      { lineId: "clefairy", rate: 1 },
    ]),
  },
  {
    id: "route-4",
    name: "4ばんどうろ",
    minPool: 300,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "rattata", rate: 35 },
      { lineId: "spearow", rate: 35 },
      { lineId: "ekans", rate: 15 },
      { lineId: "sandshrew", rate: 15 },
    ]),
  },
  {
    id: "route-24",
    name: "24ばんどうろ",
    minPool: 360,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "oddish", rate: 25 },
        { lineId: "caterpie", rate: 20 },
        { lineId: "weedle", rate: 20 },
        { lineId: "pidgey", rate: 15 },
        { lineId: "abra", rate: 15 },
        { lineId: "weedle", rate: 4 },
        { lineId: "caterpie", rate: 1 },
      ],
      [
        { lineId: "bellsprout", rate: 25 },
        { lineId: "caterpie", rate: 20 },
        { lineId: "weedle", rate: 20 },
        { lineId: "pidgey", rate: 15 },
        { lineId: "abra", rate: 15 },
        { lineId: "caterpie", rate: 4 },
        { lineId: "weedle", rate: 1 },
      ],
    ),
  },
  {
    id: "route-25",
    name: "25ばんどうろ",
    minPool: 420,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "oddish", rate: 25 },
        { lineId: "caterpie", rate: 20 },
        { lineId: "weedle", rate: 20 },
        { lineId: "pidgey", rate: 15 },
        { lineId: "abra", rate: 15 },
        { lineId: "weedle", rate: 4 },
        { lineId: "caterpie", rate: 1 },
      ],
      [
        { lineId: "bellsprout", rate: 25 },
        { lineId: "caterpie", rate: 20 },
        { lineId: "weedle", rate: 20 },
        { lineId: "pidgey", rate: 15 },
        { lineId: "abra", rate: 15 },
        { lineId: "caterpie", rate: 4 },
        { lineId: "weedle", rate: 1 },
      ],
    ),
  },
  {
    id: "route-5",
    name: "5ばんどうろ",
    minPool: 480,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "pidgey", rate: 40 },
        { lineId: "meowth", rate: 25 },
        { lineId: "oddish", rate: 25 },
        { lineId: "mankey", rate: 10 },
      ],
      [
        { lineId: "pidgey", rate: 40 },
        { lineId: "meowth", rate: 25 },
        { lineId: "bellsprout", rate: 25 },
        { lineId: "mankey", rate: 10 },
      ],
    ),
  },
  {
    id: "route-6",
    name: "6ばんどうろ",
    minPool: 540,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "pidgey", rate: 40 },
        { lineId: "meowth", rate: 25 },
        { lineId: "oddish", rate: 25 },
        { lineId: "mankey", rate: 10 },
      ],
      [
        { lineId: "pidgey", rate: 40 },
        { lineId: "meowth", rate: 25 },
        { lineId: "bellsprout", rate: 25 },
        { lineId: "mankey", rate: 10 },
      ],
    ),
  },
  {
    id: "digletts-cave",
    name: "ディグダのあな",
    minPool: 600,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "diglett", rate: 95 },
      { lineId: "diglett", rate: 5 },
    ]),
  },
  {
    id: "route-11",
    name: "11ばんどうろ",
    minPool: 660,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "spearow", rate: 35 },
      { lineId: "drowzee", rate: 25 },
      { lineId: "ekans", rate: 20 },
      { lineId: "sandshrew", rate: 20 },
    ]),
  },
  {
    id: "route-9",
    name: "9ばんどうろ",
    minPool: 720,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "spearow", rate: 35 },
        { lineId: "rattata", rate: 30 },
        { lineId: "ekans", rate: 25 },
        { lineId: "sandshrew", rate: 10 },
      ],
      [
        { lineId: "spearow", rate: 35 },
        { lineId: "rattata", rate: 30 },
        { lineId: "sandshrew", rate: 25 },
        { lineId: "ekans", rate: 10 },
      ],
    ),
  },
  {
    id: "rock-tunnel",
    name: "イワヤマトンネル",
    minPool: 780,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "zubat", rate: 35 },
      { lineId: "geodude", rate: 35 },
      { lineId: "machop", rate: 15 },
      { lineId: "onix", rate: 10 },
      { lineId: "mankey", rate: 5 },
    ]),
  },
  {
    id: "route-7",
    name: "7ばんどうろ",
    minPool: 840,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "pidgey", rate: 30 },
        { lineId: "oddish", rate: 30 },
        { lineId: "meowth", rate: 20 },
        { lineId: "growlithe", rate: 20 },
      ],
      [
        { lineId: "pidgey", rate: 30 },
        { lineId: "bellsprout", rate: 30 },
        { lineId: "meowth", rate: 20 },
        { lineId: "vulpix", rate: 20 },
      ],
    ),
  },
  {
    id: "route-8",
    name: "8ばんどうろ",
    minPool: 900,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "pidgey", rate: 30 },
        { lineId: "meowth", rate: 20 },
        { lineId: "growlithe", rate: 20 },
        { lineId: "ekans", rate: 20 },
        { lineId: "mankey", rate: 10 },
      ],
      [
        { lineId: "pidgey", rate: 30 },
        { lineId: "meowth", rate: 20 },
        { lineId: "vulpix", rate: 20 },
        { lineId: "sandshrew", rate: 20 },
        { lineId: "mankey", rate: 10 },
      ],
    ),
  },
  {
    id: "pokemon-tower",
    name: "ポケモンタワー",
    minPool: 960,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "gastly", rate: 85 },
      { lineId: "cubone", rate: 10 },
      { lineId: "gastly", rate: 5 },
    ]),
  },
  {
    id: "route-10",
    name: "10ばんどうろ",
    minPool: 1020,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "voltorb", rate: 40 },
        { lineId: "spearow", rate: 35 },
        { lineId: "ekans", rate: 25 },
      ],
      [
        { lineId: "voltorb", rate: 40 },
        { lineId: "spearow", rate: 35 },
        { lineId: "sandshrew", rate: 25 },
      ],
    ),
  },
  {
    id: "power-plant",
    name: "むじんはつでんしょ",
    minPool: 1080,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "magnemite", rate: 40 },
      { lineId: "voltorb", rate: 30 },
      { lineId: "magnemite", rate: 15 },
      { lineId: "voltorb", rate: 15 },
    ]),
  },
  {
    id: "routes-12-15",
    name: "12ばんどうろ - 15ばんどうろ",
    minPool: 1140,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "oddish", rate: 30 },
        { lineId: "venonat", rate: 30 },
        { lineId: "pidgey", rate: 25 },
        { lineId: "pidgey", rate: 15 },
      ],
      [
        { lineId: "bellsprout", rate: 30 },
        { lineId: "venonat", rate: 30 },
        { lineId: "pidgey", rate: 25 },
        { lineId: "pidgey", rate: 15 },
      ],
    ),
  },
  {
    id: "routes-16-18",
    name: "16ばんどうろ - 18ばんどうろ",
    minPool: 1200,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "spearow", rate: 30 },
      { lineId: "doduo", rate: 30 },
      { lineId: "rattata", rate: 25 },
      { lineId: "rattata", rate: 15 },
    ]),
  },
  {
    id: "safari-zone",
    name: "サファリゾーン",
    minPool: 1320,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "nidoran-f", rate: 20 },
      { lineId: "nidoran-m", rate: 20 },
      { lineId: "venonat", rate: 15 },
      { lineId: "paras", rate: 15 },
      { lineId: "rhyhorn", rate: 10 },
      { lineId: "exeggcute", rate: 10 },
      { lineId: "doduo", rate: 5 },
      { lineId: "chansey", rate: 2 },
      { lineId: "kangaskhan", rate: 2 },
      { lineId: "tauros", rate: 1 },
    ]),
  },
  {
    id: "pokemon-mansion",
    name: "ポケモンやしき",
    minPool: 1500,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "rattata", rate: 30 },
        { lineId: "koffing", rate: 30 },
        { lineId: "rattata", rate: 20 },
        { lineId: "koffing", rate: 10 },
        { lineId: "growlithe", rate: 10 },
      ],
      [
        { lineId: "rattata", rate: 30 },
        { lineId: "grimer", rate: 30 },
        { lineId: "rattata", rate: 20 },
        { lineId: "grimer", rate: 10 },
        { lineId: "vulpix", rate: 10 },
      ],
    ),
  },
  {
    id: "seafoam-islands",
    name: "ふたごじま",
    minPool: 1620,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "zubat", rate: 30 },
      { lineId: "zubat", rate: 20 },
      { lineId: "psyduck", rate: 25 },
      { lineId: "slowpoke", rate: 25 },
    ]),
  },
  {
    id: "victory-road",
    name: "チャンピオンロード",
    minPool: 1800,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "machop", rate: 25 },
      { lineId: "machop", rate: 20 },
      { lineId: "geodude", rate: 20 },
      { lineId: "geodude", rate: 20 },
      { lineId: "onix", rate: 15 },
    ]),
  },
  {
    id: "cerulean-cave",
    name: "ハナダのどうくつ",
    minPool: 2200,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "zubat", rate: 20 },
      { lineId: "paras", rate: 10 },
      { lineId: "abra", rate: 10 },
      { lineId: "machop", rate: 10 },
      { lineId: "ditto", rate: 10 },
      { lineId: "voltorb", rate: 10 },
      { lineId: "cubone", rate: 10 },
      { lineId: "rhyhorn", rate: 10 },
      { lineId: "chansey", rate: 5 },
      { lineId: "wobbuffet", rate: 5 },
    ]),
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
  habitat: selectedHabitat = null,
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

  const habitat = selectedHabitat ?? pickHabitat({ unlockedPoolSize, habitatVisits, rng, habitats });
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

  return normalizeMonsterCollection({ ...normalized, habitatVisits, monsters });
}
