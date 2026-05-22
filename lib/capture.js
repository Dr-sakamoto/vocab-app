// capture.js の先頭のインポートに getXpForLevel を追加
import { createMonsterInstance, normalizeMonsterCollection, getXpForLevel } from "./monster.js";

export function applyCaptureResultToCollection(collection, result) {
  const normalized = normalizeMonsterCollection(collection);
  if (!result?.caught || !result.lineId || !result.monsterId) return normalized;

  const habitatVisits = {
    ...normalized.habitatVisits,
    [result.habitat.id]: (normalized.habitatVisits[result.habitat.id] ?? 0) + 1,
  };

  // 決定したレベルから初期XPを逆算
  const initialXP = typeof getXpForLevel === "function" 
    ? getXpForLevel(result.level, result.lineId) 
    : 0;

  const monsters = [
    ...normalized.monsters,
    createMonsterInstance({
      id: result.monsterId,
      lineId: result.lineId,
      totalXP: initialXP, // ← 算出した初期XPをセット！
      acquiredAt: result.habitat.id,
    }),
  ];

  return normalizeMonsterCollection({ ...normalized, habitatVisits, monsters });
}

export const CAPTURE_RATES_BY_GRADE = {
  D: 0.1,
  C: 0.3,
  B: 0.5,
  A: 0.7,
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
      { lineId: "pidgey", rate: 50, },
      { lineId: "rattata", rate: 50,  },
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
        { lineId: "caterpie", rate: 40},
        { lineId: "weedle", rate: 40},
        { lineId: "caterpie", rate: 10},
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
      { lineId: "spearow", rate: 35, },
      { lineId: "pidgey", rate: 30, },
      { lineId: "jigglypuff", rate: 10, },
      { lineId: "mankey", rate: 10, },
      { lineId: "nidoran-f", rate: 10, },
      { lineId: "nidoran-m", rate: 5, minLevel: 2, maxLevel: 5 },
    ]),
  },
  {
    id: "mt-moon",
    name: "おつきみやま",
    minPool: 240,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "zubat", rate: 69, },
      { lineId: "geodude", rate: 25, minLevel: 3, maxLevel: 5 },
      { lineId: "paras", rate: 5, minLevel: 3, maxLevel: 5 },
      { lineId: "clefairy", rate: 1, minLevel: 3, maxLevel: 5 },
    ]),
  },
  {
    id: "route-4",
    name: "4ばんどうろ",
    minPool: 300,
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "rattata", rate: 35, minLevel: 2, maxLevel: 4 },
      { lineId: "spearow", rate: 35, minLevel: 2, maxLevel: 5 },
      { lineId: "ekans", rate: 15, minLevel: 2, maxLevel: 4 },
      { lineId: "sandshrew", rate: 15, minLevel: 2, maxLevel: 4 },
    ]),
  },
  {
    id: "route-24",
    name: "24ばんどうろ",
    minPool: 360,
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "oddish", rate: 25,  },
        { lineId: "caterpie", rate: 20,  },
        { lineId: "weedle", rate: 20,  },
        { lineId: "pidgey", rate: 15,  },
        { lineId: "abra", rate: 15,  },
        { lineId: "weedle", rate: 4,  },
        { lineId: "caterpie", rate: 1,  },
      ],
      [
        { lineId: "bellsprout", rate: 25,},
        { lineId: "caterpie", rate: 20, },
        { lineId: "weedle", rate: 20,  },
        { lineId: "pidgey", rate: 15,  },
        { lineId: "abra", rate: 15,  },
        { lineId: "caterpie", rate: 4,  },
        { lineId: "weedle", rate: 1,  },
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
        { lineId: "oddish", rate: 25},
        { lineId: "caterpie", rate: 20 },
        { lineId: "weedle", rate: 20 },
        { lineId: "pidgey", rate: 15 },
        { lineId: "abra", rate: 15  },
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
      { lineId: "magnemite", rate: 30 },
      { lineId: "voltorb", rate: 30 },
      { lineId: "pikachu", rate: 25 },
      { lineId: "magnemite", rate: 10 },
      { lineId: "electabuzz", rate: 5 },
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
  {
    id: "old-rod",
    name: "ボロのつりざお",
    minPool: 660, // クチバシティ到達目安（11ばんどうろと同等）
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "magikarp", rate: 100 },
    ]),
  },
  {
    id: "good-rod",
    name: "いいつりざお",
    minPool: 1320, // セキチクシティ到達目安（サファリゾーンと同等）
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "goldeen", rate: 60 },
      { lineId: "magikarp", rate: 20 },
      { lineId: "poliwag", rate: 20 },
    ]),
  },
  {
    id: "sea-routes-19-21",
    name: "19 - 21ばんすいどう",
    minPool: 1380, // なみのり入手直後の目安
    encounterRule: "frlg-version-average",
    versionEncounters: both([
      { lineId: "tentacool", rate: 95 },
      { lineId: "tentacool", rate: 5 },
    ]),
  },
  {
    id: "super-rod",
    name: "すごいつりざお",
    minPool: 1380, // すごいつりざお入手目安（12ばんどうろ等）
    encounterRule: "frlg-version-average",
    versionEncounters: split(
      [
        { lineId: "krabby", rate: 40 },
        { lineId: "horsea", rate: 40 },
        { lineId: "shellder", rate: 20 }, // FR限定
      ],
      [
        { lineId: "krabby", rate: 40 },
        { lineId: "horsea", rate: 40 },
        { lineId: "staryu", rate: 20 },   // LG限定
      ],
    ),
  },
];

