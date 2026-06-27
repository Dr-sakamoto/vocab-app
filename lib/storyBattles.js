import { createMonsterInstance, getMonsterLine, getSpecies, normalizeMonsterCollection } from "./monster.js";
import { awardRivalStarterSeed, resolveBattleForProgress, RIVAL_STARTER_MARKER } from "./starters.js";

const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/crystal/animated";

const TRAINER_SPRITE_ROOT = "https://play.pokemonshowdown.com/sprites/trainers";

export const TRAINER_SPRITE_BY_BATTLE_ID = {
  "rival-1": "blue",
  "rival-2": "blue",
  "rival-3": "blue",
  "rival-4": "blue",
  "rival-5": "blue",
  "rival-6": "blue",
  "rival-7": "blue",
  brock: "brock",
  misty: "misty",
  surge: "ltsurge",
  erika: "erika",
  sabrina: "sabrina",
  blaine: "blaine",
  morty: "morty",
  "giovanni-1": "giovanni",
  "giovanni-2": "giovanni",
  "giovanni-3": "giovanni",
  "rocket-mt-moon": "teamrocket",
  "rocket-scout": "rocketgrunt",
  "rocket-thief": "rocketgrunt",
  "rocket-celadon": "teamrocket",
  "rocket-tower": "rocketgrunt",
  "rocket-silph": "teamrocket",
  "fossil-brother": "supernerd",
  "bridge-five": "youngster",
  dojo: "blackbelt",
  "elite-lorelei": "lorelei",
  "elite-bruno": "bruno",
  "elite-agatha": "agatha",
  "elite-lance": "lance",
  "champion-rival": "blue",
};

export const STORY_PROGRESS_STORAGE_KEY = "story-progress";

export const BATTLE_TIERS = {
  normal: { label: "トレーナー", winAccuracy: 0.6, xpMultiplier: 1.5, playLimit: 10 },
  rocket: { label: "ロケット団", winAccuracy: 0.55, xpMultiplier: 1.5, playLimit: 10, questionMode: "weakness" },
  gym: { label: "ジムリーダー", winAccuracy: 0.7, xpMultiplier: 1.8, playLimit: 10, blocksProgress: true },
  elite: { label: "四天王", winAccuracy: 0.75, xpMultiplier: 2.0, playLimit: 12, blocksProgress: true },
  champion: { label: "チャンピオン", winAccuracy: 0.8, xpMultiplier: 2.5, playLimit: 15, blocksProgress: true },
  symbol: { label: "シンボル", winAccuracy: 0.65, xpMultiplier: 1.6, playLimit: 10 },
  legendary: { label: "伝説", winAccuracy: 0.7, xpMultiplier: 2.2, playLimit: 12 },
  endurance: { label: "トラップ", winAccuracy: 0.55, xpMultiplier: 1.4, playLimit: 80 },
  chain: { label: "連戦", winAccuracy: 0.6, xpMultiplier: 1.5, playLimit: 50 },
};

/** @typedef {{ lineId: string, level: number }} BattlePokemon */

/**
 * @typedef {object} StoryBattle
 * @property {string} id
 * @property {string} name
 * @property {string} location
 * @property {keyof typeof BATTLE_TIERS} tier
 * @property {number} minPool
 * @property {number|null} [maxPool]
 * @property {string} [habitatId]
 * @property {string[]} [requiresDefeat]
 * @property {string[]} [requiresBadges]
 * @property {boolean} [optional]
 * @property {boolean} [boss]
 * @property {boolean} [reappearOnHabitat]
 * @property {boolean} [relocateOnDefeat]
 * @property {BattlePokemon[]} party
 * @property {object} [rewards]
 * @property {string} [preMessage]
 * @property {number} [firstEncounterGuaranteed]
 * @property {number} [reappearChance]
 */

