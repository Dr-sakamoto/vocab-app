// プール倍率ティア（全3400語対応）
export const POOL_TIERS = [
  { minPool: 3000, multiplier: 13, label: "MASTER", color: "#f59e0b" },
  { minPool: 2600, multiplier: 11, label: "Tier 8", color: "#ef4444" },
  { minPool: 2200, multiplier: 9, label: "Tier 7", color: "#8b5cf6" },
  { minPool: 1800, multiplier: 7, label: "Tier 6", color: "#3b82f6" },
  { minPool: 1400, multiplier: 5, label: "Tier 5", color: "#06b6d4" },
  { minPool: 1000, multiplier: 4, label: "Tier 4", color: "#10b981" },
  { minPool: 600, multiplier: 3, label: "Tier 3", color: "#84cc16" },
  { minPool: 300, multiplier: 2, label: "Tier 2", color: "#a3a3a3" },
  { minPool: 60, multiplier: 1, label: "Tier 1", color: "#d4d4d8" },
];

/** プールサイズから現在のティアを取得 */
export function getPoolTier(poolSize) {
  return POOL_TIERS.find(t => poolSize >= t.minPool) ?? POOL_TIERS.at(-1);
}

// Lv.N -> N+1 に必要な XP = N * 500
// Lv.N に到達するための累計 XP = 500 * N*(N-1)/2
const XP_FACTOR = 500;
export const MAX_MONSTER_LEVEL = 99;
export const MAX_MONSTER_XP = XP_FACTOR * ((MAX_MONSTER_LEVEL - 1) * MAX_MONSTER_LEVEL) / 2;

const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii";

const crystalSprite = id => `${SPRITE_ROOT}/crystal/transparent/${id}.png`;
const goldSprite = id => `${SPRITE_ROOT}/gold/transparent/${id}.png`;

function species({ id, name, nameEn, minLevel, maxLevel = MAX_MONSTER_LEVEL }) {
  return {
    id,
    name,
    nameEn,
    minLevel,
    maxLevel,
    sprite: crystalSprite(id),
    fallbackSprite: goldSprite(id),
  };
}

export const MONSTER_LINES = [
  {
    id: "charmander",
    name: "ヒトカゲ",
    species: [
      species({ id: 4, name: "ヒトカゲ", nameEn: "Charmander", minLevel: 1, maxLevel: 15 }),
      species({ id: 5, name: "リザード", nameEn: "Charmeleon", minLevel: 16, maxLevel: 35 }),
      species({ id: 6, name: "リザードン", nameEn: "Charizard", minLevel: 36 }),
    ],
  },
  {
    id: "squirtle",
    name: "ゼニガメ",
    species: [
      species({ id: 7, name: "ゼニガメ", nameEn: "Squirtle", minLevel: 1, maxLevel: 15 }),
      species({ id: 8, name: "カメール", nameEn: "Wartortle", minLevel: 16, maxLevel: 35 }),
      species({ id: 9, name: "カメックス", nameEn: "Blastoise", minLevel: 36 }),
    ],
  },
  {
    id: "bulbasaur",
    name: "フシギダネ",
    species: [
      species({ id: 1, name: "フシギダネ", nameEn: "Bulbasaur", minLevel: 1, maxLevel: 15 }),
      species({ id: 2, name: "フシギソウ", nameEn: "Ivysaur", minLevel: 16, maxLevel: 35 }),
      species({ id: 3, name: "フシギバナ", nameEn: "Venusaur", minLevel: 32 }),
    ],
  },
];

export const DEFAULT_MONSTER_LINE_ID = "bulbasaur";
export const BULBASAUR_LINE = MONSTER_LINES.find(line => line.id === DEFAULT_MONSTER_LINE_ID).species;
export const DEFAULT_MONSTER_COLLECTION = {
  version: 1,
  activeId: "starter-bulbasaur",
  monsters: [
    { id: "starter-charmander", lineId: "charmander", totalXP: 0 },
    { id: "starter-squirtle", lineId: "squirtle", totalXP: 0 },
    { id: "starter-bulbasaur", lineId: "bulbasaur", totalXP: 0 },
  ],
};

const MONSTER_LINE_BY_ID = new Map(MONSTER_LINES.map(line => [line.id, line]));

function clampLevel(level) {
  const n = Number(level);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(MAX_MONSTER_LEVEL, Math.floor(n)));
}

export function clampMonsterXP(xp) {
  const n = Number(xp);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(MAX_MONSTER_XP, n));
}

export function normalizeMonsterLineId(lineId) {
  return MONSTER_LINE_BY_ID.has(lineId) ? lineId : DEFAULT_MONSTER_LINE_ID;
}

export function getMonsterLine(lineId = DEFAULT_MONSTER_LINE_ID) {
  return MONSTER_LINE_BY_ID.get(normalizeMonsterLineId(lineId));
}

