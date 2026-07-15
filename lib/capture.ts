import { createMonsterInstance, normalizeMonsterCollection, getXpForLevel, getMonsterLine, getSpecies, getLineIdBySpeciesId, getItemEvolutionPickup, ItemEvolutionPickup } from "./monster";
import { MonsterCollection } from "./types";

export interface CaptureResult {
  caught: boolean;
  captureRate?: number;
  captureRoll?: number | null;
  reason?: string;
  itemPickup?: ItemEvolutionPickup | null;
  habitat?: { id: string; name: string };
  lineId?: string;
  encounterWeight?: number;
  level?: number;
  speciesId?: number;
  monsterId?: string;
  masterBall?: boolean;
}

export function applyCaptureResultToCollection(collection: MonsterCollection, result: CaptureResult): MonsterCollection {
  const normalized = normalizeMonsterCollection(collection);
  if (result?.itemPickup) {
    const { monsterId, itemType, itemName } = result.itemPickup;
    return normalizeMonsterCollection({
      ...normalized,
      monsters: normalized.monsters.map(monster => {
        if (monster.id !== monsterId) return monster;
        return {
          ...monster,
          heldItemType: itemType,
          heldItemName: itemName,
        };
      }),
    });
  }
  if (!result?.caught || !result.lineId || !result.monsterId || !result.habitat) return normalized;

  const habitat = result.habitat;
  const habitatVisits = {
    ...normalized.habitatVisits,
    [habitat.id]: (normalized.habitatVisits[habitat.id] ?? 0) + 1,
  };

  const initialXP = typeof getXpForLevel === "function"
    ? getXpForLevel(result.level ?? 1)
    : 0;

  const monsters = [
    ...normalized.monsters,
    createMonsterInstance({
      id: result.monsterId,
      lineId: result.lineId,
      totalXP: initialXP,
      acquiredAt: habitat.id,
    }),
  ];

  const next = normalizeMonsterCollection({ ...normalized, habitatVisits, monsters });
  const cleanedPartyIds = next.partyIds.map(id => (id === result.monsterId ? null : id));
  const cleanedActiveId = next.activeId === result.monsterId ? (cleanedPartyIds.find(Boolean) ?? null) : next.activeId;

  return { ...next, partyIds: cleanedPartyIds, activeId: cleanedActiveId };
}

export const CAPTURE_RATES_BY_GRADE: Record<string, number> = {
  D: 0.1,
  C: 0.3,
  B: 0.5,
  A: 0.7,
  S: 1,
};

const ITEM_PICKUP_PROBABILITY = 0.3;
const LATEST_HABITAT_PROBABILITY = 0.4;

export interface Encounter {
  speciesId: number;
  minLevel: number;
  maxLevel: number;
  rate: number;
  lineId?: string;
}

export interface Habitat {
  id: string;
  name: string;
  minPool: number;
  encounters: Encounter[];
}

