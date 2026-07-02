/**
 * フィールドごとの手動配色パレット。
 * 自動計算はしない。ここに書いた5色（base/sub/dark/accent/highlight）を
 * そのまま globals.css の .field-marble に CSS変数として渡すだけ。
 * 値は手で決めて埋める。空のフィールドは FALLBACK（既存の水辺トーン）になる。
 */
export interface FieldPalette {
  /** 面積の主役（55%目安） */
  base: string;
  /** ベースの隣色（25%目安） */
  sub: string;
  /** 一番濃い陰（12%目安） */
  dark: string;
  /** 差し色（6%目安） */
  accent: string;
  /** 一番明るいハイライト（2%目安） */
  highlight: string;
}

const FALLBACK: FieldPalette = {
  base: "#C7D0F5",
  sub: "#9AA8ED",
  dark: "#3A4A8C",
  accent: "#F3AD67",
  highlight: "#F1F4FF",
};

export const FIELD_PALETTES: Record<string, FieldPalette> = {
  // 火山
  volcano: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 海
  sea: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 雪山
  snowMountain: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 森
  forest: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 砂漠
  desert: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 村
  village: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 夜
  night: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 遺跡
  ruins: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 空
  sky: { base: "", sub: "", dark: "", accent: "", highlight: "" },
  // 機械都市
  mechanicalCity: { base: "", sub: "", dark: "", accent: "", highlight: "" },
};

/** fieldKeyのパレットが未設定（baseが空）ならFALLBACKを返す */
export function getFieldPalette(fieldKey: string | undefined): FieldPalette {
  if (!fieldKey) return FALLBACK;
  const palette = FIELD_PALETTES[fieldKey];
  if (!palette || !palette.base) return FALLBACK;
  return palette;
}

/** getFieldPaletteの結果を .field-marble 用のCSS変数オブジェクトに変換 */
export function fieldPaletteToCssVars(
  palette: FieldPalette
): Record<string, string> {
  return {
    "--field-base": palette.base,
    "--field-sub": palette.sub,
    "--field-dark": palette.dark,
    "--field-accent": palette.accent,
    "--field-highlight": palette.highlight,
  };
}
