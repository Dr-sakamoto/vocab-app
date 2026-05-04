import { getPoolTier } from "./monster";

// ── グレード定義（正解率ベース） ───────────────────────────────────────────
const GRADES = [
  { minAccuracy: 1.0, grade: "S", title: "パーフェクト", message: "全問正解！完璧なプレイです。" },
  { minAccuracy: 0.8, grade: "A", title: "優秀",         message: "素晴らしい出来です。引き続き上を目指しましょう。" },
  { minAccuracy: 0.6, grade: "B", title: "良好",         message: "まずまずの結果です。苦手な単語を重点的に復習しましょう。" },
  { minAccuracy: 0.4, grade: "C", title: "もう少し",     message: "復習が必要です。繰り返しプレイして定着させましょう。" },
  { minAccuracy: 0,   grade: "D", title: "要復習",       message: "まずは基礎単語から取り組んでみましょう。" },
];

const BASE_XP_PER_CORRECT = 100; // 1倍時・正解1問あたり
const STREAK_XP_PER_CHAIN = 15;  // 1倍時・ストリーク1連鎖あたり
const STREAK_BONUS_MIN    = 3;   // ボーナス発生連鎖数

/**
 * 純粋関数: セッション XP を計算する
 * page.js の next() からも直接呼べるようにエクスポート
 */
export function computeSessionXP({ score, bestStreak, unlockedPoolSize, playLimit }) {
  const tier       = getPoolTier(unlockedPoolSize);
  const { multiplier } = tier;
  const baseXP     = Math.round(score * BASE_XP_PER_CORRECT * multiplier);
  const streakXP   = bestStreak >= STREAK_BONUS_MIN
    ? Math.round(bestStreak * STREAK_XP_PER_CHAIN * multiplier)
    : 0;
  return { baseXP, streakXP, totalXP: baseXP + streakXP, tier };
}

/**
 * 1プレイの評価結果を返す
 * poolBaseSize パラメータは廃止（getPoolTier が内部で解決）
 */
export function evaluatePlay({ answers, score, playLimit, bestStreak, unlockedPoolSize }) {
  const accuracy   = playLimit > 0 ? score / playLimit : 0;
  const gradeEntry = GRADES.find(g => accuracy >= g.minAccuracy) ?? GRADES.at(-1);

  const { baseXP, streakXP, totalXP, tier } = computeSessionXP({
    score, bestStreak, unlockedPoolSize, playLimit,
  });
  const { multiplier } = tier;

  const breakdown = [
    {
      label:  "正解ボーナス",
      points: baseXP,
      max:    Math.round(playLimit * BASE_XP_PER_CORRECT * multiplier),
      detail: `${score}問正解 × ${BASE_XP_PER_CORRECT} × ×${multiplier} (${tier.label})`,
    },
    {
      label:  "ストリークボーナス",
      points: streakXP,
      max:    null, // 上限なし
      detail: bestStreak >= STREAK_BONUS_MIN
        ? `最高${bestStreak}連鎖 × ${STREAK_XP_PER_CHAIN} × ×${multiplier}`
        : `${STREAK_BONUS_MIN}連鎖以上で発生`,
    },
  ];

  return {
    grade:   gradeEntry.grade,
    title:   gradeEntry.title,
    message: gradeEntry.message,
    xp:      totalXP,  // 旧 score フィールドを置き換え
    tier,
    breakdown,
  };
}