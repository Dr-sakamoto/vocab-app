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

const BASE_XP_PER_CORRECT = 100;
const STREAK_XP_PER_CHAIN = 15;
const STREAK_BONUS_MIN    = 3;

// ── フローゾーン係数 ───────────────────────────────────────────────────────
// Csikszentmihalyi(1990): 難易度=スキルの交点がフロー。
// 60-80%正解帯が「適度な挑戦」として最も深い符号化(encoding)を促す。
// 100%完璧はむしろ刺激不足で ADHD の注意を引きにくい。
function flowZoneMultiplier(accuracy) {
  if (accuracy >= 0.60 && accuracy <= 0.80) return 1.4; // フローゾーン
  if (accuracy > 0.80  && accuracy < 1.00)  return 1.2; // 高パフォーマンス
  if (accuracy === 1.00)                     return 1.1; // 完璧(退屈ゾーン寄り)
  if (accuracy >= 0.40)                      return 1.0; // 標準
  return 0.85;                                           // 苦戦中(でも挑戦した)
}

// ── 3つの学習質ボーナス ───────────────────────────────────────────────────

/**
 * ① 苦手回収ボーナス
 * 根拠: Kornell & Bjork(2008) 誤りを正解に転換した試行は
 *       「誤答効果 (error-induced learning)」により長期記憶が最も強化される。
 *       ADHD では苦手への再挑戦回避が顕著(Barkley 1997)なので、
 *       苦手を正解したことを高く評価し再挑戦動機を維持する。
 *
 * 定義: previousWrong > 0 かつ今回 correct = true の問題
 * XP  : 問題ごとに previousWrong に比例 (苦手が深いほど高報酬)
 *        XP = previousWrong × 40 (上限 120)
 */
function computeWeaknessRecoveryBonus(answers, multiplier) {
  const recovered = answers.filter(a => a.correct && a.previousWrong > 0);
  if (recovered.length === 0) return { points: 0, count: 0, detail: null };

  const XP_PER_WRONG = 40;
  const CAP_PER_ITEM = 120;
  const raw = recovered.reduce(
    (sum, a) => sum + Math.min(a.previousWrong * XP_PER_WRONG, CAP_PER_ITEM),
    0
  );
  const points = Math.round(raw * multiplier);
  return {
    points,
    count: recovered.length,
    detail: `苦手単語 ${recovered.length}語を正解に転換`,
  };
}

/**
 * ② 新単語初見正解ボーナス
 * 根拠: Metcalfe & Kornell(2005) 初回接触(previousCorrect=0, previousWrong=0)で
 *       正解した語は「生成効果 (generation effect)」が最大になる。
 *       Nation(2001) 語彙習得は未知語との接触回数より初回の成功体験が定着率を決める。
 *       ADHD の作業記憶制約下では初回成功が後続想起の足掛かりになる。
 *
 * 定義: previousCorrect === 0 かつ previousWrong === 0 かつ correct = true
 * XP  : 1語あたり 60 XP (固定)
 */
function computeNewWordBonus(answers, multiplier) {
  const newCorrect = answers.filter(
    a => a.correct && a.previousCorrect === 0 && a.previousWrong === 0
  );
  if (newCorrect.length === 0) return { points: 0, count: 0, detail: null };

  const XP_PER_NEW = 60;
  const points = Math.round(newCorrect.length * XP_PER_NEW * multiplier);
  return {
    points,
    count: newCorrect.length,
    detail: `初見で正解 ${newCorrect.length}語`,
  };
}

/**
 * ③ ネット上昇ボーナス
 * 根拠: Ebbinghaus(1885) 忘却曲線 + Leitner(1972) 間隔反復法。
 *       「正解 − 不正解 = ネットスコア」の上昇は定着度向上を直接示す。
 *       Pashler et al.(2007): 間隔反復でネットスコアが正に転じた語の
 *       90日後の保持率は未定着語の3倍。
 *       ADHD では累積的な前進が見えないと離脱するため(Barkley 2011)、
 *       「今日のプレイで何語改善したか」を可視化し前進感を与える。
 *
 * 定義: 今回 correct=true かつ (previousCorrect - previousWrong) ≤ 0 の語
 *       → このセッションで初めてネット値が正転した語
 *       ※ 苦手回収ボーナスとの重複を除外しない(別軸の評価のため)
 * XP  : 1語あたり 50 XP
 */
