import {
  createSeededRng,
  pickEncounterLine,
  pickHabitat,
  HABITATS,
  Habitat,
} from "./capture";
import {
  getMonsterDisplayState,
  getMonsterLine,
  getPartySlots,
  getSpecies,
} from "./monster";
import {
  Mission,
  areAllMissionsDone,
  generateMissions,
  normalizeMission,
} from "./missions";
import { MonsterCollection } from "./types";

/**
 * 野生エンカウントのHPモデル。
 *
 * - 正解するたびに手持ちの強さに応じたダメージが入り、HPが減る
 * - HPが尽きる前に全ミッションを達成できれば捕獲
 * - 先にHPが尽きたら倒してしまい、逃げられる（捕獲失敗）
 *
 * 手持ちが強い・多いほどHPが早く尽きるため、強力なパーティは
 * 捕獲の時間的猶予が短くなる（あえて弱い手持ちで挑む駆け引きが生まれる）。
 * これにより「雑魚の乱獲」は起こらず、捕獲は常にミッション達成の報酬になる。
 */

/** バトル（ダメージ計算）に参加する手持ち枠数。ドックに表示される4体 */
export const BATTLE_PARTY_SIZE = 4;

/**
 * 遭遇率。非遭遇中は野生エティモンが不在（ミッション欄・敵モンスター欄なし）で、
 * 1問回答するごとにこの確率で遭遇し、現在地の生息地テーブルから出現する。
 */
export const ENCOUNTER_RATE = 0.35;

/** 非遭遇中の1問ごとの遭遇判定。遭遇率を参照してヒットしたら true を返す */
export function rollWildEncounter(rng: () => number = Math.random): boolean {
  return rng() < ENCOUNTER_RATE;
}

export type WildEncounterStatus = "active" | "captured" | "escaped";

export interface WildEncounterState {
  id: string;
  lineId: string;
  name: string;
  level: number;
  speciesId: number;
  sprite: string;
  fallbackSprite: string;
  maxHP: number;
  hp: number;
  habitatId: string;
  habitatName: string;
  missions: Mission[];
  status: WildEncounterStatus;
  spawnedAt: number;
}

/** バトル参加中の手持ち（先頭4枠の非空スロット） */
export function getBattleParty(collection: MonsterCollection) {
  return getPartySlots(collection)
    .slice(0, BATTLE_PARTY_SIZE)
    .filter((monster) => monster !== null);
}

/**
 * 1正解あたりのダメージ。手持ちの数とレベル合計に連動する。
 * レベルは平方根で減衰させ、高レベル帯でも捕獲猶予が極端に消えないようにする。
 */
export function getPartyAttackPower(collection: MonsterCollection): number {
  const party = getBattleParty(collection);
  const levelSum = party.reduce(
    (sum, monster) => sum + getMonsterDisplayState(monster).level,
    0,
  );
  return 3 + party.length * 2 + Math.round(Math.sqrt(levelSum) * 2);
}

/**
 * 出現エティモンの最大HP。レベルに比例して増える。
 * 「1日かけてミッションを消化する」想定なので、平均的な手持ちで
 * 数プレイ（数十問の正解）ぶん持ちこたえる量にしている。
 */
export function getMaxHPForLevel(level: number): number {
  const safeLevel = Number.isFinite(level) ? Math.max(1, level) : 1;
  return 120 + Math.floor(safeLevel * 18);
}

export interface SpawnWildEncounterOptions {
  unlockedPoolSize: number;
  habitatVisits?: Record<string, number>;
  seed: string;
  habitat?: Habitat | { id: string; name: string } | null;
  habitats?: Habitat[];
  collection: MonsterCollection;
  /** ミッション生成のパラメータ（省略時は collection から導出） */
  rng?: () => number;
}

/**
 * 新しい野生エティモンを出現させ、ミッションを積む。
 * 生息地・出現テーブルは既存の capture.ts のものを流用する。
 */
