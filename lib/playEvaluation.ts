import { getPoolTier } from "./poolTier";
import { XP } from "./constants";
import { SessionAnswer, PlayEvaluation, PoolTier, EvaluationBreakdownItem } from "./types";

interface GradeEntry {
  minAccuracy: number;
  grade: string;
  title: string;
  message: string;
}

// ── グレード定義（プロセス・状態重視） ────────────────────────────────────
const GRADES: GradeEntry[] = [
  { minAccuracy: 1.0, grade: "S", title: "ゾーン突入",    message: "完璧な集中状態！この感覚を覚えておこう。" },
  { minAccuracy: 0.8, grade: "A", title: "フロー状態",    message: "脳がノってる。このリズムが本物の学習だ。" },
  { minAccuracy: 0.6, grade: "B", title: "適度な挑戦",    message: "難しさと実力が釣り合ってる。成長の黄金ゾーン。" },
  { minAccuracy: 0.4, grade: "C", title: "脳が抵抗中",    message: "まだ固まっていない単語が多い。それが今日の収穫。" },
  { minAccuracy: 0,   grade: "D", title: "インプット段階", message: "知らない言葉と出会えた。記憶は繰り返しで作られる。" },
];

// ── フローゾーン係数 ───────────────────────────────────────────────────────
function flowZoneMultiplier(playCount: number = 1): number {
  if (playCount >= 5) return 1.5;
  if (playCount === 4) return 1.4;
  if (playCount === 3) return 1.3;
  if (playCount === 2) return 1.2;
  return 1.1; // 1回目
}

// ── 学習質ボーナス計算 ────────────────────────────────────────────────────

interface BonusResult {
  points: number;
  detail: string | null;
}

/** 正答率が低いセッションでは表示に「×正答率」を添えて内訳を正直にする */
function accuracyNote(accuracy: number): string {
  return accuracy < 1 ? `（×正答率${Math.round(accuracy * 100)}%）` : "";
}

function computeWeaknessBonus(answers: SessionAnswer[], scale: number, accuracy: number): BonusResult {
  const recovered = answers.filter(a => a.correct && a.previousWrong > 0);
  if (recovered.length === 0) return { points: 0, detail: null };
  const raw = recovered.reduce(
    (sum, a) => sum + Math.min(a.previousWrong * XP.WEAKNESS_PER_WRONG, XP.WEAKNESS_CAP),
    0
  );
  return {
    points: Math.round(raw * scale),
    detail: `苦手単語 ${recovered.length}語を正解に転換${accuracyNote(accuracy)}`,
  };
}

function computeNewWordBonus(answers: SessionAnswer[], scale: number, accuracy: number): BonusResult {
  const newCorrect = answers.filter(
    a => a.correct && a.previousCorrect === 0 && a.previousWrong === 0
  );
  if (newCorrect.length === 0) return { points: 0, detail: null };
  return {
    points: Math.round(newCorrect.length * XP.NEW_WORD * scale),
    detail: `初見で正解 ${newCorrect.length}語${accuracyNote(accuracy)}`,
  };
}

/**
 * 「定着スコア（正解数 − 誤答数）がプラスへ転換した」語のボーナス。
 *
 * 以前の条件は `previousCorrect - previousWrong <= 0` だったが、これはラベルと
 * 一致していなかった。(正解0, 誤答5) の語は正解しても -5 → -4 でマイナスのまま
 * なのに加算されていたうえ、苦手回収ボーナスと二重取りになっていた。
 * 実際に符号が反転するのは差がちょうど 0 の語だけなので `=== 0` で判定する。
 *
 * 初見の語 (0, 0) も差は 0 だが、そちらは新単語ボーナスが受け持つ。
 * 両方に数えると初見正解1語で 50 + 40 の二重取りになるため除外する。
 */
function computeNetRiseBonus(answers: SessionAnswer[], scale: number, accuracy: number): BonusResult {
  const risen = answers.filter(
    a =>
      a.correct &&
      a.previousCorrect + a.previousWrong > 0 &&
      a.previousCorrect - a.previousWrong === 0
  );
  if (risen.length === 0) return { points: 0, detail: null };
  return {
    points: Math.round(risen.length * XP.NET_RISE * scale),
    detail: `${risen.length}語の定着スコアがプラス転換${accuracyNote(accuracy)}`,
  };
}

// ── XP計算コア ──────────────────────────────────────────────────────────
interface ComputeAllXPProps {
  answers: SessionAnswer[] | null;
  score: number;
  playLimit: number;
  unlockedPoolSize: number;
  playCount?: number;
}

