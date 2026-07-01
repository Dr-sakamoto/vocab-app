/**
 * プールティア（POOL_TIERS）に応じた配色テーマ。
 * 「進捗が進むほどエリアの雰囲気が変わる」演出をCSSグラデーションだけで実現する。
 * ティア自体のロジックはlib/monster.tsのPOOL_TIERSが真実源で、ここでは
 * 各ティアのlabelに見た目のテーマを対応させるだけ（ゲームロジックには影響しない）。
 */
export interface TierTheme {
  /** クイズ画面のページ全体の背景グラデーション */
  quizGradient: string;
  /** スタート/結果画面のページ全体の背景グラデーション */
  pageGradient: string;
  /** スタート画面のヘッダー・問題カードなどのアクセントグラデーション（動く演出と併用） */
  accentGradient: string;
  /** AuroraBackgroundの光の玉3色 */
  auroraColors: [string, string, string];
}

const DEFAULT_THEME: TierTheme = {
  quizGradient: "linear-gradient(to bottom, rgba(238,242,255,0.4), #ffffff)",
  pageGradient: "linear-gradient(to bottom right, #eef2ff, #ffffff, #f5f3ff)",
  accentGradient: "linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)",
  auroraColors: ["#818cf8", "#a78bfa", "#7dd3fc"],
};

const TIER_THEMES: Record<string, TierTheme> = {
  "Tier 1": DEFAULT_THEME,
  "Tier 2": {
    quizGradient: "linear-gradient(to bottom, rgba(241,245,249,0.5), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #f1f5f9, #ffffff, #e2e8f0)",
    accentGradient: "linear-gradient(90deg, #64748b, #94a3b8, #64748b)",
    auroraColors: ["#94a3b8", "#cbd5e1", "#a5b4fc"],
  },
  "Tier 3": {
    quizGradient: "linear-gradient(to bottom, rgba(236,252,203,0.4), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #ecfccb, #ffffff, #d9f99d)",
    accentGradient: "linear-gradient(90deg, #65a30d, #84cc16, #65a30d)",
    auroraColors: ["#84cc16", "#a3e635", "#4ade80"],
  },
  "Tier 4": {
    quizGradient: "linear-gradient(to bottom, rgba(209,250,229,0.45), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #d1fae5, #ffffff, #a7f3d0)",
    accentGradient: "linear-gradient(90deg, #059669, #10b981, #059669)",
    auroraColors: ["#10b981", "#34d399", "#5eead4"],
  },
  "Tier 5": {
    // 雪山・氷河のイメージ
    quizGradient: "linear-gradient(to bottom, rgba(224,242,254,0.55), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #e0f2fe, #ffffff, #cffafe)",
    accentGradient: "linear-gradient(90deg, #0891b2, #06b6d4, #0891b2)",
    auroraColors: ["#22d3ee", "#7dd3fc", "#bae6fd"],
  },
  "Tier 6": {
    quizGradient: "linear-gradient(to bottom, rgba(219,234,254,0.5), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #dbeafe, #ffffff, #bfdbfe)",
    accentGradient: "linear-gradient(90deg, #2563eb, #3b82f6, #2563eb)",
    auroraColors: ["#3b82f6", "#60a5fa", "#818cf8"],
  },
  "Tier 7": {
    quizGradient: "linear-gradient(to bottom, rgba(237,233,254,0.5), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #ede9fe, #ffffff, #ddd6fe)",
    accentGradient: "linear-gradient(90deg, #7c3aed, #8b5cf6, #7c3aed)",
    auroraColors: ["#8b5cf6", "#c084fc", "#a78bfa"],
  },
  "Tier 8": {
    quizGradient: "linear-gradient(to bottom, rgba(254,226,226,0.5), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #fee2e2, #ffffff, #fed7aa)",
    accentGradient: "linear-gradient(90deg, #dc2626, #ef4444, #f97316)",
    auroraColors: ["#ef4444", "#fb923c", "#f87171"],
  },
  MASTER: {
    quizGradient: "linear-gradient(to bottom, rgba(254,243,199,0.55), #ffffff)",
    pageGradient: "linear-gradient(to bottom right, #fef3c7, #ffffff, #fde68a)",
    accentGradient: "linear-gradient(90deg, #d97706, #f59e0b, #d97706)",
    auroraColors: ["#f59e0b", "#fbbf24", "#fcd34d"],
  },
};

export function getTierTheme(tierLabel: string | undefined): TierTheme {
  if (!tierLabel) return DEFAULT_THEME;
  return TIER_THEMES[tierLabel] ?? DEFAULT_THEME;
}