const ORIGINAL_LEVEL_RANGES_BY_HABITAT = {
  "route-1": { pidgey: [2, 5], rattata: [2, 4] },
  "route-22": { rattata: [2, 5], mankey: [2, 5], spearow: [3, 5] },
  "route-2": { pidgey: [2, 5], rattata: [2, 5], caterpie: [4, 5], weedle: [4, 5] },
  "viridian-forest": { caterpie: [3, 5], weedle: [3, 5], pikachu: [3, 5] },
  "route-3": {
    spearow: [6, 8],
    pidgey: [6, 7],
    jigglypuff: [3, 7],
    mankey: [7, 7],
    "nidoran-f": [6, 7],
    "nidoran-m": [6, 7],
  },
  "mt-moon": { zubat: [7, 11], geodude: [7, 10], paras: [5, 12], clefairy: [8, 12] },
  "route-4": { rattata: [8, 12], spearow: [8, 12], ekans: [6, 12], sandshrew: [6, 12] },
  "route-24": {
    oddish: [12, 14],
    caterpie: [7, 7],
    weedle: [7, 7],
    pidgey: [11, 13],
    abra: [8, 12],
    bellsprout: [12, 14],
  },
  "route-25": {
    oddish: [12, 14],
    caterpie: [8, 8],
    weedle: [8, 8],
    pidgey: [11, 13],
    abra: [9, 13],
    bellsprout: [12, 14],
  },
  "route-5": { pidgey: [13, 16], meowth: [10, 16], oddish: [13, 16], mankey: [13, 16], bellsprout: [13, 16] },
  "route-6": { pidgey: [13, 16], meowth: [10, 16], oddish: [13, 16], mankey: [13, 16], bellsprout: [13, 16] },
  "digletts-cave": { diglett: [15, 31] },
  "route-11": { spearow: [13, 17], drowzee: [11, 15], ekans: [12, 15], sandshrew: [12, 15] },
  "route-9": { spearow: [13, 17], rattata: [14, 17], ekans: [11, 17], sandshrew: [11, 17] },
  "rock-tunnel": { zubat: [15, 16], geodude: [15, 17], machop: [16, 17], onix: [13, 17], mankey: [16, 17] },
  "route-7": {
    pidgey: [19, 22],
    oddish: [19, 22],
    meowth: [17, 20],
    growlithe: [18, 20],
    bellsprout: [19, 22],
    vulpix: [18, 20],
  },
  "route-8": {
    pidgey: [18, 20],
    meowth: [18, 20],
    growlithe: [15, 18],
    ekans: [17, 19],
    mankey: [17, 19],
    vulpix: [15, 18],
    sandshrew: [17, 19],
  },
  "pokemon-tower": { gastly: [13, 19], cubone: [15, 19] },
  "route-10": { voltorb: [14, 17], spearow: [13, 17], ekans: [11, 17], sandshrew: [11, 17] },
  "power-plant": { magnemite: [22, 34], voltorb: [22, 25], pikachu: [22, 26], electabuzz: [32, 35] },
  "routes-12-15": { oddish: [22, 30], venonat: [24, 26], pidgey: [23, 29], bellsprout: [22, 30] },
  "routes-16-18": { spearow: [20, 29], doduo: [18, 28], rattata: [18, 29] },
  "safari-zone": {
    "nidoran-f": [22, 30],
    "nidoran-m": [22, 30],
    venonat: [22, 23],
    paras: [22, 30],
    rhyhorn: [25, 26],
    exeggcute: [23, 27],
    doduo: [26, 26],
    chansey: [23, 26],
    kangaskhan: [25, 28],
    tauros: [25, 28],
  },
  "pokemon-mansion": { rattata: [26, 38], koffing: [28, 30], growlithe: [30, 32], grimer: [28, 30], vulpix: [30, 32] },
  "seafoam-islands": { zubat: [22, 30], psyduck: [26, 33], slowpoke: [26, 33] },
  "victory-road": { machop: [32, 48], geodude: [32, 34], onix: [40, 48] },
  "cerulean-cave": {
    zubat: [46, 61],
    paras: [49, 64],
    abra: [55, 67],
    machop: [46, 52],
    ditto: [52, 67],
    voltorb: [58, 64],
    cubone: [46, 67],
    rhyhorn: [46, 67],
    chansey: [46, 67],
    wobbuffet: [55, 61],
  },
  "old-rod": { magikarp: [5, 5] },
  "good-rod": { goldeen: [5, 15], magikarp: [5, 15], poliwag: [5, 15] },
  "sea-routes-19-21": { tentacool: [5, 40] },
  "super-rod": { krabby: [15, 35], horsea: [15, 35], shellder: [15, 25], staryu: [15, 25] },
};