export const STORY_BATTLES = [
  {
    id: "rival-1",
    name: "ライバル",
    location: "オーキド研究所",
    tier: "normal",
    minPool: 60,
    habitatId: "route-1",
    party: [{ lineId: RIVAL_STARTER_MARKER, level: 5 }],
    preMessage: "…おまえが　ポケモンを　えらぶのか",
  },
  {
    id: "rival-2",
    name: "ライバル",
    location: "22ばんどうろ",
    tier: "normal",
    minPool: 90,
    maxPool: 239,
    habitatId: "route-22",
    optional: true,
    party: [
      { lineId: "pidgey", level: 9 },
      { lineId: "rattata", level: 9 },
      { lineId: RIVAL_STARTER_MARKER, level: 9 },
    ],
  },
  {
    id: "brock",
    name: "タケシ",
    location: "ニビジム",
    tier: "gym",
    minPool: 120,
    habitatId: "route-2",
    boss: true,
    requiresDefeat: ["rival-1"],
    party: [
      { lineId: "geodude", level: 12 },
      { lineId: "onix", level: 14 },
    ],
    rewards: { badge: "グレー" },
  },
  {
    id: "rocket-mt-moon",
    name: "ムサシ＆コジロウ",
    location: "おつきみやま",
    tier: "rocket",
    minPool: 240,
    habitatId: "mt-moon",
    requiresDefeat: ["brock"],
    party: [
      { lineId: "ekans", level: 11 },
      { lineId: "koffing", level: 11 },
      { lineId: "meowth", level: 14 },
    ],
  },
  {
    id: "fossil-brother",
    name: "りかけいのおとこ",
    location: "おつきみやま",
    tier: "normal",
    minPool: 240,
    habitatId: "mt-moon",
    requiresDefeat: ["rocket-mt-moon"],
    party: [
      { lineId: "kabuto", level: 15 },
      { lineId: "omanyte", level: 15 },
      { lineId: "aerodactyl", level: 15 },
    ],
    rewards: { fossilItem: true },
  },
  {
    id: "rival-3",
    name: "ライバル",
    location: "ハナダシティ",
    tier: "normal",
    minPool: 420,
    habitatId: "route-25",
    requiresDefeat: ["brock"],
    party: [
      { lineId: "pidgey", level: 18 },
      { lineId: "abra", level: 16 },
      { lineId: RIVAL_STARTER_MARKER, level: 18 },
    ],
  },
  {
    id: "bridge-five",
    name: "ゴールデンボールブリッジの5人",
    location: "24ばんどうろ",
    tier: "chain",
    minPool: 360,
    habitatId: "route-24",
    requiresDefeat: ["brock"],
    party: [
      { lineId: "mankey", level: 16 },
      { lineId: "oddish", level: 17 },
      { lineId: "bellsprout", level: 17 },
      { lineId: "sandshrew", level: 18 },
      { lineId: "spearow", level: 19 },
    ],
  },
  {
    id: "rocket-scout",
    name: "ロケット団スカウト員",
    location: "24ばんどうろ",
    tier: "rocket",
    minPool: 360,
    habitatId: "route-24",
    requiresDefeat: ["bridge-five"],
    party: [
      { lineId: "rattata", level: 17 },
      { lineId: "zubat", level: 17 },
      { lineId: "ekans", level: 18 },
    ],
  },
  {
    id: "misty",
    name: "カスミ",
    location: "ハナダジム",
    tier: "gym",
    minPool: 480,
    habitatId: "route-5",
    boss: true,
    requiresDefeat: ["rocket-scout"],
    party: [
      { lineId: "staryu", level: 18 },
      { lineId: "staryu", level: 21 },
      { lineId: "starmie", level: 24 },
    ],
    rewards: { badge: "ブルー" },
  },
  {
    id: "rocket-thief",
    name: "泥棒ロケット団員",
    location: "ハナダシティ",
    tier: "rocket",
    minPool: 540,
    habitatId: "route-6",
    requiresDefeat: ["misty"],
    party: [
      { lineId: "grimer", level: 22 },
      { lineId: "koffing", level: 22 },
      { lineId: "grimer", level: 24 },
    ],
  },
  {
    id: "rival-4",
    name: "ライバル",
    location: "サント・アンヌ号",
    tier: "normal",
    minPool: 660,
    habitatId: "route-11",
    requiresDefeat: ["misty"],
    requiresBadges: ["cascade"],
    party: [
      { lineId: "pidgey", level: 20 },
      { lineId: "growlithe", level: 18 },
      { lineId: RIVAL_STARTER_MARKER, level: 22 },
    ],
  },
  {
    id: "surge",
    name: "マチス",
    location: "クチバジム",
    tier: "gym",
    minPool: 720,
    habitatId: "route-9",
    boss: true,
    requiresDefeat: ["rival-4"],
    party: [
      { lineId: "voltorb", level: 21 },
      { lineId: "pikachu", level: 18 },
      { lineId: "pikachu", level: 24 },
    ],
    rewards: { badge: "オレンジ" },
  },
  {
    id: "erika",
    name: "エリカ",
    location: "タマムシジム",
    tier: "gym",
    minPool: 840,
    habitatId: "route-7",
    boss: true,
    requiresDefeat: ["surge"],
    party: [
      { lineId: "bellsprout", level: 29 },
      { lineId: "tangela", level: 24 },
      { lineId: "oddish", level: 29 },
    ],
    rewards: { badge: "レインボー" },
  },
  {
    id: "rocket-celadon",
    name: "ムサシ＆コジロウ",
    location: "タマムシ地下アジト",
    tier: "rocket",
    minPool: 840,
    habitatId: "route-7",
    requiresDefeat: ["erika"],
    party: [
      { lineId: "ekans", level: 25 },
      { lineId: "bellsprout", level: 25 },
      { lineId: "meowth", level: 28 },
    ],
  },
  {
    id: "giovanni-1",
    name: "サカキ",
    location: "タマムシ地下アジト",
    tier: "gym",
    minPool: 840,
    habitatId: "route-7",
    requiresDefeat: ["rocket-celadon"],
    party: [
      { lineId: "rhyhorn", level: 25 },
      { lineId: "dugtrio", level: 25 },
      { lineId: "nidoking", level: 27 },
    ],
  },
  {
    id: "rival-5",
    name: "ライバル",
    location: "ポケモンタワー3かい",
    tier: "normal",
    minPool: 960,
    habitatId: "pokemon-tower",
    requiresDefeat: ["giovanni-1"],
    party: [
      { lineId: "pidgey", level: 25 },
      { lineId: "magikarp", level: 23 },
      { lineId: RIVAL_STARTER_MARKER, level: 25 },
    ],
  },
  {
    id: "rocket-tower",
    name: "ロケット団員",
    location: "ポケモンタワー最上階",
    tier: "chain",
    minPool: 960,
    habitatId: "pokemon-tower",
    requiresDefeat: ["rival-5"],
    party: [
      { lineId: "gastly", level: 24 },
      { lineId: "zubat", level: 24 },
      { lineId: "grimer", level: 25 },
      { lineId: "ekans", level: 26 },
      { lineId: "koffing", level: 26 },
    ],
  },
  {
    id: "snorlax",
    name: "ヴァスティクス",
    location: "12・16ばんどうろ",
    tier: "symbol",
    minPool: 1140,
    habitatId: "routes-12-15",
    requiresBadges: ["rainbow"],
    party: [{ lineId: "snorlax", level: 30 }],
    preMessage: "ヴァスティクスをふしぎなふえで起こした！",
  },
  {
    id: "dojo",
    name: "からておう",
    location: "ヤマブキ格闘道場",
    tier: "chain",
    minPool: 1200,
    habitatId: "routes-16-18",
    requiresBadges: ["rainbow"],
    party: [
      { lineId: "mankey", level: 28 },
      { lineId: "machop", level: 28 },
      { lineId: "mankey", level: 30 },
      { lineId: "machop", level: 30 },
      { lineId: "hitmonlee", level: 32 },
    ],
    rewards: { hitmon: true },
  },
  {
    id: "rocket-silph",
    name: "ムサシ＆コジロウ",
    location: "シルフカンパニー11かい",
    tier: "rocket",
    minPool: 960,
    habitatId: "pokemon-tower",
    requiresDefeat: ["rocket-tower"],
    party: [
      { lineId: "ekans", level: 30 },
      { lineId: "bellsprout", level: 30 },
      { lineId: "meowth", level: 33 },
    ],
  },
  {
    id: "rival-6",
    name: "ライバル",
    location: "シルフカンパニー11かい",
    tier: "normal",
    minPool: 960,
    habitatId: "pokemon-tower",
    requiresDefeat: ["rocket-silph"],
    party: [
      { lineId: "pidgey", level: 32 },
      { lineId: "exeggcute", level: 30 },
      { lineId: RIVAL_STARTER_MARKER, level: 32 },
    ],
    rewards: { lapras: true },
  },
  {
    id: "giovanni-2",
    name: "サカキ",
    location: "シルフカンパニー社長室",
    tier: "gym",
    minPool: 960,
    habitatId: "pokemon-tower",
    boss: true,
    requiresDefeat: ["rival-6"],
    party: [
      { lineId: "rhyhorn", level: 32 },
      { lineId: "dugtrio", level: 32 },
      { lineId: "nidoking", level: 35 },
    ],
    rewards: { masterBall: true },
  },
  {
    id: "sabrina",
    name: "ナツメ",
    location: "ヤマブキジム",
    tier: "gym",
    minPool: 1020,
    habitatId: "route-10",
    boss: true,
    requiresDefeat: ["giovanni-2"],
    party: [
      { lineId: "abra", level: 38 },
      { lineId: "mr-mime", level: 37 },
      { lineId: "abra", level: 43 },
    ],
    rewards: { badge: "ゴールド" },
  },
  {
    id: "morty",
    name: "キョウ",
    location: "セキチクジム",
    tier: "gym",
    minPool: 1200,
    habitatId: "routes-16-18",
    boss: true,
    requiresDefeat: ["sabrina"],
    party: [
      { lineId: "gastly", level: 38 },
      { lineId: "gastly", level: 40 },
      { lineId: "gastly", level: 43 },
    ],
    rewards: { badge: "ピンク", unlocksSideAreas: true },
  },
  {
    id: "voltorb-trap",
    name: "ビリリダマ",
    location: "むじんはつでんしょ",
    tier: "endurance",
    minPool: 1080,
    habitatId: "power-plant",
    requiresDefeat: ["morty"],
    optional: true,
    reappearOnHabitat: true,
    party: Array.from({ length: 8 }, () => ({ lineId: "voltorb", level: 28 })),
    rewards: { voltorbTrap: true },
  },
  {
    id: "zapdos",
    name: "トナルク",
    location: "むじんはつでんしょ",
    tier: "legendary",
    minPool: 1080,
    habitatId: "power-plant",
    requiresDefeat: ["morty"],
    optional: true,
    firstEncounterGuaranteed: 1,
    reappearChance: 0.12,
    party: [{ lineId: "zapdos", level: 50 }],
  },
  {
    id: "articuno",
    name: "ハイバニクス",
    location: "ふたごじま",
    tier: "legendary",
    minPool: 1620,
    habitatId: "seafoam-islands",
    requiresDefeat: ["morty"],
    optional: true,
    firstEncounterGuaranteed: 1,
    reappearChance: 0.12,
    party: [{ lineId: "articuno", level: 50 }],
  },
  {
    id: "blaine",
    name: "カツラ",
    location: "グレンジム",
    tier: "gym",
    minPool: 1500,
    habitatId: "pokemon-mansion",
    boss: true,
    requiresDefeat: ["morty"],
    party: [
      { lineId: "growlithe", level: 42 },
      { lineId: "ponyta", level: 40 },
      { lineId: "growlithe", level: 47 },
    ],
    rewards: { badge: "クリムゾン" },
  },
  {
    id: "giovanni-3",
    name: "サカキ",
    location: "トキワジム",
    tier: "gym",
    minPool: 1500,
    habitatId: "pokemon-mansion",
    boss: true,
    requiresDefeat: ["blaine"],
    party: [
      { lineId: "rhyhorn", level: 45 },
      { lineId: "dugtrio", level: 42 },
      { lineId: "nidoking", level: 48 },
    ],
    rewards: { badge: "グリーン" },
  },
  {
    id: "moltres",
    name: "フェルヴァルク",
    location: "チャンピオンロード",
    tier: "legendary",
    minPool: 1800,
    habitatId: "victory-road",
    requiresBadges: ["boulder", "cascade", "thunder", "rainbow", "marsh", "storm", "volcano", "earth"],
    optional: true,
    firstEncounterGuaranteed: 1,
    reappearChance: 0.1,
    party: [{ lineId: "moltres", level: 50 }],
  },
  {
    id: "rival-7",
    name: "ライバル",
    location: "22ばんどうろ",
    tier: "normal",
    minPool: 1800,
    habitatId: "victory-road",
    requiresBadges: ["boulder", "cascade", "thunder", "rainbow", "marsh", "storm", "volcano", "earth"],
    party: [
      { lineId: "pidgey", level: 47 },
      { lineId: "abra", level: 45 },
      { lineId: RIVAL_STARTER_MARKER, level: 47 },
    ],
  },
  {
    id: "elite-lorelei",
    name: "カンナ",
    location: "セキエイ高原",
    tier: "elite",
    minPool: 1800,
    habitatId: "victory-road",
    requiresDefeat: ["rival-7"],
    party: [
      { lineId: "seel", level: 54 },
      { lineId: "shellder", level: 53 },
      { lineId: "lapras", level: 56 },
    ],
  },
  {
    id: "elite-bruno",
    name: "シバ",
    location: "セキエイ高原",
    tier: "elite",
    minPool: 1800,
    habitatId: "victory-road",
    requiresDefeat: ["elite-lorelei"],
    party: [
      { lineId: "onix", level: 53 },
      { lineId: "hitmonchan", level: 55 },
      { lineId: "machop", level: 58 },
    ],
  },
  {
    id: "elite-agatha",
    name: "キクコ",
    location: "セキエイ高原",
    tier: "elite",
    minPool: 1800,
    habitatId: "victory-road",
    requiresDefeat: ["elite-bruno"],
    party: [
      { lineId: "gastly", level: 56 },
      { lineId: "zubat", level: 54 },
      { lineId: "ekans", level: 58 },
    ],
  },
  {
    id: "elite-lance",
    name: "ワタル",
    location: "セキエイ高原",
    tier: "elite",
    minPool: 1800,
    habitatId: "victory-road",
    requiresDefeat: ["elite-agatha"],
    party: [
      { lineId: "dratini", level: 58 },
      { lineId: "dratini", level: 56 },
      { lineId: "dratini", level: 60 },
    ],
  },
  {
    id: "champion-rival",
    name: "ライバル",
    location: "えいゆうのへや",
    tier: "champion",
    minPool: 1800,
    habitatId: "victory-road",
    boss: true,
    requiresDefeat: ["elite-lance"],
    party: [
      { lineId: "pidgey", level: 59 },
      { lineId: "abra", level: 57 },
      { lineId: RIVAL_STARTER_MARKER, level: 61 },
    ],
    rewards: { hallOfFame: true },
  },
  {
    id: "mewtwo",
    name: "サイカルク",
    location: "ハナダのどうくつ",
    tier: "legendary",
    minPool: 2200,
    habitatId: "cerulean-cave",
    requiresHallOfFame: true,
    optional: true,
    firstEncounterGuaranteed: 1,
    reappearChance: 0.08,
    party: [{ lineId: "mewtwo", level: 70 }],
  },
  {
    id: "mew",
    name: "プロタルク",
    location: "？？？",
    tier: "legendary",
    minPool: 3000,
    optional: true,
    requiresMewSeen: true,
    reappearChance: 0.03,
    party: [{ lineId: "mew", level: 30 }],
  },
];