export const HABITATS: Habitat[] = [
  {
    id: "elmuria",
    name: "エルムリア",
    minPool: 60,
    encounters: [
      { speciesId: 16, minLevel: 2, maxLevel: 5,  rate: 50 },
      { speciesId: 19, minLevel: 2, maxLevel: 4,  rate: 50 },
      { speciesId: 19, minLevel: 2, maxLevel: 5,  rate: 45 },
      { speciesId: 56, minLevel: 2, maxLevel: 5,  rate: 45 },
      { speciesId: 21, minLevel: 3, maxLevel: 5,  rate: 10 },
      { speciesId: 16, minLevel: 2, maxLevel: 5,  rate: 45 },
      { speciesId: 19, minLevel: 2, maxLevel: 5,  rate: 45 },
      { speciesId: 10, minLevel: 4, maxLevel: 5,  rate:  5 },
      { speciesId: 13, minLevel: 4, maxLevel: 5,  rate:  5 },
      { speciesId: 10, minLevel: 3, maxLevel: 5,  rate: 40 },
      { speciesId: 11, minLevel: 4, maxLevel: 6,  rate: 7.5 },
      { speciesId: 13, minLevel: 3, maxLevel: 5,  rate: 40 },
      { speciesId: 14, minLevel: 4, maxLevel: 6,  rate:  7.5 },
      { speciesId: 25, minLevel: 3, maxLevel: 5,  rate:  5 },
    ],
  },
  {
    id: "everstep",
    name: "エバーステップ",
    minPool: 120,
    encounters: [
      { speciesId: 21, minLevel: 6, maxLevel: 8,  rate: 35 },
      { speciesId: 16, minLevel: 6, maxLevel: 7,  rate: 30 },
      { speciesId: 39, minLevel: 3, maxLevel: 7,  rate: 10 },
      { speciesId: 56, minLevel: 7, maxLevel: 7,  rate: 10 },
      { speciesId: 29, minLevel: 6, maxLevel: 7,  rate: 10 },
      { speciesId: 32, minLevel: 6, maxLevel: 7,  rate:  5 },
      { speciesId: 19, minLevel:  8, maxLevel: 12, rate: 35 },
      { speciesId: 21, minLevel:  8, maxLevel: 12, rate: 35 },
      { speciesId: 23, minLevel:  6, maxLevel: 12, rate: 15 },
      { speciesId: 27, minLevel:  6, maxLevel: 12, rate: 15 },
      { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 },
      { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 },
      { speciesId: 43, minLevel: 13, maxLevel: 16, rate: 25 },
      { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 },
      { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 },
      { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 },
      { speciesId: 69, minLevel: 13, maxLevel: 16, rate: 25 },
      { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 },
      { speciesId: 21, minLevel: 20, maxLevel: 22, rate: 30 },
      { speciesId: 22, minLevel: 25, maxLevel: 29, rate: 15 },
      { speciesId: 84, minLevel: 24, maxLevel: 28, rate: 35 },
      { speciesId: 19, minLevel: 22, maxLevel: 22, rate: 5 },
      { speciesId: 20, minLevel: 25, maxLevel: 29, rate: 15 },
    ],
  },
  {
    id: "apple-town",
    name: "アップルタウン",
    minPool: 180,
    encounters: [
      { speciesId: 32,  minLevel: 22, maxLevel: 30, rate: 20 },
      { speciesId: 46,  minLevel: 22, maxLevel: 30, rate: 15 },
      { speciesId: 111, minLevel: 25, maxLevel: 26, rate: 20 },
      { speciesId: 102, minLevel: 23, maxLevel: 27, rate: 20 },
      { speciesId: 84,  minLevel: 26, maxLevel: 26, rate:  5 },
      { speciesId: 113, minLevel: 23, maxLevel: 26, rate:  5 },
      { speciesId: 115, minLevel: 25, maxLevel: 28, rate:  5 },
      { speciesId: 128, minLevel: 25, maxLevel: 28, rate:  5 },
      { speciesId: 123, minLevel: 23, maxLevel: 27, rate:  5 },
      { speciesId: 29,  minLevel: 22, maxLevel: 30, rate: 20 },
      { speciesId: 46,  minLevel: 22, maxLevel: 30, rate: 15 },
      { speciesId: 111, minLevel: 25, maxLevel: 26, rate: 20 },
      { speciesId: 102, minLevel: 23, maxLevel: 27, rate: 20 },
      { speciesId: 84,  minLevel: 26, maxLevel: 26, rate:  5 },
      { speciesId: 113, minLevel: 23, maxLevel: 26, rate:  5 },
      { speciesId: 115, minLevel: 25, maxLevel: 28, rate:  5 },
      { speciesId: 128, minLevel: 25, maxLevel: 28, rate:  5 },
      { speciesId: 127, minLevel: 23, maxLevel: 27, rate:  5 },
    ],
  },
  {
    id: "old-smoke",
    name: "オールドスモーク",
    minPool: 240,
    encounters: [
      { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 },
      { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 },
      { speciesId: 43, minLevel: 13, maxLevel: 16, rate: 25 },
      { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 },
      { speciesId: 16, minLevel: 13, maxLevel: 16, rate: 40 },
      { speciesId: 52, minLevel: 10, maxLevel: 16, rate: 25 },
      { speciesId: 69, minLevel: 13, maxLevel: 16, rate: 25 },
      { speciesId: 56, minLevel: 13, maxLevel: 16, rate: 10 },
      { speciesId: 21, minLevel: 13, maxLevel: 17, rate: 35 },
      { speciesId: 96, minLevel: 11, maxLevel: 15, rate: 25 },
      { speciesId: 23, minLevel: 12, maxLevel: 15, rate: 20 },
      { speciesId: 27, minLevel: 12, maxLevel: 15, rate: 20 },
      { speciesId: 43, minLevel: 22, maxLevel: 26, rate: 35 },
      { speciesId: 48, minLevel: 24, maxLevel: 26, rate: 30 },
      { speciesId: 16, minLevel: 23, maxLevel: 29, rate: 20 },
      { speciesId: 17, minLevel: 29, maxLevel: 29, rate: 5 },
      { speciesId: 44, minLevel: 22, maxLevel: 26, rate: 5 },
      { speciesId: 132, minLevel: 25, maxLevel: 25, rate: 5 },
      { speciesId: 69, minLevel: 22, maxLevel: 30, rate: 35 },
      { speciesId: 48, minLevel: 24, maxLevel: 26, rate: 30 },
      { speciesId: 16, minLevel: 23, maxLevel: 29, rate: 20 },
      { speciesId: 17, minLevel: 29, maxLevel: 29, rate: 5 },
      { speciesId: 70, minLevel: 22, maxLevel: 26, rate: 5 },
      { speciesId: 132, minLevel: 25, maxLevel: 25, rate: 5 },
    ],
  },
  {
    id: "kapadra-cave",
    name: "カパドラ洞窟",
    minPool: 320,
    encounters: [
      { speciesId: 50, minLevel: 15, maxLevel: 31, rate: 95 },
      { speciesId: 51, minLevel: 26, maxLevel: 29, rate:  5 },
      { speciesId: 41, minLevel: 15, maxLevel: 16, rate: 35 },
      { speciesId: 74, minLevel: 15, maxLevel: 17, rate: 35 },
      { speciesId: 66, minLevel: 16, maxLevel: 17, rate: 15 },
      { speciesId: 95, minLevel: 13, maxLevel: 17, rate: 10 },
      { speciesId: 56, minLevel: 16, maxLevel: 17, rate:  5 },
    ],
  },
  {
    id: "alb-peak",
    name: "アルバピーク",
    minPool: 400,
    encounters: [
      { speciesId: 41, minLevel: 22, maxLevel: 30, rate: 10 },
      { speciesId: 42, minLevel: 22, maxLevel: 30, rate: 10 },
      { speciesId: 54, minLevel: 26, maxLevel: 33, rate: 10 },
      { speciesId: 55, minLevel: 26, maxLevel: 33, rate: 7.5 },
      { speciesId: 79, minLevel: 26, maxLevel: 33, rate: 10 },
      { speciesId: 80, minLevel: 26, maxLevel: 33, rate: 7.5 },
      { speciesId: 86, minLevel: 30, maxLevel: 32, rate: 40 },
      { speciesId: 87, minLevel: 32, maxLevel: 34, rate: 15 },
    ],
  },
  {
    id: "hoshi-no-kumoi",
    name: "ほしのくもい",
    minPool: 480,
    encounters: [
      { speciesId: 41, minLevel:  7, maxLevel: 11, rate: 49 },
      { speciesId: 74, minLevel:  7, maxLevel: 10, rate: 30 },
      { speciesId: 46, minLevel:  5, maxLevel: 12, rate: 15 },
      { speciesId: 35, minLevel:  8, maxLevel: 12, rate:  6 },
    ],
  },
  {
    id: "eterna-desert",
    name: "エテルナ砂漠",
    minPool: 580,
    encounters: [
      { speciesId: 21, minLevel: 13, maxLevel: 17, rate: 35 },
      { speciesId: 19, minLevel: 14, maxLevel: 17, rate: 30 },
      { speciesId: 23, minLevel: 11, maxLevel: 17, rate: 25 },
      { speciesId: 27, minLevel: 11, maxLevel: 17, rate: 10 },
      { speciesId: 21, minLevel: 13, maxLevel: 17, rate: 35 },
      { speciesId: 19, minLevel: 14, maxLevel: 17, rate: 30 },
      { speciesId: 27, minLevel: 11, maxLevel: 17, rate: 25 },
      { speciesId: 23, minLevel: 11, maxLevel: 17, rate: 10 },
      { speciesId: 100, minLevel: 14, maxLevel: 17, rate: 40 },
      { speciesId: 21,  minLevel: 13, maxLevel: 17, rate: 35 },
      { speciesId: 23,  minLevel: 11, maxLevel: 17, rate: 25 },
      { speciesId: 100, minLevel: 14, maxLevel: 17, rate: 40 },
      { speciesId: 21,  minLevel: 13, maxLevel: 17, rate: 35 },
      { speciesId: 27,  minLevel: 11, maxLevel: 17, rate: 25 },
    ],
  },
  {
    id: "great-firefly-city",
    name: "大流蛍楼宇",
    minPool: 700,
    encounters: [
      { speciesId: 92, minLevel: 13, maxLevel: 19, rate: 75 },
      { speciesId: 93, minLevel: 13, maxLevel: 19, rate: 15 },
      { speciesId: 104, minLevel: 15, maxLevel: 19, rate: 10 },
      { speciesId: 81,  minLevel: 22, maxLevel: 25, rate: 30},
      { speciesId: 82,  minLevel: 31, maxLevel: 34, rate: 10 },
      { speciesId: 100, minLevel: 22, maxLevel: 25, rate: 35 },
      { speciesId: 25,  minLevel: 22, maxLevel: 26, rate: 20 },
      { speciesId: 125, minLevel: 32, maxLevel: 35, rate:  5 },
      { speciesId: 16, minLevel: 19, maxLevel: 22, rate: 30 },
      { speciesId: 43, minLevel: 19, maxLevel: 22, rate: 30 },
      { speciesId: 52, minLevel: 17, maxLevel: 20, rate: 20 },
      { speciesId: 58, minLevel: 18, maxLevel: 20, rate: 20 },
      { speciesId: 16, minLevel: 19, maxLevel: 22, rate: 30 },
      { speciesId: 69, minLevel: 19, maxLevel: 22, rate: 30 },
      { speciesId: 52, minLevel: 17, maxLevel: 20, rate: 20 },
      { speciesId: 37, minLevel: 18, maxLevel: 20, rate: 20 },
      { speciesId: 16, minLevel: 18, maxLevel: 20, rate: 30 },
      { speciesId: 52, minLevel: 18, maxLevel: 20, rate: 30 },
      { speciesId: 58, minLevel: 15, maxLevel: 18, rate: 20 },
      { speciesId: 23, minLevel: 17, maxLevel: 19, rate: 20 },
      { speciesId: 16, minLevel: 18, maxLevel: 20, rate: 30 },
      { speciesId: 52, minLevel: 18, maxLevel: 20, rate: 30 },
      { speciesId: 37, minLevel: 15, maxLevel: 18, rate: 20 },
      { speciesId: 27, minLevel: 17, maxLevel: 19, rate: 20 },
    ],
  },
  {
    id: "ultra-blue",
    name: "ウルトラブルー",
    minPool: 850,
    encounters: [
      { speciesId: 43, minLevel: 12, maxLevel: 14, rate: 25 },
      { speciesId: 10, minLevel:  7, maxLevel:  7, rate: 21 },
      { speciesId: 13, minLevel:  7, maxLevel:  7, rate: 24 },
      { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 },
      { speciesId: 63, minLevel:  8, maxLevel: 12, rate: 15 },
      { speciesId: 69, minLevel: 12, maxLevel: 14, rate: 25 },
      { speciesId: 10, minLevel:  7, maxLevel:  7, rate: 24 },
      { speciesId: 13, minLevel:  7, maxLevel:  7, rate: 21 },
      { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 },
      { speciesId: 63, minLevel:  8, maxLevel: 12, rate: 15 },
      { speciesId: 43, minLevel: 12, maxLevel: 14, rate: 25 },
      { speciesId: 10, minLevel:  8, maxLevel:  8, rate: 21 },
      { speciesId: 13, minLevel:  8, maxLevel:  8, rate: 24 },
      { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 },
      { speciesId: 63, minLevel:  9, maxLevel: 13, rate: 15 },
      { speciesId: 69, minLevel: 12, maxLevel: 14, rate: 25 },
      { speciesId: 10, minLevel:  8, maxLevel:  8, rate: 24 },
      { speciesId: 13, minLevel:  8, maxLevel:  8, rate: 21 },
      { speciesId: 16, minLevel: 11, maxLevel: 13, rate: 15 },
      { speciesId: 63, minLevel:  9, maxLevel: 13, rate: 15 },
      { speciesId: 72, minLevel: 5,  maxLevel: 40, rate: 95 },
      { speciesId: 73, minLevel: 30, maxLevel: 40, rate:  5 },
      { speciesId: 129, minLevel: 5, maxLevel: 5, rate: 100 },
      { speciesId: 129, minLevel: 10, maxLevel: 20, rate: 35 },
      { speciesId: 118, minLevel: 10, maxLevel: 20, rate: 25 },
      { speciesId: 60,  minLevel: 10, maxLevel: 20, rate: 15 },
      { speciesId: 72,  minLevel: 15, maxLevel: 25, rate: 10 },
      { speciesId: 116, minLevel: 15, maxLevel: 25, rate:  5 },
      { speciesId: 98,  minLevel: 15, maxLevel: 25, rate:  5 },
      { speciesId: 54,  minLevel: 15, maxLevel: 25, rate:  5 },
    ],
  },
  {
    id: "tarasys-temple",
    name: "タラシス海底神殿",
    minPool: 1000,
    encounters: [
      { speciesId: 130, minLevel: 20, maxLevel: 40, rate: 15 },
      { speciesId: 119, minLevel: 33, maxLevel: 45, rate: 15 },
      { speciesId: 61,  minLevel: 25, maxLevel: 40, rate: 15 },
      { speciesId: 99,  minLevel: 28, maxLevel: 45, rate: 10 },
      { speciesId: 117, minLevel: 32, maxLevel: 45, rate: 10 },
      { speciesId: 73,  minLevel: 30, maxLevel: 45, rate: 10 },
      { speciesId: 90,  minLevel: 15, maxLevel: 35, rate:  6 },
      { speciesId: 120, minLevel: 15, maxLevel: 35, rate:  6 },
      { speciesId: 54,  minLevel: 25, maxLevel: 35, rate:  6 },
      { speciesId: 79,  minLevel: 25, maxLevel: 35, rate:  6 },
      { speciesId: 148, minLevel: 30, maxLevel: 40, rate:  1 },
    ],
  },
  {
    id: "la-amaranta",
    name: "ラ・アマランタ",
    minPool: 1150,
    encounters: [
      { speciesId: 19,  minLevel: 26, maxLevel: 28, rate: 15 },
      { speciesId: 20,  minLevel: 32, maxLevel: 36, rate: 30 },
      { speciesId: 109, minLevel: 28, maxLevel: 28, rate: 35 },
      { speciesId: 110, minLevel: 32, maxLevel: 32, rate: 5 },
      { speciesId: 58,  minLevel: 30, maxLevel: 32, rate: 15 },
      { speciesId: 126, minLevel: 34, maxLevel: 36, rate: 5 },
      { speciesId: 19,  minLevel: 26, maxLevel: 28, rate: 15 },
      { speciesId: 20,  minLevel: 32, maxLevel: 36, rate: 30 },
      { speciesId: 88,  minLevel: 28, maxLevel: 30, rate: 35 },
      { speciesId: 89,  minLevel: 30, maxLevel: 32, rate: 5 },
      { speciesId: 37,  minLevel: 30, maxLevel: 32, rate: 15 },
      { speciesId: 126, minLevel: 34, maxLevel: 36, rate: 5 },
    ],
  },
  {
    id: "schwanburg-castle",
    name: "シュヴァンブルク城",
    minPool: 1280,
    encounters: [
      { speciesId: 66, minLevel: 32, maxLevel: 32, rate: 20 },
      { speciesId: 67, minLevel: 44, maxLevel: 46, rate: 5 },
      { speciesId: 74, minLevel: 32, maxLevel: 32, rate: 15 },
      { speciesId: 41, minLevel: 32, maxLevel: 32, rate: 10 },
      { speciesId: 42, minLevel: 44, maxLevel: 44, rate: 5 },
      { speciesId: 95, minLevel: 40, maxLevel: 46, rate: 25 },
      { speciesId: 24, minLevel: 44, maxLevel: 44, rate: 5 },
      { speciesId: 28, minLevel: 44, maxLevel: 44, rate: 5 },
      { speciesId: 105, minLevel: 44, maxLevel: 46, rate: 5 },
      { speciesId: 57, minLevel: 42, maxLevel: 42, rate: 5 },
    ],
  },
  {
    id: "kapadra-underground",
    name: "カパドラ地下帝国",
    minPool: 1380,
    encounters: [
      { speciesId: 41,  minLevel: 46, maxLevel: 61, rate: 20 },
      { speciesId: 46,  minLevel: 49, maxLevel: 64, rate: 10 },
      { speciesId: 63,  minLevel: 55, maxLevel: 67, rate: 10 },
      { speciesId: 66,  minLevel: 46, maxLevel: 52, rate: 10 },
      { speciesId: 132, minLevel: 52, maxLevel: 67, rate: 10 },
      { speciesId: 100, minLevel: 58, maxLevel: 64, rate: 10 },
      { speciesId: 104, minLevel: 46, maxLevel: 67, rate: 10 },
      { speciesId: 111, minLevel: 46, maxLevel: 67, rate: 10 },
      { speciesId: 113, minLevel: 46, maxLevel: 67, rate: 10 },
    ],
  },
];