export function spawnWildEncounter({
  unlockedPoolSize,
  habitatVisits = {},
  seed,
  habitat: preferredHabitat = null,
  habitats = HABITATS,
  collection,
  rng,
}: SpawnWildEncounterOptions): WildEncounterState | null {
  const random = rng ?? createSeededRng(seed);

  const habitat =
    (preferredHabitat &&
      habitats.find((candidate) => candidate.id === preferredHabitat.id)) ||
    pickHabitat({ unlockedPoolSize, habitatVisits, rng: random, habitats });
  if (!habitat) return null;

  const encounter = pickEncounterLine(habitat, random);
  if (!encounter) return null;

  const rawMin = Number(encounter.minLevel);
  const rawMax = Number(encounter.maxLevel);
  const minLevel = Number.isFinite(rawMin) ? rawMin : 1;
  const maxLevel = Number.isFinite(rawMax) ? rawMax : minLevel;
  const lower = Math.min(minLevel, maxLevel);
  const upper = Math.max(minLevel, maxLevel);
  const level = lower + Math.floor(random() * (upper - lower + 1));

  const species = getSpecies(level, encounter.lineId);
  const line = getMonsterLine(encounter.lineId);

  const party = getBattleParty(collection);
  const partyMaxLevel = party.reduce(
    (max, monster) => Math.max(max, getMonsterDisplayState(monster).level),
    0,
  );
  const ownedLineIds = [
    ...new Set(collection.monsters.map((monster) => monster.lineId)),
  ];

  const missions = generateMissions({
    level,
    ownedLineIds,
    getLineName: (lineId) => getMonsterLine(lineId)?.name ?? lineId,
    partyMaxLevel,
    rng: random,
  });

  const maxHP = getMaxHPForLevel(level);
  return {
    id: `wild-${encounter.lineId}-${Math.floor(random() * 1e9).toString(36)}`,
    lineId: encounter.lineId,
    name: line?.name ?? species.name,
    level,
    speciesId: species.id,
    sprite: species.sprite,
    fallbackSprite: species.fallbackSprite,
    maxHP,
    hp: maxHP,
    habitatId: habitat.id,
    habitatName: habitat.name,
    missions,
    status: "active",
    spawnedAt: Date.now(),
  };
}

/**
 * 正解によるダメージを与える。HPが尽きたら倒してしまい「逃げられた」状態になる。
 */
export function applyDamageToEncounter(
  encounter: WildEncounterState,
  damage: number,
): { encounter: WildEncounterState; escaped: boolean } {
  if (encounter.status !== "active") return { encounter, escaped: false };
  const safeDamage = Number.isFinite(damage) ? Math.max(0, Math.floor(damage)) : 0;
  const hp = Math.max(0, encounter.hp - safeDamage);
  if (hp <= 0) {
    return {
      encounter: { ...encounter, hp: 0, status: "escaped" },
      escaped: true,
    };
  }
  return { encounter: { ...encounter, hp }, escaped: false };
}

/**
 * 全ミッション達成なら捕獲を確定し、コレクション反映用の捕獲結果を返す。
 * （applyCaptureResultToCollection にそのまま渡せる形式）
 */
export function tryCaptureEncounter(encounter: WildEncounterState): {
  encounter: WildEncounterState;
  capture: {
    caught: true;
    lineId: string;
    level: number;
    speciesId: number;
    monsterId: string;
    habitat: { id: string; name: string };
  } | null;
} {
  if (encounter.status !== "active" || !areAllMissionsDone(encounter.missions)) {
    return { encounter, capture: null };
  }
  return {
    encounter: { ...encounter, status: "captured" },
    capture: {
      caught: true,
      lineId: encounter.lineId,
      level: encounter.level,
      speciesId: encounter.speciesId,
      monsterId: `caught-${encounter.lineId}-${encounter.id.slice(-8)}`,
      habitat: { id: encounter.habitatId, name: encounter.habitatName },
    },
  };
}

/** localStorage 復元用。壊れたデータや終了済みエンカウントは null を返す */
export function normalizeWildEncounter(input: unknown): WildEncounterState | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  if (raw.status !== "active") return null;
  if (typeof raw.id !== "string" || typeof raw.lineId !== "string") return null;

  const level = Number(raw.level);
  const maxHP = Number(raw.maxHP);
  const hp = Number(raw.hp);
  if (!Number.isFinite(level) || level < 1) return null;
  if (!Number.isFinite(maxHP) || maxHP <= 0) return null;
  if (!Number.isFinite(hp) || hp <= 0) return null;

  // getMonsterLine は未知IDをデフォルトラインへフォールバックするため、
  // IDの一致まで確認して壊れたデータの別ライン化を防ぐ
  const line = getMonsterLine(raw.lineId);
  if (!line || line.id !== raw.lineId) return null;
  const species = getSpecies(level, raw.lineId);

  const missions = Array.isArray(raw.missions)
    ? (raw.missions.map(normalizeMission).filter(Boolean) as Mission[])
    : [];
  if (missions.length === 0) return null;

  return {
    id: raw.id,
    lineId: raw.lineId,
    name: typeof raw.name === "string" ? raw.name : line.name,
    level: Math.floor(level),
    speciesId: species.id,
    sprite: species.sprite,
    fallbackSprite: species.fallbackSprite,
    maxHP: Math.floor(maxHP),
    hp: Math.min(Math.floor(hp), Math.floor(maxHP)),
    habitatId: typeof raw.habitatId === "string" ? raw.habitatId : "",
    habitatName: typeof raw.habitatName === "string" ? raw.habitatName : "",
    missions,
    status: "active",
    spawnedAt: Number.isFinite(Number(raw.spawnedAt))
      ? Number(raw.spawnedAt)
      : Date.now(),
  };
}
