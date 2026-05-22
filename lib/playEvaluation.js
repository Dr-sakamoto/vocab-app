import { getPoolTier } from "./monster";

// ── グレード定義（プロセス・状態重視） ────────────────────────────────────
// Dweck(2006) 成長マインドセット: 結果でなく状態・努力を言語化する
const GRADES = [
  { minAccuracy: 1.0, grade: "S", title: "ゾーン突入",    message: "完璧な集中状態！この感覚を覚えておこう。" },
  { minAccuracy: 0.8, grade: "A", title: "フロー状態",    message: "脳がノってる。このリズムが本物の学習だ。" },
  { minAccuracy: 0.6, grade: "B", title: "適度な挑戦",    message: "難しさと実力が釣り合ってる。成長の黄金ゾーン。" },
  { minAccuracy: 0.4, grade: "C", title: "脳が抵抗中",    message: "まだ固まっていない単語が多い。それが今日の収穫。" },
  { minAccuracy: 0,   grade: "D", title: "インプット段階", message: "知らない言葉と出会えた。記憶は繰り返しで作られる。" },
];

// ── XP定数 ────────────────────────────────────────────────────────────────
// 正解1問あたりの基本XPを大幅に引き下げ、質ボーナスとのバランスを取る
// 10問満点時: 基本XP = 10 × 20 = 200。質ボーナスが主役になる設計
const BASE_XP_PER_CORRECT  = 20;  // 旧: 100 → 大幅削減
const XP_WEAKNESS_PER_WRONG = 30; // 苦手回収: previousWrong × 30 (上限80)
const XP_WEAKNESS_CAP       = 80;
const XP_NEW_WORD           = 50; // 新単語初見正解: 50固定
const XP_NET_RISE           = 40; // 定着スコア上昇: 40固定


// ── フローゾーン係数 ───────────────────────────────────────────────────────
// リザルトから連続プレイした回数に応じて倍率が上昇（1回目:1.1, 2回目:1.2, 3回目:1.3, 4回目:1.4, 5回目以降:1.5）
function flowZoneMultiplier(playCount = 1) {
  if (playCount >= 5) return 1.5;
  if (playCount === 4) return 1.4;
  if (playCount === 3) return 1.3;
  if (playCount === 2) return 1.2;
  return 1.1; // 1回目
}

// ── 学習質ボーナス計算 ────────────────────────────────────────────────────

/**
 * ① 苦手回収ボーナス
 * Kornell & Bjork(2008): 誤答後の正解転換は長期記憶が最も強化される。
 * previousWrong が深いほど報酬を増やし、苦手再挑戦動機を維持する。
 * 定義: previousWrong > 0 かつ correct = true
 */
function computeWeaknessBonus(answers, multiplier) {
  const recovered = answers.filter(a => a.correct && a.previousWrong > 0);
  if (recovered.length === 0) return { points: 0, detail: null };
  const raw = recovered.reduce(
    (sum, a) => sum + Math.min(a.previousWrong * XP_WEAKNESS_PER_WRONG, XP_WEAKNESS_CAP),
    0
  );
  return {
    points: Math.round(raw * multiplier),
    detail: `苦手単語 ${recovered.length}語を正解に転換`,
  };
}

/**
 * ② 新単語初見正解ボーナス
 * Metcalfe & Kornell(2005) 生成効果: 初回接触で自力正解した語の符号化深度が最大。
 * 定義: previousCorrect === 0 かつ previousWrong === 0 かつ correct = true
 */
function computeNewWordBonus(answers, multiplier) {
  const newCorrect = answers.filter(
    a => a.correct && a.previousCorrect === 0 && a.previousWrong === 0
  );
  if (newCorrect.length === 0) return { points: 0, detail: null };
  return {
    points: Math.round(newCorrect.length * XP_NEW_WORD * multiplier),
    detail: `初見で正解 ${newCorrect.length}語`,
  };
}