const BATTLE_BY_ID = new Map(STORY_BATTLES.map(battle => [battle.id, battle]));

export const DEFAULT_STORY_PROGRESS = {
  version: 1,
  defeated: {},
  badges: [],
  pendingChallengeId: null,
  pendingChallengePoolSize: null,
  activeBattleId: null,
  activeBattlePoolSize: null,
  activeBattleStartedAt: null,
  masterBall: false,
  mewWordsSeen: [],
  relocatedHabitatId: null,
  hallOfFame: false,
  legendaryFirstSeen: {},
  voltorbTrapsCleared: 0,
  usedMasterBall: false,
  chosenStarterLineId: null,
  rivalStarterLineId: null,
  professorStartersAwarded: false,
};

export function normalizeStoryProgress(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const defeated = {};
  if (source.defeated && typeof source.defeated === "object") {
    for (const [id, value] of Object.entries(source.defeated)) {
      if (value && BATTLE_BY_ID.has(id)) defeated[id] = true;
    }
  }

  const badges = Array.isArray(source.badges)
    ? source.badges.filter(badge => typeof badge === "string")
    : [];

  const mewWordsSeen = Array.isArray(source.mewWordsSeen)
    ? source.mewWordsSeen
        .map(index => Number(index))
        .filter(index => Number.isInteger(index) && index >= 0)
    : [];

  const legendaryFirstSeen = {};
  if (source.legendaryFirstSeen && typeof source.legendaryFirstSeen === "object") {
    for (const [id, value] of Object.entries(source.legendaryFirstSeen)) {
      if (value && BATTLE_BY_ID.has(id)) legendaryFirstSeen[id] = true;
    }
  }

  const pendingChallengeId = BATTLE_BY_ID.has(source.pendingChallengeId)
    ? source.pendingChallengeId
    : null;
  const pendingChallengePoolSize = Number.isFinite(Number(source.pendingChallengePoolSize))
    ? Number(source.pendingChallengePoolSize)
    : null;
  const activeBattleId = BATTLE_BY_ID.has(source.activeBattleId) ? source.activeBattleId : null;
  const activeBattlePoolSize = Number.isFinite(Number(source.activeBattlePoolSize))
    ? Number(source.activeBattlePoolSize)
    : null;

  return {
    version: 1,
    defeated,
    badges: [...new Set(badges)],
    pendingChallengeId,
    pendingChallengePoolSize,
    activeBattleId,
    activeBattlePoolSize,
    activeBattleStartedAt: Number.isFinite(Number(source.activeBattleStartedAt))
      ? Number(source.activeBattleStartedAt)
      : null,
    masterBall: Boolean(source.masterBall),
    mewWordsSeen: [...new Set(mewWordsSeen)],
    relocatedHabitatId: typeof source.relocatedHabitatId === "string" ? source.relocatedHabitatId : null,
    hallOfFame: Boolean(source.hallOfFame),
    legendaryFirstSeen,
    voltorbTrapsCleared: Math.max(0, Math.min(8, Math.floor(Number(source.voltorbTrapsCleared) || 0))),
    usedMasterBall: Boolean(source.usedMasterBall),
    chosenStarterLineId:
      typeof source.chosenStarterLineId === "string" ? source.chosenStarterLineId : null,
    rivalStarterLineId:
      typeof source.rivalStarterLineId === "string" ? source.rivalStarterLineId : null,
    professorStartersAwarded: Boolean(source.professorStartersAwarded),
  };
}