function computeNetRiseBonus(answers, multiplier) {
  const risen = answers.filter(
    a => a.correct && (a.previousCorrect - a.previousWrong) <= 0
  );
  if (risen.length === 0) return { points: 0, count: 0, detail: null };

  const XP_PER_RISE = 50;
  const points = Math.round(risen.length * XP_PER_RISE * multiplier);
  return {
    points,
    count: risen.length,
    detail: `${risen.length}語の定着スコアがプラス転換`,
  };
}

// ── 公開API (page.js 互換) ────────────────────────────────────────────────

/**
 * 純粋関数: セッション XP を計算する
 * page.js の next() から直接呼ばれる。シグネチャ・戻り値 shape を維持。
 * ※ answers を持たないため質ボーナスは含まない（evaluatePlay で加算）
 */
export function computeSessionXP({ score, bestStreak, unlockedPoolSize, playLimit }) {
  const tier           = getPoolTier(unlockedPoolSize);
  const { multiplier } = tier;
  const accuracy       = playLimit > 0 ? score / playLimit : 0;
  const fzm            = flowZoneMultiplier(accuracy);

  const baseXP   = Math.round(score * BASE_XP_PER_CORRECT * multiplier);
  const streakXP = bestStreak >= STREAK_BONUS_MIN
    ? Math.round(bestStreak * STREAK_XP_PER_CHAIN * multiplier)
    : 0;
  const totalXP  = Math.round((baseXP + streakXP) * fzm);

  return { baseXP, streakXP, totalXP, tier };
}

/**
 * 1プレイの評価結果を返す
 * ResultScreen.js の期待する shape と完全互換:
 *   { grade, title, message, xp, tier, breakdown }
 */
export function evaluatePlay({ answers, score, playLimit, bestStreak, unlockedPoolSize }) {
  const accuracy   = playLimit > 0 ? score / playLimit : 0;
  const gradeEntry = GRADES.find(g => accuracy >= g.minAccuracy) ?? GRADES.at(-1);

  const tier           = getPoolTier(unlockedPoolSize);
  const { multiplier } = tier;
  const fzm            = flowZoneMultiplier(accuracy);

  // 基本 XP（フロー係数込み）
  const baseXP   = Math.round(score * BASE_XP_PER_CORRECT * multiplier);
  const streakXP = bestStreak >= STREAK_BONUS_MIN
    ? Math.round(bestStreak * STREAK_XP_PER_CHAIN * multiplier)
    : 0;
  const coreXP   = Math.round((baseXP + streakXP) * fzm);

  // 3つの学習質ボーナス
  const weakness = computeWeaknessRecoveryBonus(answers, multiplier);
  const newWord  = computeNewWordBonus(answers, multiplier);
  const netRise  = computeNetRiseBonus(answers, multiplier);

  const totalXP = coreXP + weakness.points + newWord.points + netRise.points;

  // ── breakdown カード ────────────────────────────────────────────────────
  // 固定2枚 + 発生した質ボーナスのみ追加（0点カードは非表示）
  const breakdown = [
    {
      label:  "正解ボーナス",
      points: Math.round(baseXP * fzm),
      max:    Math.round(playLimit * BASE_XP_PER_CORRECT * multiplier * 1.4),
      detail: `${score}問正解 × ${BASE_XP_PER_CORRECT} × ×${multiplier} (${tier.label})`
        + (fzm !== 1.0 ? ` × フロー係数${fzm}` : ""),
    },
    {
      label:  "ストリークボーナス",
      points: Math.round(streakXP * fzm),
      max:    null,
      detail: bestStreak >= STREAK_BONUS_MIN
        ? `最高${bestStreak}連鎖 × ${STREAK_XP_PER_CHAIN} × ×${multiplier}`
        : `${STREAK_BONUS_MIN}連鎖以上で発生`,
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
