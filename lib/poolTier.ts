import { PoolTier } from "./types";

// 出題プールの規模に応じた獲得ポイント倍率（全3400語対応）。
// プールが広いほど1問の価値が上がり、長く続けるほど伸びが実感できる。
export const POOL_TIERS: PoolTier[] = [
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
export function getPoolTier(poolSize: number): PoolTier {
  return POOL_TIERS.find((t) => poolSize >= t.minPool) ?? POOL_TIERS.at(-1)!;
}
