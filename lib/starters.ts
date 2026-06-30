import {
  createMonsterInstance,
  getMonsterLine,
  getSpecies,
  normalizeMonsterCollection,
  PARTY_SIZE,
  totalXPForLevel,
} from "./monster";
import { MonsterCollection, StoryProgress, Battle } from "./types";

export const STARTER_LINE_IDS = ["bulbasaur", "charmander", "squirtle"];

export const RIVAL_COUNTER_STARTER: Record<string, string> = {
  bulbasaur: "charmander",
  charmander: "squirtle",
  squirtle: "bulbasaur",
};

export const RIVAL_STARTER_MARKER = "__rival_starter__";

const RIVAL_STARTER_LEVELS: Record<string, number> = {
  "rival-1": 5,
  "rival-2": 9,
  "rival-3": 18,
  "rival-4": 22,
  "rival-5": 25,
  "rival-6": 32,
  "rival-7": 47,
  "champion-rival": 61,
};

export function isStarterLineId(lineId: string): boolean {
  return STARTER_LINE_IDS.includes(lineId);
}

export function getRivalCounterStarter(lineId: string): string | null {
  return RIVAL_COUNTER_STARTER[lineId] ?? null;
}

export function collectionHasLineId(collection: MonsterCollection, lineId: string): boolean {
  return normalizeMonsterCollection(collection).monsters.some(monster => monster.lineId === lineId);
}

export function countOwnedStarters(collection: MonsterCollection): number {
  return STARTER_LINE_IDS.filter(lineId => collectionHasLineId(collection, lineId)).length;
}

export function isRivalBattleId(battleId: string): boolean {
  return typeof battleId === "string" && (battleId.startsWith("rival-") || battleId === "champion-rival");
}

export function needsStarterChoice(progress: StoryProgress, battleId = "rival-1"): boolean {
  const normalized = progress ?? {};
  return battleId === "rival-1" && !normalized.chosenStarterLineId;
}

export function resolveBattleForProgress(battle: Battle, progress: StoryProgress): Battle {
  if (!battle || !isRivalBattleId(battle.id) || !progress?.rivalStarterLineId) {
    return battle;
  }

  const rivalLineId = progress.rivalStarterLineId;
  const starterLevel = RIVAL_STARTER_LEVELS[battle.id] ?? 5;
  const party = battle.party.map((slot: any) => {
    if (slot.lineId === RIVAL_STARTER_MARKER || isStarterLineId(slot.lineId)) {
      return { lineId: rivalLineId, level: starterLevel };
    }
    return slot;
  });

  return { ...battle, party };
}

export function createStarterMonster(lineId: string, { level = 5, acquiredAt = "oak-starter" } = {}): any {
  return createMonsterInstance({
    id: `starter-${lineId}`,
    lineId,
    totalXP: totalXPForLevel(level),
    acquiredAt,
  });
}

export function applyStarterChoice(
  collection: MonsterCollection,
  progress: StoryProgress,
  chosenLineId: string,
): { collection: MonsterCollection; progress: StoryProgress } {
  if (!isStarterLineId(chosenLineId)) {
    return { collection: normalizeMonsterCollection(collection), progress };
  }

  const rivalLineId = getRivalCounterStarter(chosenLineId)!;
  const starter = createStarterMonster(chosenLineId);
  const normalized = normalizeMonsterCollection(collection);
  const withoutOldStarters = normalized.monsters.filter(monster => !isStarterLineId(monster.lineId));

  const nextCollection = normalizeMonsterCollection({
    ...normalized,
    activeId: starter.id,
    partyIds: [starter.id, null, null, null, null, null],
    monsters: [...withoutOldStarters, starter],
  });

  const nextProgress: StoryProgress = {
    ...progress,
    chosenStarterLineId: chosenLineId,
    rivalStarterLineId: rivalLineId,
  };

  return { collection: nextCollection, progress: nextProgress };
}

function pickRandomStarterLineId(rng = Math.random): string {
  return STARTER_LINE_IDS[Math.floor(rng() * STARTER_LINE_IDS.length)];
}

function inferChosenStarterFromCollection(collection: MonsterCollection): string | null {
  const normalized = normalizeMonsterCollection(collection);
  const active = normalized.monsters.find(monster => monster.id === normalized.activeId);
  if (active && isStarterLineId(active.lineId)) return active.lineId;

  for (const lineId of STARTER_LINE_IDS) {
    if (collectionHasLineId(normalized, lineId)) return lineId;
  }
  return null;
}