export function getBattleById(battleId) {
  return BATTLE_BY_ID.get(battleId) ?? null;
}

export function getBattlePoolSize(progress, battle = null) {
  const normalized = normalizeStoryProgress(progress);
  if (Number.isFinite(Number(normalized.activeBattlePoolSize))) {
    return Number(normalized.activeBattlePoolSize);
  }
  if (Number.isFinite(Number(normalized.pendingChallengePoolSize))) {
    return Number(normalized.pendingChallengePoolSize);
  }
  if (battle && Number.isFinite(Number(battle.minPool))) {
    return Number(battle.minPool);
  }
  return 0;
}

export function getBattleForProgress(battleId, progress) {
  const battle = getBattleById(battleId);
  if (!battle) return null;
  return resolveBattleForProgress(battle, normalizeStoryProgress(progress));
}

export function getBattleTierConfig(battle) {
  return BATTLE_TIERS[battle?.tier] ?? BATTLE_TIERS.normal;
}

export function getBattlePlayLimit(battle) {
  return getBattleTierConfig(battle).playLimit;
}

export function getBattleWinAccuracy(battle) {
  return getBattleTierConfig(battle).winAccuracy;
}

export function getBattleProgressAccuracy(score, playLimit) {
  if (playLimit <= 0) return 0;
  return Math.max(0, Math.min(1, score / playLimit));
}

