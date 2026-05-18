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
  {
    id: "pidgey",
    name: "ポッポ",
    species: [
      species({ id: 16, name: "ポッポ", nameEn: "Pidgey", minLevel: 1, maxLevel: 17 }),
      species({ id: 17, name: "ピジョン", nameEn: "Pidgeotto", minLevel: 18, maxLevel: 35 }),
      species({ id: 18, name: "ピジョット", nameEn: "Pidgeot", minLevel: 36 }),
    ],
  },
  {
    id: "rattata",
    name: "コラッタ",
    species: [
      species({ id: 19, name: "コラッタ", nameEn: "Rattata", minLevel: 1, maxLevel: 19 }),
      species({ id: 20, name: "ラッタ", nameEn: "Raticate", minLevel: 20 }),
    ],
  },
];

export const DEFAULT_MONSTER_LINE_ID = "bulbasaur";
export const BULBASAUR_LINE = MONSTER_LINES.find(line => line.id === DEFAULT_MONSTER_LINE_ID).species;
export const PARTY_SIZE = 6;
export const DEFAULT_MONSTER_COLLECTION = {
  version: 1,
  activeId: "starter-bulbasaur",
  partyIds: ["starter-bulbasaur", "starter-charmander", "starter-squirtle", null, null, null],
  habitatVisits: {},
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

  const requestedPartyIds = Array.isArray(collection?.partyIds)
    ? collection.partyIds
    : DEFAULT_MONSTER_COLLECTION.partyIds;
  const monsterIds = new Set(monsters.map(monster => monster.id));
  const partyIds = [];
  for (const id of requestedPartyIds) {
    if (partyIds.length >= PARTY_SIZE) break;
    if (id === null || id === undefined || id === "") {
      partyIds.push(null);
      continue;
    }
    if (typeof id !== "string" || !monsterIds.has(id) || partyIds.includes(id)) {
      partyIds.push(null);
      continue;
    }
    partyIds.push(id);
  }
  while (partyIds.length < PARTY_SIZE) partyIds.push(null);

  const nonEmptyPartyIds = partyIds.filter(Boolean);
  if (nonEmptyPartyIds.length === 0) {
    partyIds[0] = activeId;
  } else if (!partyIds.includes(activeId)) {
    const emptyIndex = partyIds.findIndex(id => id === null);
    if (emptyIndex >= 0) partyIds[emptyIndex] = activeId;
    else partyIds[0] = activeId;
  }

  const activeIndex = partyIds.indexOf(activeId);
  if (activeIndex > 0) {
    [partyIds[0], partyIds[activeIndex]] = [partyIds[activeIndex], partyIds[0]];
  } else if (activeIndex < 0) {
    const firstMonsterId = partyIds.find(Boolean) ?? activeId;
    const firstMonsterIndex = partyIds.indexOf(firstMonsterId);
    if (firstMonsterIndex > 0) {
      [partyIds[0], partyIds[firstMonsterIndex]] = [partyIds[firstMonsterIndex], partyIds[0]];
    } else {
      partyIds[0] = firstMonsterId;
    }
  }

  const seenPartyIds = new Set();
  for (let i = 0; i < partyIds.length; i += 1) {
    const id = partyIds[i];
    if (!id) continue;
    if (seenPartyIds.has(id)) partyIds[i] = null;
    else seenPartyIds.add(id);
  }

  const habitatVisits = {};
  if (collection?.habitatVisits && typeof collection.habitatVisits === "object") {
    for (const [habitatId, visits] of Object.entries(collection.habitatVisits)) {
      const safeVisits = Number(visits);
      if (Number.isFinite(safeVisits) && safeVisits > 0) {
        habitatVisits[habitatId] = Math.floor(safeVisits);
      }
    }
  }

  return { version: 1, activeId: partyIds[0] ?? activeId, partyIds, habitatVisits, monsters };
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
  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  const currentIndex = partyIds.indexOf(monsterId);
  if (currentIndex > 0) {
    [partyIds[0], partyIds[currentIndex]] = [partyIds[currentIndex], partyIds[0]];
  } else if (currentIndex < 0) {
    partyIds[0] = monsterId;
  }
  return { ...normalized, activeId: monsterId, partyIds };
}