export function migrateStarterState(
  collection: MonsterCollection,
  progress: StoryProgress,
  { rng = Math.random } = {},
): { collection: MonsterCollection; progress: StoryProgress } {
  const normalized = normalizeMonsterCollection(collection);
  let nextProgress = { ...progress };
  let nextCollection = normalized;

  if (nextProgress.chosenStarterLineId && isStarterLineId(nextProgress.chosenStarterLineId)) {
    if (!nextProgress.rivalStarterLineId) {
      const owned = countOwnedStarters(nextCollection);
      nextProgress.rivalStarterLineId = owned >= 3
        ? pickRandomStarterLineId(rng)
        : getRivalCounterStarter(nextProgress.chosenStarterLineId)!;
    }
    return { collection: nextCollection, progress: nextProgress };
  }

  const ownedCount = countOwnedStarters(nextCollection);
  if (ownedCount === 0) {
    return { collection: nextCollection, progress: nextProgress };
  }

  const inferred = inferChosenStarterFromCollection(nextCollection);
  if (!inferred) {
    return { collection: nextCollection, progress: nextProgress };
  }

  const starterMonster = normalizeMonsterCollection(nextCollection).monsters.find(m => m.lineId === inferred);
  let adjustedCollection = nextCollection;
  if (starterMonster) {
    const normalized = normalizeMonsterCollection(nextCollection);
    const partyIds = normalized.partyIds.slice(0, PARTY_SIZE);
    const idx = partyIds.indexOf(starterMonster.id);
    if (idx > 0) {
      [partyIds[0], partyIds[idx]] = [partyIds[idx], partyIds[0]];
    } else if (idx < 0) {
      partyIds[0] = starterMonster.id;
    }
    adjustedCollection = normalizeMonsterCollection({ ...normalized, activeId: starterMonster.id, partyIds });
  }

  nextProgress = {
    ...nextProgress,
    chosenStarterLineId: inferred,
    rivalStarterLineId: ownedCount >= 3
      ? pickRandomStarterLineId(rng)
      : getRivalCounterStarter(inferred)!,
  };

  return { collection: adjustedCollection, progress: nextProgress };
}

export function awardRivalStarterSeed(
  collection: MonsterCollection,
  progress: StoryProgress,
  { level = 5 } = {},
): { collection: MonsterCollection; progress: StoryProgress; awarded: any | null } {
  const rivalLineId = progress?.rivalStarterLineId;
  if (!rivalLineId || collectionHasLineId(collection, rivalLineId)) {
    return { collection: normalizeMonsterCollection(collection), progress, awarded: null };
  }

  const monster = createMonsterInstance({
    id: `gift-rival-starter-${rivalLineId}`,
    lineId: rivalLineId,
    totalXP: totalXPForLevel(level),
    acquiredAt: "rival-champion-gift",
  });

  const normalized = normalizeMonsterCollection(collection);
  return {
    collection: normalizeMonsterCollection({
      ...normalized,
      monsters: [...normalized.monsters, monster],
    }),
    progress,
    awarded: {
      lineId: rivalLineId,
      name: getMonsterLine(rivalLineId)!.name,
      sprite: getSpecies(level, rivalLineId).sprite,
      message: `ライバルから${getMonsterLine(rivalLineId)!.name}をもらった！`,
    },
  };
}

export function awardMissingProfessorStarters(
  collection: MonsterCollection,
  progress: StoryProgress,
  { level = 5 } = {},
): { collection: MonsterCollection; progress: StoryProgress; awarded: any[] } {
  if (!progress?.hallOfFame || progress?.professorStartersAwarded) {
    return { collection: normalizeMonsterCollection(collection), progress, awarded: [] };
  }

  const chosen = progress.chosenStarterLineId;
  const missing = STARTER_LINE_IDS.filter(
    lineId => lineId !== chosen && !collectionHasLineId(collection, lineId),
  );
  if (missing.length === 0) {
    return {
      collection: normalizeMonsterCollection(collection),
      progress: { ...progress, professorStartersAwarded: true },
      awarded: [],
    };
  }

  const normalized = normalizeMonsterCollection(collection);
  const monsters = [...normalized.monsters];
  const awarded = [];

  for (const lineId of missing) {
    const monster = createMonsterInstance({
      id: `gift-professor-starter-${lineId}`,
      lineId,
      totalXP: totalXPForLevel(level),
      acquiredAt: "professor-starter-gift",
    });
    monsters.push(monster);
    awarded.push({
      lineId,
      name: getMonsterLine(lineId)!.name,
      sprite: getSpecies(level, lineId).sprite,
      message: `博士から${getMonsterLine(lineId)!.name}をもらった！`,
    });
  }

  return {
    collection: normalizeMonsterCollection({ ...normalized, monsters }),
    progress: { ...progress, professorStartersAwarded: true },
    awarded,
  };
}

export function getStarterChoices(): any[] {
  return STARTER_LINE_IDS.map(lineId => {
    const line = getMonsterLine(lineId)!;
    const species = getSpecies(5, lineId);
    return { lineId, name: line.name, sprite: species.sprite };
  });
}