export function isBattleWon(score, playLimit, battle) {
  if (playLimit <= 0) return false;
  return getBattleProgressAccuracy(score, playLimit) >= getBattleWinAccuracy(battle);
}

export function hasBadge(progress, badgeId) {
  return normalizeStoryProgress(progress).badges.includes(badgeId);
}

export function isBattleDefeated(progress, battleId) {
  return Boolean(normalizeStoryProgress(progress).defeated[battleId]);
}

function meetsBadgeRequirements(progress, battle) {
  const required = battle.requiresBadges ?? [];
  return required.every(badge => hasBadge(progress, badge));
}

function meetsDefeatRequirements(progress, battle) {
  const required = battle.requiresDefeat ?? [];
  return required.every(id => isBattleDefeated(progress, id));
}

function isWithinPoolWindow(battle, poolSize) {
  if (poolSize < battle.minPool) return false;
  if (Number.isFinite(battle.maxPool) && poolSize > battle.maxPool) return false;
  return true;
}

function isBattleEligible(progress, battle, poolSize, habitatId) {
  const normalized = normalizeStoryProgress(progress);
  if (isBattleDefeated(normalized, battle.id) && !battle.reappearOnHabitat) return false;
  if (battle.optional === false && !isWithinPoolWindow(battle, poolSize)) return false;
  if (!isWithinPoolWindow(battle, poolSize)) return false;
  if (!meetsDefeatRequirements(normalized, battle)) return false;
  if (!meetsBadgeRequirements(normalized, battle)) return false;
  if (battle.requiresHallOfFame && !normalized.hallOfFame) return false;
  if (battle.requiresMewSeen && normalized.mewWordsSeen.length < 1) return false;
  if (battle.habitatId && habitatId && battle.habitatId !== habitatId && !battle.optional) return false;
  return true;
}

export function getPoolUnlockBlocker(progress, poolSize) {
  const normalized = normalizeStoryProgress(progress);
  const boss = STORY_BATTLES.find(battle =>
    battle.boss &&
    !isBattleDefeated(normalized, battle.id) &&
    poolSize >= battle.minPool &&
    meetsDefeatRequirements(normalized, battle) &&
    meetsBadgeRequirements(normalized, battle),
  );
  return boss ?? null;
}

export function getBlockingBoss(progress, poolSize) {
  return getPoolUnlockBlocker(progress, poolSize);
}

function shouldTriggerLegendary(progress, battle, rng = Math.random) {
  const normalized = normalizeStoryProgress(progress);
  if (isBattleDefeated(normalized, battle.id)) return false;
  if (!normalized.legendaryFirstSeen[battle.id] && battle.firstEncounterGuaranteed) {
    return true;
  }
  return rng() < (battle.reappearChance ?? 0.1);
}

export function scanBattleTriggers(progress, { unlockedPoolSize = 0, habitatId = null, rng = Math.random } = {}) {
  const normalized = normalizeStoryProgress(progress);
  const poolSize = Math.max(0, Number(unlockedPoolSize) || 0);
  const triggered = [];

  for (const battle of STORY_BATTLES) {
    if (isBattleDefeated(normalized, battle.id) && !battle.reappearOnHabitat) continue;
    if (normalized.pendingChallengeId === battle.id) continue;
    if (normalized.activeBattleId === battle.id) continue;
    if (!isBattleEligible(normalized, battle, poolSize, habitatId)) continue;

    if (battle.tier === "legendary") {
      if (!shouldTriggerLegendary(normalized, battle, rng)) continue;
    }

    if (battle.id === "mew") {
      if (normalized.mewWordsSeen.length < poolSize * 0.95) continue;
      if (!shouldTriggerLegendary(normalized, battle, rng)) continue;
    }

    if (battle.reappearOnHabitat && habitatId && battle.habitatId !== habitatId) continue;

    triggered.push(battle);
  }

  return triggered.sort((a, b) => a.minPool - b.minPool || STORY_BATTLES.indexOf(a) - STORY_BATTLES.indexOf(b));
}

export function pickNextBattleTrigger(progress, context, rng = Math.random) {
  const candidates = scanBattleTriggers(progress, context);
  if (candidates.length === 0) return null;
  const required = candidates.filter(battle => !battle.optional);
  const pool = required.length > 0 ? required : candidates;
  return pool[Math.floor(rng() * pool.length)] ?? pool[0];
}