/**
 * ③ 定着スコア上昇ボーナス
 * Pashler et al.(2007): ネットスコア(正解-不正解)が正転した語は
 * 90日後の保持率が未定着語の3倍。ADHD向けに前進感を可視化する。
 * 定義: correct = true かつ (previousCorrect - previousWrong) ≤ 0
 */
function computeNetRiseBonus(answers, multiplier) {
  const risen = answers.filter(
    a => a.correct && (a.previousCorrect - a.previousWrong) <= 0
  );
  if (risen.length === 0) return { points: 0, detail: null };
  return {
    points: Math.round(risen.length * XP_NET_RISE * multiplier),
    detail: `${risen.length}語の定着スコアがプラス転換`,
  };
}

// ── XP計算コア ──────────────────────────────────────────────────────────
function computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount = 1 }) {
  const tier           = getPoolTier(unlockedPoolSize);
  const { multiplier } = tier;
  const accuracy       = playLimit > 0 ? score / playLimit : 0;
  const fzm            = flowZoneMultiplier(playCount); // accuracy から playCount に変更

  // 基本XP（ストリークなし）
  const baseXP  = Math.round(score * BASE_XP_PER_CORRECT * multiplier * fzm);

  // 質ボーナス（answersがある場合のみ）
  const weakness = answers ? computeWeaknessBonus(answers, multiplier)  : { points: 0, detail: null };
  const newWord  = answers ? computeNewWordBonus(answers, multiplier)   : { points: 0, detail: null };
  const netRise  = answers ? computeNetRiseBonus(answers, multiplier)   : { points: 0, detail: null };

  const totalXP = baseXP + weakness.points + newWord.points + netRise.points;

  return { baseXP, weakness, newWord, netRise, totalXP, tier, fzm, multiplier, accuracy };
}

// ── 公開API ───────────────────────────────────────────────────────────────

/**
 * セッション XP を計算する純粋関数。
 * page.js の applyEndOfPlay から呼ばれる。
 * answers を受け取り、質ボーナスを含む totalXP を返す。
 * ※ page.js 側で answers（sessionAnswers）を渡すよう変更が必要
 *
 * シグネチャ変更: bestStreak パラメータを削除、answers を追加
 */
export function computeSessionXP({ answers, score, unlockedPoolSize, playLimit, playCount = 1 }) {
  const { totalXP, tier } = computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount });
  return { baseXP: 0, streakXP: 0, totalXP, tier };
}

/**
 * 1プレイの評価結果を返す。
 * ResultScreen.js の期待する shape と完全互換:
 *   { grade, title, message, xp, tier, breakdown }
 */
export function evaluatePlay({ answers, score, playLimit, bestStreak, unlockedPoolSize, playCount = 1 }) {
  const accuracy   = playLimit > 0 ? score / playLimit : 0;
  const gradeEntry = GRADES.find(g => accuracy >= g.minAccuracy) ?? GRADES.at(-1);

  const { baseXP, weakness, newWord, netRise, totalXP, tier, fzm, multiplier } =
    computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount });

  const breakdown = [
    {
      label:  "正解ボーナス",
      points: baseXP,
      max:    Math.round(playLimit * BASE_XP_PER_CORRECT * multiplier * 1.4),
      detail: `${score}問正解 × ${BASE_XP_PER_CORRECT} × ${multiplier} (${tier.label})`
        + (fzm !== 1.0 ? ` × フロー係数${fzm}` : ""),
    },
    ...(weakness.points > 0 ? [{
      label:  "🔁 苦手回収",
      points: weakness.points,
      max:    null,
      detail: weakness.detail,
    }] : []),
    ...(newWord.points > 0 ? [{
      label:  "✨ 新単語初見正解",
      points: newWord.points,
      max:    null,
      detail: newWord.detail,
    }] : []),
    ...(netRise.points > 0 ? [{
      label:  "📈 定着スコア上昇",
      points: netRise.points,
      max:    null,
      detail: netRise.detail,
    }] : []),
  ];

  return {
    grade:   gradeEntry.grade,
    title:   gradeEntry.title,
    message: gradeEntry.message,
    xp:      totalXP,
    tier,
    breakdown,
  };
}
