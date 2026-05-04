// ── プール倍率ティア (全3400語対応) ─────────────────────────────────────
// minPool の降順に並べること（find で最初にヒットするものを使う）
export const POOL_TIERS = [
  { minPool: 3000, multiplier: 13, label: "MASTER",  color: "#f59e0b" },
  { minPool: 2600, multiplier: 11, label: "Tier 8",  color: "#ef4444" },
  { minPool: 2200, multiplier:  9, label: "Tier 7",  color: "#8b5cf6" },
  { minPool: 1800, multiplier:  7, label: "Tier 6",  color: "#3b82f6" },
  { minPool: 1400, multiplier:  5, label: "Tier 5",  color: "#06b6d4" },
  { minPool: 1000, multiplier:  4, label: "Tier 4",  color: "#10b981" },
  { minPool:  600, multiplier:  3, label: "Tier 3",  color: "#84cc16" },
  { minPool:  300, multiplier:  2, label: "Tier 2",  color: "#a3a3a3" },
  { minPool:   60, multiplier:  1, label: "Tier 1",  color: "#d4d4d8" },
];

/** プールサイズから現在のティアを取得 */
export function getPoolTier(poolSize) {
  return POOL_TIERS.find(t => poolSize >= t.minPool) ?? POOL_TIERS.at(-1);
}

// ── レベル計算 ─────────────────────────────────────────────────────────────
// Lv.N → N+1 に必要な XP = N × 500
// Lv.N に到達するための累計 XP  = 500 × N×(N-1)/2
//   Lv.16 まで: ~60,000 XP  / Lv.36 まで: ~315,000 XP

const XP_FACTOR = 500;

export function totalXPForLevel(level) {
  if (level <= 1) return 0;
  return XP_FACTOR * ((level - 1) * level) / 2;
}

export function xpToNextLevel(level) {
  return XP_FACTOR * level;
}

export function levelFromTotalXP(xp) {
  // N*(N-1)/2 × 500 = xp → N ≒ (1 + √(1 + 8xp/500)) / 2
  const n = Math.floor((1 + Math.sqrt(1 + (8 * xp) / XP_FACTOR)) / 2);
  return Math.max(1, n);
}

// ── フシギダネ族 ───────────────────────────────────────────────────────────
// PokeAPI Gen.I ドット絵 (パブリックに利用可能)
const GEN1 =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/transparent";

export const BULBASAUR_LINE = [
  { id: 1, name: "フシギダネ", nameEn: "Bulbasaur", sprite: `${GEN1}/1.png`, minLevel: 1,  maxLevel: 15  },
  { id: 2, name: "フシギソウ", nameEn: "Ivysaur",   sprite: `${GEN1}/2.png`, minLevel: 16, maxLevel: 35  },
  { id: 3, name: "フシギバナ", nameEn: "Venusaur",  sprite: `${GEN1}/3.png`, minLevel: 36, maxLevel: 100 },
];

/** レベルから現在の種族を取得 */
export function getSpecies(level) {
  return (
    [...BULBASAUR_LINE].reverse().find(s => level >= s.minLevel) ??
    BULBASAUR_LINE[0]
  );
}

/**
 * 累計 XP からモンスターの状態を返す
 * @param {number} totalXP
 * @returns {{ level, currentXP, neededXP, pct, species }}
 */
export function getMonsterState(totalXP) {
  const level     = levelFromTotalXP(totalXP);
  const levelBase = totalXPForLevel(level);
  const currentXP = totalXP - levelBase;
  const neededXP  = xpToNextLevel(level);
  const species   = getSpecies(level);
  return { level, currentXP, neededXP, pct: currentXP / neededXP, species };
}