export function getAvailableMonsterLines() {
  return MONSTER_LINES;
}

export function createMonsterInstance({
  id,
  lineId = DEFAULT_MONSTER_LINE_ID,
  totalXP = 0,
  acquiredAt = null,
} = {}) {
  const safeLineId = normalizeMonsterLineId(lineId);
  return {
    id: id ?? `${safeLineId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    lineId: safeLineId,
    totalXP: clampMonsterXP(totalXP),
    acquiredAt,
  };
}

export function normalizeMonsterCollection(collection, legacy = {}) {
  const legacyLineId = normalizeMonsterLineId(legacy.lineId);
  const legacyXP = clampMonsterXP(legacy.totalXP);
  const sourceMonsters = Array.isArray(collection?.monsters)
    ? collection.monsters
    : DEFAULT_MONSTER_COLLECTION.monsters.map(monster => ({
        ...monster,
        totalXP: monster.lineId === legacyLineId ? legacyXP : 0,
      }));

  const byId = new Map();
  for (const monster of sourceMonsters) {
    if (!monster || typeof monster !== "object") continue;
    const instance = createMonsterInstance({
      id: typeof monster.id === "string" && monster.id ? monster.id : undefined,
      lineId: monster.lineId,
      totalXP: monster.totalXP,
      acquiredAt: monster.acquiredAt ?? null,
    });
    byId.set(instance.id, instance);
  }

  for (const starter of DEFAULT_MONSTER_COLLECTION.monsters) {
    if (!byId.has(starter.id)) byId.set(starter.id, createMonsterInstance(starter));
  }

  const monsters = Array.from(byId.values());
  const requestedActiveId = collection?.activeId;
  const fallbackActiveId =
    monsters.find(monster => monster.lineId === legacyLineId)?.id ??
    DEFAULT_MONSTER_COLLECTION.activeId;
  const activeId = monsters.some(monster => monster.id === requestedActiveId)
    ? requestedActiveId
    : fallbackActiveId;

  return { version: 1, activeId, monsters };
}

export function getActiveMonster(collection) {
  const normalized = normalizeMonsterCollection(collection);
  return (
    normalized.monsters.find(monster => monster.id === normalized.activeId) ??
    normalized.monsters[0]
  );
}

export function getMonsterById(collection, monsterId) {
  const normalized = normalizeMonsterCollection(collection);
  return normalized.monsters.find(monster => monster.id === monsterId) ?? null;
}

export function setActiveMonster(collection, monsterId) {
  const normalized = normalizeMonsterCollection(collection);
  if (!normalized.monsters.some(monster => monster.id === monsterId)) return normalized;
  return { ...normalized, activeId: monsterId };
}

export function updateMonsterXP(collection, monsterId, getNextXP) {
  const normalized = normalizeMonsterCollection(collection);
  return {
    ...normalized,
    monsters: normalized.monsters.map(monster => {
      if (monster.id !== monsterId) return monster;
      return {
        ...monster,
        totalXP: clampMonsterXP(getNextXP(monster.totalXP)),
      };
    }),
  };
}

export function totalXPForLevel(level) {
  const cappedLevel = clampLevel(level);
  if (cappedLevel <= 1) return 0;
  return XP_FACTOR * ((cappedLevel - 1) * cappedLevel) / 2;
}

export function xpToNextLevel(level) {
  const cappedLevel = clampLevel(level);
  if (cappedLevel >= MAX_MONSTER_LEVEL) return 0;
  return XP_FACTOR * cappedLevel;
}

export function levelFromTotalXP(xp) {
  const cappedXP = clampMonsterXP(xp);
  const n = Math.floor((1 + Math.sqrt(1 + (8 * cappedXP) / XP_FACTOR)) / 2);
  return clampLevel(n);
}

/** レベルから現在の種族を取得 */
export function getSpecies(level, lineId = DEFAULT_MONSTER_LINE_ID) {
  const line = getMonsterLine(lineId);
  return (
    [...line.species].reverse().find(s => level >= s.minLevel) ??
    line.species[0]
  );
}

/**
 * 累計 XP からモンスターの状態を返す
 * @param {number} totalXP
 * @param {string} lineId
 * @returns {{ level, currentXP, neededXP, pct, species, line }}
 */
export function getMonsterState(totalXP, lineId = DEFAULT_MONSTER_LINE_ID) {
  const cappedXP = clampMonsterXP(totalXP);
  const level = levelFromTotalXP(cappedXP);
  const levelBase = totalXPForLevel(level);
  const currentXP = level >= MAX_MONSTER_LEVEL ? 0 : cappedXP - levelBase;
  const neededXP = xpToNextLevel(level);
  const line = getMonsterLine(lineId);
  const species = getSpecies(level, line.id);
  return {
    level,
    currentXP,
    neededXP,
    pct: level >= MAX_MONSTER_LEVEL ? 1 : currentXP / neededXP,
    species,
    line,
  };
}
