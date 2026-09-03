import { COMPOSE } from "./constants";
import { getRetentionFactor } from "../reviewSchedule";
import { GRAMMAR_TAGS, type GrammarTag } from "./grammarTags";
import type { ComposeProgress, TagStat, TagVerdict } from "./types";

// =====================================================
// 文法タグごとの習熟度。
//
// このアプリの中心にある数字。出題の重み付けも、分析画面の並びも、
// 「今日どこが伸びたか」の表示も、すべてここから出る。
//
// 設計の要点は3つ:
//   1. 平均ではなく直近を重く見る（EMA）。3週間前の失点で「苦手」と
//      言われ続けると、伸びた実感が数字に出ず、続ける理由が減る。
//   2. 答案が少ないタグは中庸へ引き戻す（縮小推定）。1問できただけで
//      「得意」と判定すると、そのタグが出題から消えて穴が固定される。
//   3. 時間を効かせる（分散学習）。単語アプリで使っている
//      lib/reviewSchedule.ts の間隔をそのまま借りる。
// =====================================================

export const EMPTY_TAG_STAT: TagStat = { attempts: 0, passStreak: 0, missCount: 0 };

/** これを下回るタグを「弱点」として扱う（弱点特訓の母集団） */
export const WEAK_MASTERY_THRESHOLD = 70;

export function getTagStat(progress: ComposeProgress, tagId: string): TagStat {
  return progress.tags[tagId] ?? EMPTY_TAG_STAT;
}

/**
 * 1答案ぶんの結果をタグの統計へ畳み込む。
 *
 * `verdict` はAI採点がそのタグについて返した判定。AIが使えなかったとき
 * （ローカル採点）は undefined で、スコアだけが反映される。
 */
export function applyScoreToTagStat(
  stat: TagStat | undefined,
  score: number,
  verdict?: TagVerdict,
  now: number = Date.now(),
): TagStat {
  const previous = stat ?? EMPTY_TAG_STAT;
  const clamped = Math.max(0, Math.min(100, score));

  // タグ単位の点数はスコアそのものではなく、AIのタグ判定があればそちらを
  // 優先する。文全体は良くても狙った文法だけ落としている（逆もある）ため。
  const tagScore =
    verdict === "ok" ? Math.max(clamped, 90)
      : verdict === "shaky" ? Math.min(clamped, 70)
        : verdict === "missed" ? Math.min(clamped, 40)
          : clamped;

  const ema =
    previous.ema === undefined
      ? tagScore
      : previous.ema + COMPOSE.EMA_ALPHA * (tagScore - previous.ema);

  const passed = tagScore >= COMPOSE.PASS_SCORE;

  return {
    attempts: previous.attempts + 1,
    ema,
    passStreak: passed ? previous.passStreak + 1 : 0,
    lastAnswered: now,
    missCount: previous.missCount + (verdict === "missed" ? 1 : 0),
  };
}

/**
 * 習熟度（0〜100）。答案が少ないうちは中庸（PRIOR_MASTERY）へ寄せる。
 *
 *   mastery = (ema * attempts + 中庸 * 重み) / (attempts + 重み)
 *
 * 1問だけ100点のタグは (100*1 + 50*2)/3 = 67 に留まり、「得意」とは
 * 判定されない。3回・4回と積むにつれて実測値へ寄っていく。
 */
export function getMastery(stat: TagStat | undefined): number {
  if (!stat || stat.attempts === 0 || stat.ema === undefined) return COMPOSE.PRIOR_MASTERY;
  const { PRIOR_MASTERY, PRIOR_WEIGHT } = COMPOSE;
  const weighted = stat.ema * stat.attempts + PRIOR_MASTERY * PRIOR_WEIGHT;
  return Math.round(weighted / (stat.attempts + PRIOR_WEIGHT));
}

/** 弱点の強さ（0〜100）。習熟度の裏返し */
export function getWeakness(stat: TagStat | undefined): number {
  return 100 - getMastery(stat);
}

/**
 * タグの統計を、単語アプリの分散学習ロジックが読める形へ変換する。
 *
 * lib/reviewSchedule.ts は「正解数・誤答数・連続正解数・最終解答時刻」から
 * 復習の期日を決める。タグの統計は同じ情報を別の形で持っているだけなので、
 * 間隔の設計（0/1/3/7/14/30日、正答率による ease）をここで作り直さずに借りる。
 */
function toReviewStat(stat: TagStat) {
  const correct = Math.round((stat.attempts * (stat.ema ?? COMPOSE.PRIOR_MASTERY)) / 100);
  return {
    correct,
    wrong: Math.max(0, stat.attempts - correct),
    correctStreak: stat.passStreak,
    lastAnswered: stat.lastAnswered,
  };
}

/**
 * 出題の重み。値が大きいほど、そのタグを含む問題が選ばれやすい。
 *
 * - 未挑戦のタグは高めに出す。弱点かどうかが分かっていない状態こそ、
 *   分析の穴。1問当てれば以降は実測で回せる。
 * - 弱いタグほど強く出すが、青天井にはしない（1タグが全部の枠を
 *   食い潰すと、セッションが「できないことだけ」になって続かない）。
 * - 最後に分散学習の時間係数を掛ける。さっき解いたばかりのタグは沈み、
 *   期日を過ぎたタグは浮く。
 */
export function getTagWeight(stat: TagStat | undefined, now: number = Date.now()): number {
  if (!stat || stat.attempts === 0) return 1.6;
  const weakness = getWeakness(stat) / 100;
  const base = 0.35 + 2.8 * weakness ** 1.2;
  return base * getRetentionFactor(toReviewStat(stat), now);
}

export interface TagProgressRow {
  tag: GrammarTag;
  stat: TagStat;
  mastery: number;
  /** 一度も答えていないタグ。習熟度は推定値でしかない */
  untouched: boolean;
}

/**
 * 分析画面の一覧。弱い順に並べ、未挑戦は最後にまとめる。
 *
 * 未挑戦を「習熟度50」として弱点の列に混ぜると、まだ測っていないものと
 * 実測して苦手だったものが同じ顔で並ぶ。学習者が次に取る行動が変わるので
 * （前者は試す、後者は復習する）、列の中では区別する。
 */
export function buildTagProgressRows(progress: ComposeProgress): TagProgressRow[] {
  const rows = GRAMMAR_TAGS.map((tag) => {
    const stat = getTagStat(progress, tag.id);
    return {
      tag: tag as GrammarTag,
      stat,
      mastery: getMastery(stat),
      untouched: stat.attempts === 0,
    };
  });

  return rows.sort((a, b) => {
    if (a.untouched !== b.untouched) return a.untouched ? 1 : -1;
    if (a.mastery !== b.mastery) return a.mastery - b.mastery;
    return b.stat.attempts - a.stat.attempts;
  });
}

/** 実測で弱いと分かっているタグ（弱点特訓の母集団） */
export function getWeakTagIds(progress: ComposeProgress): string[] {
  return buildTagProgressRows(progress)
    .filter((row) => !row.untouched && row.mastery < WEAK_MASTERY_THRESHOLD)
    .map((row) => row.tag.id);
}

/** 習熟度の色。灰（未挑戦）→ 赤寄り（弱い）→ 黄 → 緑（定着） */
export function getMasteryColor(mastery: number, untouched: boolean): string {
  if (untouched) return "var(--ink-3)";
  if (mastery < 45) return "var(--negative)";
  if (mastery < WEAK_MASTERY_THRESHOLD) return "var(--warning)";
  return "var(--positive)";
}