function getOriginalLevelRange(habitatId, lineId) {
  const range = ORIGINAL_LEVEL_RANGES_BY_HABITAT[habitatId]?.[lineId];
  return Array.isArray(range) ? { minLevel: range[0], maxLevel: range[1] } : null;
}

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


export function normalizeVersionedEncounters(versionEncounters, habitatId = null) {
  const versions = Object.values(versionEncounters ?? {}).filter(Array.isArray);
  if (versions.length === 0) return [];

  const results = [];
  for (const encounters of versions) {
    for (const encounter of encounters) {
      const rate = Number(encounter.rate);
      if (!encounter.lineId || !Number.isFinite(rate) || rate <= 0) continue;
      
      const originalRange = getOriginalLevelRange(habitatId, encounter.lineId);
      const minLevel = originalRange?.minLevel ?? encounter.minLevel ?? 1;
      const maxLevel = originalRange?.maxLevel ?? encounter.maxLevel ?? encounter.minLevel ?? 1;

      // lineIdでマージせず、レベル情報を保持したまま配列に追加
      results.push({
        lineId: encounter.lineId,
        weight: rate / versions.length, // バージョン数で割ることで全体の確率の帳尻を合わせる
        minLevel,
        maxLevel,
      });
    }
  }

  return results;
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
  const encounters = normalizeVersionedEncounters(habitat?.versionEncounters, habitat?.id);
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

// rollCaptureEncounter の中盤、encounter が決定した後の部分を修正
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

  // --- [追加] レベルのランダム決定 ---
  const minLvl = encounter.minLevel;
  const maxLvl = encounter.maxLevel;
  // シードに基づく rng() を使用して、min から max までのレベルを決定
  const generatedLevel = Math.floor(rng() * (maxLvl - minLvl + 1)) + minLvl;

  return {
    caught: true,
    captureRate,
    captureRoll,
    habitat: { id: habitat.id, name: habitat.name },
    lineId: encounter.lineId,
    encounterWeight: encounter.weight,
    level: generatedLevel, // ← 結果に確定レベルを追加
    monsterId: `caught-${encounter.lineId}-${Math.floor(rng() * 1e9).toString(36)}`,
  };

}
