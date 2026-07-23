/**
 * 各土地（habitat）ごとの背景演出カラー。
 *
 * 色の正本は MAP_ART_PALETTE.md（各土地16色）。ここではそのうち、
 * 背景の光の玉（AuroraBackground）と灯りの粒（.field-dots）に使う色だけを
 * 抜き出す。ゲームロジックには一切影響しない見た目専用の対応表。
 *
 * - `aurora` … AuroraBackground の3つの光の玉。canon の
 *   [差し色 A1, 環境明 E2, メイン明 M4] を採用し、その土地の「光」を主役に
 *   環境色・地形色を添える並びにしている。
 * - `dotsGlow` … .field-dots の柔らかい灯りの色（低アルファの rgba）。
 *   その土地の差し色 A1 を薄く敷く。白い粒（スパークル）はそのまま。
 *
 * キー（habitatId）は lib/capture.ts の HABITATS.id と一致（＝canon の14土地）。
 */
export interface HabitatTheme {
  /** AuroraBackground に渡す光の玉3色 [A1, E2, M4] */
  aurora: [string, string, string];
  /** .field-dots の灯り色（rgba。--field-dots-glow に渡す） */
  dotsGlow: string;
}

/** #RRGGBB を rgba(r, g, b, alpha) 文字列にする */
function glow(hex: string, alpha = 0.3): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** habitat未確定・未知IDのときの既定（従来のEGA白/琥珀/赤グロー） */
const FALLBACK: HabitatTheme = {
  aurora: ["#f5f5f5", "#ffcf4a", "#ff5a5a"],
  dotsGlow: "rgba(255, 255, 255, 0.3)",
};

/** canon（MAP_ART_PALETTE.md §3）から [A1, E2, M4] を抜粋 */
const HABITAT_THEMES: Record<string, HabitatTheme> = {
  // 01 森・中央 ／ 翡翠・苔・胞子光
  elmuria: { aurora: ["#B7D06A", "#C9B978", "#3C7A69"], dotsGlow: glow("#B7D06A") },
  // 02 草原・中央 ／ 黄金オリーブ・風の白銀
  everstep: { aurora: ["#ECE7C6", "#A9C0C8", "#C8C270"], dotsGlow: glow("#ECE7C6") },
  // 03 町・中央 ／ 陶土ローズ・若葉
  "apple-town": { aurora: ["#8FB05A", "#A8C6D2", "#E4A488"], dotsGlow: glow("#8FB05A") },
  // 04 湿地・南 ／ 燻し灰緑・鬼火
  "old-smoke": { aurora: ["#C1CB4B", "#9FB0A0", "#66725E"], dotsGlow: glow("#C1CB4B") },
  // 05 洞窟・東 ／ 紫の鉱石・結晶光
  "kapadra-cave": { aurora: ["#9C74D4", "#6E8AA0", "#4E4468"], dotsGlow: glow("#9C74D4") },
  // 06 雪山・北 ／ 鋼青灰・朝焼けローズ
  "alb-peak": { aurora: ["#E6C3BC", "#A9CBDC", "#9EAFBC"], dotsGlow: glow("#E6C3BC") },
  // 07 天国・北 ／ 虹彩ライラック・雲ミント
  "hoshi-no-kumoi": { aurora: ["#ECD9A0", "#AED4EC", "#E2D8F2"], dotsGlow: glow("#ECD9A0") },
  // 08 砂漠・東 ／ 骨モーヴ・呪いの朱
  "eterna-desert": { aurora: ["#D8492A", "#D8B27A", "#D0B8AE"], dotsGlow: glow("#D8492A") },
  // 09 都会・東 ／ 深藍・蛍ネオン
  "great-firefly-city": { aurora: ["#63E38A", "#4FC3E8", "#322A55"], dotsGlow: glow("#63E38A") },
  // 10 海・南 ／ コバルト・波の白
  "ultra-blue": { aurora: ["#E7F0F4", "#58C8CE", "#3A72C8"], dotsGlow: glow("#E7F0F4") },
  // 11 深海・南 ／ 藍黒・生物発光
  "tarasys-temple": { aurora: ["#42D3C3", "#3E86A0", "#1C4048"], dotsGlow: glow("#42D3C3") },
  // 12 地獄・南 ／ アマランサス暗紅・溶岩
  "la-amaranta": { aurora: ["#E8531C", "#C89A44", "#6E2230"], dotsGlow: glow("#E8531C") },
  // 13 湖畔城・中央 ／ 青灰の湖・緑青の銅
  "schwanburg-castle": { aurora: ["#74B09B", "#A6C4CE", "#6E909C"], dotsGlow: glow("#74B09B") },
  // 14 地下・最深 ／ 錆セピア・灯火アンバー
  "kapadra-underground": { aurora: ["#E9A94C", "#7E5240", "#52402F"], dotsGlow: glow("#E9A94C") },
};

/** habitatId から背景演出テーマを引く。未設定・未知IDは FALLBACK。 */
export function getHabitatTheme(habitatId: string | null | undefined): HabitatTheme {
  if (!habitatId) return FALLBACK;
  return HABITAT_THEMES[habitatId] ?? FALLBACK;
}