function hashSeed(seed: string): number {
  let h = 2166136261;
  const text = String(seed ?? "capture");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRng(seed: string): () => number {
  let t = hashSeed(seed);
  return () => {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function getUnlockedHabitats(unlockedPoolSize: number, habitats = HABITATS): Habitat[] {
  const poolSize = Number(unlockedPoolSize);
  return habitats.filter(habitat => Number.isFinite(poolSize) && poolSize >= habitat.minPool);
}

export function getHabitatMinPoolMap(habitats = HABITATS): Record<string, number> {
  return Object.fromEntries(habitats.map(habitat => [habitat.id, habitat.minPool]));
}

export interface WeightedEncounter {
  lineId: string;
  weight: number;
  minLevel: number;
  maxLevel: number;
}

export function normalizeEncounters(encounters: Encounter[] | undefined): WeightedEncounter[] {
  if (!Array.isArray(encounters)) return [];

  const merged = new Map<string, WeightedEncounter>();
  for (const encounter of encounters) {
    const rate = Number(encounter.rate);
    if (!Number.isFinite(rate) || rate <= 0) continue;

    const lineId = encounter.lineId ?? getLineIdBySpeciesId(encounter.speciesId);
    if (!lineId) continue;

    const line = getMonsterLine(lineId);
    const defaultMinLevel = line?.species?.[0]?.minLevel ?? 1;
    const rawMinLevel = Number(encounter.minLevel);
    const rawMaxLevel = Number(encounter.maxLevel);
    const minLevel = Number.isFinite(rawMinLevel) ? rawMinLevel : defaultMinLevel;
    const maxLevel = Number.isFinite(rawMaxLevel) ? rawMaxLevel : minLevel;
    const normalizedMin = Math.min(minLevel, maxLevel);
    const normalizedMax = Math.max(minLevel, maxLevel);
    const key = `${lineId}:${normalizedMin}:${normalizedMax}`;
    const current = merged.get(key);

    if (current) {
      current.weight += rate;
    } else {
      merged.set(key, {
        lineId,
        weight: rate,
        minLevel: normalizedMin,
        maxLevel: normalizedMax,
      });
    }
  }

  return [...merged.values()];
}

function pickWeighted<T>(items: T[], getWeight: (item: T) => number, rng: () => number): T | null {
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

export function pickHabitat({
  unlockedPoolSize,
  habitatVisits = {},
  rng,
  habitats = HABITATS
}: {
  unlockedPoolSize: number;
  habitatVisits?: Record<string, number>;
  rng: () => number;
  habitats?: Habitat[];
}): Habitat | null {
  const unlocked = getUnlockedHabitats(unlockedPoolSize, habitats);
  const latest = unlocked.at(-1) ?? null;
  const previousHabitats = latest
    ? unlocked.filter(habitat => habitat.id !== latest.id)
    : [];

  if (!latest) return null;
  if (previousHabitats.length === 0 || rng() < LATEST_HABITAT_PROBABILITY) {
    return latest;
  }

  return pickWeighted(
    previousHabitats,
    habitat => 1 / (1 + Math.max(0, Number(habitatVisits[habitat.id]) || 0)),
    rng,
  );
}

export function pickEncounterLine(habitat: Habitat, rng: () => number): WeightedEncounter | null {
  const encounters = normalizeEncounters(habitat?.encounters);
  return pickWeighted(encounters, encounter => encounter.weight, rng);
}

interface RollCaptureEncounterProps {
  grade: string;
  unlockedPoolSize: number;
  habitatVisits?: Record<string, number>;
  seed: string;
  habitat?: Habitat | null;
  habitats?: Habitat[];
  monsterCollection?: MonsterCollection | null;
}

export function rollCaptureEncounter({
  grade,
  unlockedPoolSize,
  habitatVisits = {},
  seed,
  habitat: selectedHabitat = null,
  habitats = HABITATS,
  monsterCollection = null,
}: RollCaptureEncounterProps): CaptureResult {
  const rng = createSeededRng(seed);
  const captureRate = CAPTURE_RATES_BY_GRADE[grade] ?? 0;
  const itemPickup = monsterCollection ? getItemEvolutionPickup(monsterCollection, rng) : null;

  if (itemPickup && rng() < ITEM_PICKUP_PROBABILITY) {
    return {
      caught: false,
      captureRate,
      captureRoll: null,
      reason: "item-drop",
      itemPickup,
    };
  }

  const habitat = selectedHabitat ?? pickHabitat({ unlockedPoolSize, habitatVisits, rng, habitats });
  if (!habitat) {
    return {
      caught: false,
      captureRate,
      captureRoll: null,
      reason: "no-habitat",
    };
  }

  const encounter = pickEncounterLine(habitat, rng);
  if (!encounter) {
    return {
      caught: false,
      captureRate,
      captureRoll: null,
      habitat: { id: habitat.id, name: habitat.name },
      reason: "no-encounter",
    };
  }

  const rawMin = Number(encounter.minLevel);
  const rawMax = Number(encounter.maxLevel);
  const minLvl = Number.isFinite(rawMin) ? rawMin : 1;
  const maxLvl = Number.isFinite(rawMax) ? rawMax : minLvl;
  const actualMin = Math.min(minLvl, maxLvl);
  const actualMax = Math.max(minLvl, maxLvl);
  const generatedLevel = actualMin + Math.floor(rng() * (actualMax - actualMin + 1));
  const captureRoll = rng();
  const caught = captureRoll < captureRate;

  return {
    caught,
    captureRate,
    captureRoll,
    habitat: { id: habitat.id, name: habitat.name },
    lineId: encounter.lineId,
    encounterWeight: encounter.weight,
    level: generatedLevel,
    speciesId: getSpecies(generatedLevel, encounter.lineId).id,
    monsterId: `caught-${encounter.lineId}-${Math.floor(rng() * 1e9).toString(36)}`,
    reason: caught ? undefined : "missed",
  };
}
