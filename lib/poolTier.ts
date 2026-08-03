import { PoolTier } from "./types";

// 出題プールの規模に応じた獲得ポイント倍率（全3440語対応）。
// プールが広いほど1問の価値が上がり、長く続けるほど伸びが実感できる。
//
// 境界は出題順（難易度順）のCEFRバンド境界（docs/vocab-difficulty.csv の
// effectiveBand 列から算出、scripts/gen-difficulty-order.mjs 参照）に合わせている。
// B1・B2・C1 は語数が多く1バンド=1段だと伸びが実感しにくいため、
// バンド境界をまたがない範囲で等分して複数段に分けている。
// 色は「順序尺度には順序尺度の配色を使う」方針で決めている。
// A1→C2 は順位のある段階なので、虹色（カテゴリ配色）を割り当てると
// 「どちらが上か」を色から読めない。無彩色→青緑→緑→黄と進みながら
// 明度が単調に上がる連続スケールにすることで、明るいほど上位、が一目で伝わる。
// 明度差が主なので、赤緑の色覚特性がある場合でも順序が崩れない。
//
// 青（--accent）の色相は意図的に外している。操作色と同じ色みだと
// 「押すもの」と「現在の段階」が同じ意味の色に見えてしまうため。
// 全色 --surface-0(#12141A) 上で 6:1 以上。
export const POOL_TIERS: PoolTier[] = [
  { minPool: 3325, multiplier: 16, label: "C2", color: "#f0d45a" },
  { minPool: 2726, multiplier: 14, label: "C1-2", color: "#c2d45c" },
  { minPool: 2126, multiplier: 12, label: "C1-1", color: "#96d466" },
  { minPool: 1666, multiplier: 8, label: "B2-3", color: "#6dd07a" },
  { minPool: 1206, multiplier: 6, label: "B2-2", color: "#52cb9a" },
  { minPool: 746, multiplier: 5, label: "B2-1", color: "#4ec3bd" },
  { minPool: 430, multiplier: 4, label: "B1-2", color: "#58bcb8" },
  { minPool: 114, multiplier: 3, label: "B1-1", color: "#6fb0b6" },
  { minPool: 11, multiplier: 2, label: "A2", color: "#85a2a8" },
  { minPool: 1, multiplier: 1, label: "A1", color: "#8f96a0" },
];

/** プールサイズから現在のティアを取得 */
export function getPoolTier(poolSize: number): PoolTier {
  return POOL_TIERS.find((t) => poolSize >= t.minPool) ?? POOL_TIERS.at(-1)!;
}