export function setPendingChallenge(progress, battleId, poolSize = null) {
  const normalized = normalizeStoryProgress(progress);
  if (!BATTLE_BY_ID.has(battleId)) return normalized;
  return {
    ...normalized,
    pendingChallengeId: battleId,
    pendingChallengePoolSize: Number.isFinite(Number(poolSize)) ? Number(poolSize) : null,
  };
}

export function clearPendingChallenge(progress) {
  const normalized = normalizeStoryProgress(progress);
  return {
    ...normalized,
    pendingChallengeId: null,
    pendingChallengePoolSize: null,
  };
}

export function startBattleSession(progress, battleId, { poolSize = null } = {}) {
  const normalized = normalizeStoryProgress(progress);
  if (!BATTLE_BY_ID.has(battleId)) return normalized;
  const battle = getBattleById(battleId);
  const resolvedPoolSize = Number.isFinite(Number(poolSize))
    ? Number(poolSize)
    : Number.isFinite(Number(normalized.pendingChallengePoolSize))
      ? Number(normalized.pendingChallengePoolSize)
      : Number.isFinite(Number(battle?.minPool))
        ? Number(battle.minPool)
        : null;
  return {
    ...normalized,
    activeBattleId: battleId,
    activeBattlePoolSize: resolvedPoolSize,
    activeBattleStartedAt: Date.now(),
    pendingChallengeId: battleId,
    pendingChallengePoolSize: resolvedPoolSize,
  };
}

export function clearActiveBattle(progress) {
  const normalized = normalizeStoryProgress(progress);
  return {
    ...normalized,
    activeBattleId: null,
    activeBattlePoolSize: null,
    activeBattleStartedAt: null,
    pendingChallengeId: null,
    pendingChallengePoolSize: null,
  };
}

export function getResumeBattle(progress) {
  const normalized = normalizeStoryProgress(progress);
  if (!normalized.activeBattleId) return null;
  return getBattleForProgress(normalized.activeBattleId, normalized);
}

export function getStartScreenBattle(progress) {
  const normalized = normalizeStoryProgress(progress);
  const battleId = normalized.pendingChallengeId ?? normalized.activeBattleId;
  if (!battleId) return null;
  const battle = getBattleForProgress(battleId, normalized);
  if (!battle) return null;
  if (isBattleDefeated(normalized, battle.id) && !normalized.activeBattleId) return null;
  return battle;
}

export function getOpponentPokemonIndex(battle, questionNumber, playLimit = getBattlePlayLimit(battle), currentAccuracy = 0) {
  const party = battle?.party ?? [];
  if (party.length === 0) return 0;

  const winAccuracy = getBattleWinAccuracy(battle);
  const thresholds = party.map((entry, index) => {
    if (party.length === 1) return winAccuracy;
    return winAccuracy * (0.5 + 0.5 * (index / (party.length - 1)));
  });

  let currentIndex = party.length - 1;
  for (let i = 0; i < party.length; i++) {
    if (currentAccuracy < thresholds[i]) {
      currentIndex = i;
      break;
    }
  }

  return Math.min(party.length - 1, currentIndex);
}

export function getOpponentPokemonStatus(battle, questionNumber, playLimit, currentAccuracy = 0) {
  const party = battle?.party ?? [];
  if (party.length === 0) return [];

  const winAccuracy = getBattleWinAccuracy(battle);
  const thresholds = party.map((entry, index) => {
    if (party.length === 1) return winAccuracy;
    return winAccuracy * (0.5 + 0.5 * (index / (party.length - 1)));
  });

  const currentIndex = getOpponentPokemonIndex(battle, questionNumber, playLimit, currentAccuracy);

  return party.map((entry, index) => {
    const requiredAccuracy = thresholds[index];
    const line = getMonsterLine(entry.lineId);
    const species = getSpecies(entry.level, entry.lineId);

    return {
      index,
      lineId: entry.lineId,
      level: entry.level,
      name: line.name,
      speciesName: species.name,
      sprite: species.sprite,
      speciesId: species.id,
      requiredAccuracy: Math.round(requiredAccuracy * 100),
      isDefeated: currentAccuracy >= requiredAccuracy,
      isActive: index === currentIndex,
    };
  });
}

export function getOpponentPokemon(battle, questionNumber, playLimit, currentAccuracy = 0) {
  const party = battle?.party ?? [];
  const index = getOpponentPokemonIndex(battle, questionNumber, playLimit, currentAccuracy);
  const entry = party[index] ?? party[0];
  const line = getMonsterLine(entry.lineId);
  const species = getSpecies(entry.level, entry.lineId);
  return {
    ...entry,
    name: line.name,
    sprite: species.sprite,
    speciesId: species.id,
    index,
    total: party.length,
  };
}