export function getPartySlots(collection) {
  const normalized = normalizeMonsterCollection(collection);
  const byId = new Map(normalized.monsters.map(monster => [monster.id, monster]));
  return Array.from({ length: PARTY_SIZE }, (_, index) => {
    const id = normalized.partyIds[index];
    return id ? byId.get(id) ?? null : null;
  });
}

export function getPartyCount(collection) {
  return getPartySlots(collection).filter(Boolean).length;
}

export function updatePartyXP(collection, gainedXP) {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  const fullXP = clampMonsterXP(gainedXP);
  const halfXP = Math.floor(fullXP * 0.5);

  return {
    ...normalized,
    monsters: normalized.monsters.map(monster => {
      if (!partyIdSet.has(monster.id)) return monster;
      const xpToAdd = monster.id === normalized.activeId ? fullXP : halfXP;
      return {
        ...monster,
        totalXP: clampMonsterXP(monster.totalXP + xpToAdd),
      };
    }),
  };
}

export function getBoxMonsters(collection) {
  const normalized = normalizeMonsterCollection(collection);
  const partyIdSet = new Set(normalized.partyIds);
  return normalized.monsters.filter(monster => !partyIdSet.has(monster.id));
}

export function sendPartySlotToBox(collection, partyIndex) {
  const normalized = normalizeMonsterCollection(collection);
  if (!Number.isInteger(partyIndex) || partyIndex < 0 || partyIndex >= PARTY_SIZE) return normalized;
  if (!normalized.partyIds[partyIndex]) return normalized;

  const filledCount = normalized.partyIds.filter(Boolean).length;
  if (filledCount <= 1) return normalized;

  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  partyIds[partyIndex] = null;
  if (!partyIds[0]) {
    const nextActiveIndex = partyIds.findIndex(Boolean);
    if (nextActiveIndex > 0) {
      [partyIds[0], partyIds[nextActiveIndex]] = [partyIds[nextActiveIndex], partyIds[0]];
    }
  }

  return normalizeMonsterCollection({
    ...normalized,
    activeId: partyIds[0] ?? normalized.activeId,
    partyIds,
  });
}

export function swapMonsterLocations(collection, first, second) {
  const normalized = normalizeMonsterCollection(collection);
  if (!first || !second) return normalized;

  const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
  const monsters = [...normalized.monsters];
  const partyIdSet = new Set(partyIds);

  const getLocationId = location => {
    if (location.area === "party") return partyIds[location.index] ?? null;
    if (location.area === "box") {
      const id = location.id;
      return id && !partyIdSet.has(id) ? id : null;
    }
    return null;
  };

  const firstId = getLocationId(first);
  const secondId = getLocationId(second);
  if (first.area !== "party" && !firstId) return normalized;
  if (second.area !== "party" && !secondId) return normalized;
  if (firstId && secondId && firstId === secondId) return normalized;

  if (first.area === "party" && second.area === "party") {
    [partyIds[first.index], partyIds[second.index]] = [partyIds[second.index], partyIds[first.index]];
  } else if (first.area === "party" && second.area === "box") {
    if (!firstId) return normalized;
    partyIds[first.index] = secondId;
  } else if (first.area === "box" && second.area === "party") {
    partyIds[second.index] = firstId;
  } else if (first.area === "box" && second.area === "box") {
    const firstIndex = monsters.findIndex(monster => monster.id === firstId);
    const secondIndex = monsters.findIndex(monster => monster.id === secondId);
    if (firstIndex >= 0 && secondIndex >= 0) {
      [monsters[firstIndex], monsters[secondIndex]] = [monsters[secondIndex], monsters[firstIndex]];
    }
  }

  return normalizeMonsterCollection({
    ...normalized,
    activeId: partyIds[0] ?? normalized.activeId,
    partyIds,
    monsters,
  });
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