interface ComputeAllXPResult {
  baseXP: number;
  weakness: BonusResult;
  newWord: BonusResult;
  netRise: BonusResult;
  totalXP: number;
  tier: PoolTier;
  fzm: number;
  multiplier: number;
  accuracy: number;
}

function computeAllXP({
  answers,
  score,
  playLimit,
  unlockedPoolSize,
  playCount = 1,
}: ComputeAllXPProps): ComputeAllXPResult {
  const tier = getPoolTier(unlockedPoolSize);
  const { multiplier } = tier;
  const accuracy = playLimit > 0 ? score / playLimit : 0;
  const fzm = flowZoneMultiplier(playCount);

  // 基本XP
  const baseXP = Math.round(score * XP.BASE_PER_CORRECT * multiplier * fzm);

  // 質ボーナス。
  //
  // 正答率を掛けるのは、誤答に一切コストがないと成績の悪いセッションほど
  // 高得点になってしまうため。以前は 2/10 正解（グレードD）の 284XP が
  // 10/10 正解（グレードS）の 220XP を上回っており、グレードと XP が矛盾していた。
  //
  // 誤答そのものを減点にすると毎問の失敗が重くなりフローを削ぐので、
  // 「ボーナスの取り分がセッションの出来に比例する」形でコストを表現する。
  // 誤答1問につきボーナス全体の10%が減る計算になる。
  const bonusScale = multiplier * accuracy;
  const weakness = answers ? computeWeaknessBonus(answers, bonusScale, accuracy) : { points: 0, detail: null };
  const newWord = answers ? computeNewWordBonus(answers, bonusScale, accuracy) : { points: 0, detail: null };
  const netRise = answers ? computeNetRiseBonus(answers, bonusScale, accuracy) : { points: 0, detail: null };

  const totalXP = baseXP + weakness.points + newWord.points + netRise.points;

  return { baseXP, weakness, newWord, netRise, totalXP, tier, fzm, multiplier, accuracy };
}

// ── 公開API ───────────────────────────────────────────────────────────────

interface ComputeSessionXPProps {
  answers: SessionAnswer[] | null;
  score: number;
  unlockedPoolSize: number;
  playLimit: number;
  playCount?: number;
}

interface ComputeSessionXPResult {
  baseXP: number;
  streakXP: number;
  totalXP: number;
  tier: PoolTier;
}

export function computeSessionXP({
  answers,
  score,
  unlockedPoolSize,
  playLimit,
  playCount = 1,
}: ComputeSessionXPProps): ComputeSessionXPResult {
  const { totalXP, tier } = computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount });
  return { baseXP: 0, streakXP: 0, totalXP, tier };
}

interface EvaluatePlayProps {
  answers: SessionAnswer[] | null;
  score: number;
  playLimit: number;
  bestStreak: number;
  unlockedPoolSize: number;
  playCount?: number;
}

export function evaluatePlay({
  answers,
  score,
  playLimit,
  unlockedPoolSize,
  playCount = 1,
}: EvaluatePlayProps): PlayEvaluation {
  const accuracy = playLimit > 0 ? score / playLimit : 0;
  const gradeEntry = GRADES.find(g => accuracy >= g.minAccuracy) ?? GRADES.at(-1)!;

  const { baseXP, weakness, newWord, netRise, totalXP, tier, fzm, multiplier } =
    computeAllXP({ answers, score, playLimit, unlockedPoolSize, playCount });

  const breakdown: EvaluationBreakdownItem[] = [
    {
      label:  "正解ボーナス",
      points: baseXP,
      max:    Math.round(playLimit * XP.BASE_PER_CORRECT * multiplier * 1.5),
      detail: `${score}問正解 × ${XP.BASE_PER_CORRECT} × ${multiplier} (${tier.label})`
        + (fzm !== 1.0 ? ` × フロー係数${fzm}` : ""),
    },
    ...(weakness.points > 0 ? [{
      label:  "🔁 苦手回収",
      points: weakness.points,
      max:    null as null,
      detail: weakness.detail!,
    }] : []),
    ...(newWord.points > 0 ? [{
      label:  "✨ 新単語初見正解",
      points: newWord.points,
      max:    null as null,
      detail: newWord.detail!,
    }] : []),
    ...(netRise.points > 0 ? [{
      label:  "📈 定着スコア上昇",
      points: netRise.points,
      max:    null as null,
      detail: netRise.detail!,
    }] : []),
  ];

  return {
    grade:   gradeEntry.grade,
    title:   gradeEntry.title,
    message: gradeEntry.message,
    xp:      totalXP,
    tier,
    fzm,
    breakdown,
  };
}
