import { PoolTier } from "./types";

// 出題プールの規模に応じた獲得ポイント倍率（全3440語対応）。
// プールが広いほど1問の価値が上がり、長く続けるほど伸びが実感できる。
//
// 境界は、出題順がCEFRバンド主軸だった頃のバンド境界に合わせて決めた。
// 出題順は現在「出る順」そのもの（scripts/gen-difficulty-order.mjs 参照）なので、
// 境界はCEFRバンドと対応しない。ラベルもCEFR名をやめ、段階の番号にしている
// （A1/A2 と表示しながら中身が alleviate / scrutinize では誤解を招くため）。
// 境界と倍率は獲得ポイントのペースを変えないよう据え置いている。
// 色は「順序尺度には順序尺度の配色を使う」方針で決めている。
// Stage 1→10 は順位のある段階なので、虹色（カテゴリ配色）を割り当てると
// 「どちらが上か」を色から読めない。無彩色→青緑→緑→黄と進みながら
// 明度が単調に上がる連続スケールにすることで、明るいほど上位、が一目で伝わる。
// 明度差が主なので、赤緑の色覚特性がある場合でも順序が崩れない。
//
// 青（--accent）の色相は意図的に外している。操作色と同じ色みだと
// 「押すもの」と「現在の段階」が同じ意味の色に見えてしまうため。
// 全色 ダークの --surface-0(#12141A) 上で 6:1 以上。
// lightColor はライトテーマ用。地が明るいので「明るいほど上位」は逆転し、
// 「濃いほど（地とのコントラストが高いほど）上位」になる。同じ色相のまま
// 明度だけ下げ、全色ライトの --surface-0(#F6F4EF) 上で 5:1 以上。
export const POOL_TIERS: PoolTier[] = [
  { minPool: 3325, multiplier: 16, label: "Stage 10", color: "#f0d45a", lightColor: "#4b3e03" },
  { minPool: 2726, multiplier: 14, label: "Stage 9", color: "#c2d45c", lightColor: "#3e460f" },
  { minPool: 2126, multiplier: 12, label: "Stage 8", color: "#96d466", lightColor: "#2d4e13" },
  { minPool: 1666, multiplier: 8, label: "Stage 7", color: "#6dd07a", lightColor: "#185420" },
  { minPool: 1206, multiplier: 6, label: "Stage 6", color: "#52cb9a", lightColor: "#17583e" },
  { minPool: 746, multiplier: 5, label: "Stage 5", color: "#4ec3bd", lightColor: "#1b5b58" },
  { minPool: 430, multiplier: 4, label: "Stage 4", color: "#58bcb8", lightColor: "#225f5d" },
  { minPool: 114, multiplier: 3, label: "Stage 3", color: "#6fb0b6", lightColor: "#316368" },
  { minPool: 11, multiplier: 2, label: "Stage 2", color: "#85a2a8", lightColor: "#4a666c" },
  { minPool: 1, multiplier: 1, label: "Stage 1", color: "#8f96a0", lightColor: "#616874" },
];

/** プールサイズから現在のティアを取得 */
export function getPoolTier(poolSize: number): PoolTier {
  return POOL_TIERS.find((t) => poolSize >= t.minPool) ?? POOL_TIERS.at(-1)!;
}
