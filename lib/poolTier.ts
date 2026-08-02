import { PoolTier } from "./types";

// 出題プールの規模に応じた獲得ポイント倍率（全3440語対応）。
// プールが広いほど1問の価値が上がり、長く続けるほど伸びが実感できる。
//
// 境界は出題順（難易度順）のCEFRバンド境界（docs/vocab-difficulty.csv の
// effectiveBand 列から算出、scripts/gen-difficulty-order.mjs 参照）に合わせている。
// B1・B2・C1 は語数が多く1バンド=1段だと伸びが実感しにくいため、
// バンド境界をまたがない範囲で等分して複数段に分けている。
export const POOL_TIERS: PoolTier[] = [
  { minPool: 3325, multiplier: 16, label: "C2", color: "#f59e0b" },
  { minPool: 2726, multiplier: 14, label: "C1-2", color: "#f97316" },
  { minPool: 2126, multiplier: 12, label: "C1-1", color: "#ef4444" },
  { minPool: 1666, multiplier: 8, label: "B2-3", color: "#8b5cf6" },
  { minPool: 1206, multiplier: 6, label: "B2-2", color: "#3b82f6" },
  { minPool: 746, multiplier: 5, label: "B2-1", color: "#06b6d4" },
  { minPool: 430, multiplier: 4, label: "B1-2", color: "#10b981" },
  { minPool: 114, multiplier: 3, label: "B1-1", color: "#84cc16" },
  { minPool: 11, multiplier: 2, label: "A2", color: "#a3a3a3" },
  { minPool: 1, multiplier: 1, label: "A1", color: "#d4d4d8" },
];

/** プールサイズから現在のティアを取得 */
export function getPoolTier(poolSize: number): PoolTier {
  return POOL_TIERS.find((t) => poolSize >= t.minPool) ?? POOL_TIERS.at(-1)!;
}