function pickWeaknessQuestionIndex(candidates, stats) {
  const weighted = candidates.map(index => {
    const stat = stats[index] ?? { correct: 0, wrong: 0 };
    const wrong = stat.wrong ?? 0;
    const correct = stat.correct ?? 0;
    const weight = 1 + wrong * 4 + Math.max(0, 2 - correct);
    return { index, weight };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.index;
  }
  return weighted.at(-1)?.index ?? candidates[0];
}

export function pickBattleQuestionIndex({
  stats,
  unlockedPoolSize,
  seenSet,
  avoidIndex,
  battle,
  questionMode = null,
}) {
  const poolLimit = Math.max(1, Math.min(unlockedPoolSize, stats.length));
  let candidates = Array.from({ length: poolLimit }, (_, i) => i).filter(i => !seenSet?.has(i));
  if (typeof avoidIndex === "number" && candidates.length > 1) {
    candidates = candidates.filter(i => i !== avoidIndex);
  }
  if (candidates.length === 0) return null;

  const mode = questionMode ?? getBattleTierConfig(battle).questionMode;
  if (mode === "weakness") {
    return pickWeaknessQuestionIndex(candidates, stats);
  }

  const fresh = candidates.filter(i => ((stats[i]?.correct ?? 0) + (stats[i]?.wrong ?? 0)) === 0);
  if (fresh.length > 0 && Math.random() < 0.35) {
    return fresh[Math.floor(Math.random() * fresh.length)];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function markMewWordSeen(progress, wordIndex, totalWords) {
  const normalized = normalizeStoryProgress(progress);
  const safeIndex = Number(wordIndex);
  if (!Number.isInteger(safeIndex) || safeIndex < 0) return normalized;
  const nextSeen = [...new Set([...normalized.mewWordsSeen, safeIndex])];
  return { ...normalized, mewWordsSeen: nextSeen };
}

function addBadge(progress, badgeId) {
  if (!badgeId) return progress;
  const normalized = normalizeStoryProgress(progress);
  if (normalized.badges.includes(badgeId)) return normalized;
  return { ...normalized, badges: [...normalized.badges, badgeId] };
}

function awardHitmon(progress, collection) {
  const lineId = Math.random() < 0.5 ? "hitmonlee" : "hitmonchan";
  const monster = createMonsterInstance({
    id: `reward-dojo-${lineId}`,
    lineId,
    totalXP: 0,
    acquiredAt: "dojo-reward",
  });
  return {
    progress,
    collection: normalizeMonsterCollection({
      ...normalizeMonsterCollection(collection),
      monsters: [...normalizeMonsterCollection(collection).monsters, monster],
    }),
    rewardMessage: `からておうに勝って${getMonsterLine(lineId).name}をもらった！`,
    rewardSprite: getSpecies(1, lineId).sprite,
  };
}

function awardFossilItem(progress, collection) {
  const items = [
    { lineId: "omanyte", label: "かいの化石" },
    { lineId: "kabuto", label: "こうらの化石" },
  ];
  const item = items[Math.floor(Math.random() * items.length)];
  return {
    progress,
    collection,
    rewardMessage: `りかけいのおとこから${item.label}をもらった！`,
    rewardSprite: getSpecies(1, item.lineId).sprite,
  };
}

export function resolveBattleVictory(progress, battleId, collection, { poolSize = 0 } = {}) {
  const battle = getBattleById(battleId);
  if (!battle) return { progress, collection, rewards: [] };

  let nextProgress = normalizeStoryProgress(progress);
  nextProgress = {
    ...nextProgress,
    defeated: { ...nextProgress.defeated, [battleId]: true },
    relocatedHabitatId: null,
    legendaryFirstSeen: { ...nextProgress.legendaryFirstSeen, [battleId]: true },
  };
  nextProgress = clearActiveBattle(nextProgress);

  let nextCollection = normalizeMonsterCollection(collection);
  const rewards = [];

  if (battle.rewards?.badge) {
    nextProgress = addBadge(nextProgress, battle.rewards.badge);
    rewards.push({ type: "badge", message: `${battle.rewards.badge}バッジを獲得した！` });
  }
  if (battle.rewards?.masterBall) {
    nextProgress = { ...nextProgress, masterBall: true };
    rewards.push({ type: "item", message: "マスターボールを手に入れた！" });
  }
  if (battle.rewards?.hallOfFame) {
    nextProgress = { ...nextProgress, hallOfFame: true };
    rewards.push({ type: "hall", message: "殿堂入りした！" });
  }
  if (battle.rewards?.lapras) {
    const lapras = createMonsterInstance({
      id: "reward-rival6-lapras",
      lineId: "lapras",
      totalXP: 0,
      acquiredAt: "rival-6-lapras",
    });
    nextCollection = normalizeMonsterCollection({
      ...nextCollection,
      monsters: [...nextCollection.monsters, lapras],
    });
    rewards.push({
      type: "pokemon",
      message: "ライバルからラプラスをもらった！",
      sprite: getSpecies(15, "lapras").sprite,
    });
  }
  if (battle.rewards?.fossilItem) {
    const fossilReward = awardFossilItem(nextProgress, nextCollection);
    nextProgress = fossilReward.progress;
    rewards.push({
      type: "item",
      message: fossilReward.rewardMessage,
      sprite: fossilReward.rewardSprite,
    });
  }
  if (battle.rewards?.hitmon) {
    const hitmonReward = awardHitmon(nextProgress, nextCollection);
    nextProgress = hitmonReward.progress;
    nextCollection = hitmonReward.collection;
    rewards.push({
      type: "pokemon",
      message: hitmonReward.rewardMessage,
      sprite: hitmonReward.rewardSprite,
    });
  }
  if (battle.rewards?.voltorbTrap) {
    nextProgress = {
      ...nextProgress,
      voltorbTrapsCleared: Math.min(8, nextProgress.voltorbTrapsCleared + 1),
    };
  }
  if (battleId === "champion-rival") {
    const rivalGift = awardRivalStarterSeed(nextCollection, nextProgress);
    nextCollection = rivalGift.collection;
    if (rivalGift.awarded) {
      rewards.push({
        type: "pokemon",
        message: rivalGift.awarded.message,
        sprite: rivalGift.awarded.sprite,
      });
    }
  }

  const followUp = pickNextBattleTrigger(nextProgress, { unlockedPoolSize: poolSize });
  if (followUp && !followUp.optional) {
    nextProgress = setPendingChallenge(nextProgress, followUp.id);
  }

  return { progress: nextProgress, collection: nextCollection, rewards };
}

export function resolveBattleDefeat(progress, battleId, { habitatId = null, habitatMinPools = {} } = {}) {
  const battle = getBattleById(battleId);
  let nextProgress = clearActiveBattle(normalizeStoryProgress(progress));

  if (!battle) return { progress: nextProgress, relocatedHabitatId: null };

  const tier = getBattleTierConfig(battle);
  if (tier.blocksProgress || battle.boss) {
    nextProgress = setPendingChallenge(nextProgress, battleId);
    return { progress: nextProgress, relocatedHabitatId: null, persistsOnStart: true };
  }

  const fallbackHabitatId = battle.habitatId ?? habitatId;
  nextProgress = {
    ...nextProgress,
    pendingChallengeId: null,
    relocatedHabitatId: fallbackHabitatId,
  };

  return {
    progress: nextProgress,
    relocatedHabitatId: fallbackHabitatId,
    reappearWhenHabitatId: battle.reappearOnHabitat ? battle.habitatId : fallbackHabitatId,
  };
}

export function shouldReappearAfterHabitatVisit(progress, battleId, habitatId) {
  const battle = getBattleById(battleId);
  if (!battle || isBattleDefeated(progress, battleId)) return false;
  if (!battle.reappearOnHabitat) return false;
  return battle.habitatId === habitatId;
}

export function mergeStoryProgress(local, remote) {
  const a = normalizeStoryProgress(local);
  const b = normalizeStoryProgress(remote);
  const defeated = { ...b.defeated, ...a.defeated };
  const badges = [...new Set([...b.badges, ...a.badges])];
  const mewWordsSeen = [...new Set([...b.mewWordsSeen, ...a.mewWordsSeen])];
  const legendaryFirstSeen = { ...b.legendaryFirstSeen, ...a.legendaryFirstSeen };

  return normalizeStoryProgress({
    version: 1,
    defeated,
    badges,
    mewWordsSeen,
    legendaryFirstSeen,
    masterBall: a.masterBall || b.masterBall,
    hallOfFame: a.hallOfFame || b.hallOfFame,
    usedMasterBall: a.usedMasterBall || b.usedMasterBall,
    voltorbTrapsCleared: Math.max(a.voltorbTrapsCleared, b.voltorbTrapsCleared),
    pendingChallengeId: a.pendingChallengeId ?? b.pendingChallengeId,
    pendingChallengePoolSize: a.pendingChallengePoolSize ?? b.pendingChallengePoolSize,
    activeBattleId: a.activeBattleId ?? b.activeBattleId,
    activeBattlePoolSize: a.activeBattlePoolSize ?? b.activeBattlePoolSize,
    activeBattleStartedAt: a.activeBattleStartedAt ?? b.activeBattleStartedAt,
    relocatedHabitatId: a.relocatedHabitatId ?? b.relocatedHabitatId,
    chosenStarterLineId: a.chosenStarterLineId ?? b.chosenStarterLineId,
    rivalStarterLineId: a.rivalStarterLineId ?? b.rivalStarterLineId,
    professorStartersAwarded: a.professorStartersAwarded || b.professorStartersAwarded,
  });
}

export function consumeMasterBall(progress) {
  const normalized = normalizeStoryProgress(progress);
  if (!normalized.masterBall || normalized.usedMasterBall) return normalized;
  return { ...normalized, masterBall: false, usedMasterBall: true };
}

export function canUseMasterBall(progress) {
  const normalized = normalizeStoryProgress(progress);
  return normalized.masterBall && !normalized.usedMasterBall;
}

export function isCapturableBattle(battle) {
  return battle?.tier === "legendary" || battle?.tier === "symbol";
}

export function getTrainerSprite(battle) {
  if (!battle) return null;
  const trainerId = TRAINER_SPRITE_BY_BATTLE_ID[battle.id];
  if (trainerId) {
    return `${TRAINER_SPRITE_ROOT}/${trainerId}.png`;
  }
  if (battle.tier === "legendary" || battle.tier === "symbol") {
    const opponent = getOpponentPokemon(battle, 1, getBattlePlayLimit(battle));
    return opponent.sprite;
  }
  return null;
}

export function getBattleResultMessage(battle, won, capture = null) {
  if (!battle) return null;
  if (!won) {
    if (battle.boss || BATTLE_TIERS[battle.tier]?.blocksProgress) {
      return `${battle.name}に負けた…　スタート画面から再挑戦しよう。`;
    }
    return `${battle.name}に負けた。　同じエリアで学習を続けると再挑戦できる。`;
  }
  if (capture?.caught) {
    return `${battle.name}を倒して　捕まえた！`;
  }
  if (capture && !capture.caught && isCapturableBattle(battle)) {
    return `${battle.name}を倒したが　逃げられてしまった…`;
  }
  if (battle.rewards?.badge) {
    return `${battle.name}に勝利！　${battle.rewards.badge}バッジを獲得した！`;
  }
  if (battle.rewards?.hallOfFame) {
    return "チャンピオンに勝利！　殿堂入りだ！";
  }
  return `${battle.name}に勝利した！`;
}

/** 実装前に到達済みのプレイヤーへ、未撃破のストーリー戦を遡及キューする */
export function syncRetroactiveBattles(progress, { unlockedPoolSize = 0 } = {}) {
  const normalized = normalizeStoryProgress(progress);
  if (normalized.pendingChallengeId || normalized.activeBattleId) {
    return normalized;
  }

  const poolSize = Math.max(0, Number(unlockedPoolSize) || 0);
  const blocker = getPoolUnlockBlocker(normalized, poolSize);
  if (blocker) {
    return setPendingChallenge(normalized, blocker.id, poolSize);
  }

  for (const battle of STORY_BATTLES) {
    if (battle.optional || battle.tier === "legendary" || battle.reappearOnHabitat) continue;
    if (isBattleDefeated(normalized, battle.id)) continue;
    if (poolSize < battle.minPool) continue;
    if (!meetsDefeatRequirements(normalized, battle)) continue;
    if (!meetsBadgeRequirements(normalized, battle)) continue;
    if (battle.requiresHallOfFame && !normalized.hallOfFame) continue;
    return setPendingChallenge(normalized, battle.id, poolSize);
  }

  return normalized;
}
