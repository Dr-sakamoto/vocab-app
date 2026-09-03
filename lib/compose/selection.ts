import { COMPOSE } from "./constants";
import { COMPOSE_PROMPTS } from "./prompts";
import { getTagWeight, getWeakTagIds } from "./mastery";
import type { ComposeMode, ComposePrompt, ComposeProgress, PromptStat } from "./types";

// =====================================================
// 出題の選び方。
//
// このアプリの売りは「苦手な文法から出る」こと。ここが素の乱数に
// 落ちると、アプリの主張そのものが嘘になる。
//
// 重みは3つの層の積で決める:
//   タグの弱さ（lib/compose/mastery.ts）
//     × その問題自体の復習どき（直近に高得点で解いた問題は沈める）
//     × レベルの当たりぐあい（実力から離れすぎたレベルを抑える）
// =====================================================

/** 1問ぶんの重みの内訳。テストと分析画面から中身を確認できるようにする */
export interface PromptWeight {
  prompt: ComposePrompt;
  weight: number;
  /** その問題を代表する弱点タグ（重みがいちばん高かったタグ） */
  leadTagId: string;
}

/**
 * 問題そのものの重み。タグの弱さとは別に、同じ問題を続けて出さない。
 *
 * 高得点で解けた問題ほど深く沈める。ただしゼロにはしない——文法は
 * できるようになってからも、間隔を空けて出会い直すことで定着する。
 */
function getPromptFactor(stat: PromptStat | undefined, now: number): number {
  if (!stat || stat.attempts === 0) return 1.25;

  const sinceDays = stat.lastAnswered ? (now - stat.lastAnswered) / 86_400_000 : 999;
  // 直近24時間に解いた問題は強く沈める（同じセッションでの再出題を防ぐ）
  const recency = sinceDays < 1 ? 0.08 : sinceDays < 3 ? 0.45 : 1;
  // 前回の出来。落とした問題は次のセッションで戻ってくる
  const performance = stat.lastScore >= COMPOSE.PASS_SCORE ? 0.55 : 1.5;
  return recency * performance;
}

/**
 * レベルの当たりぐあい。
 *
 * 実力の推定には「全タグの平均習熟度」ではなく、直近の平均スコアを使う
 * ……のではなく、ここでは単純に、解いた問題の平均点から狙うレベルを決める。
 * 低い点しか出ていない人に応用ばかり出しても、添削が読み切れず折れる。
 */
function getLevelFactor(level: number, averageScore: number, attempts: number): number {
  // 答案が少ないうちはレベルで絞らない（実力が推定できていない）
  if (attempts < 5) return 1;
  const target = averageScore >= 85 ? 3 : averageScore >= 65 ? 2 : 1;
  const distance = Math.abs(level - target);
  return distance === 0 ? 1.3 : distance === 1 ? 0.8 : 0.35;
}

export interface BuildWeightsParams {
  progress: ComposeProgress;
  mode: ComposeMode;
  now?: number;
  prompts?: ComposePrompt[];
}

/**
 * 候補ごとの重みを出す。
 *
 * 弱点特訓（`weakness`）では、実測で弱いと分かっているタグを含む問題だけに
 * 絞る。まだ弱点が測れていない（＝答案が少ない）うちは絞りようがないので、
 * 通常の重み付けへ落とす。「弱点が無いので出せません」は答えとして最悪で、
 * 学習者は何もできずにアプリを閉じることになる。
 */
export function buildPromptWeights({
  progress,
  mode,
  now = Date.now(),
  prompts = COMPOSE_PROMPTS,
}: BuildWeightsParams): PromptWeight[] {
  const weakTagIds = new Set(getWeakTagIds(progress));
  const pool =
    mode === "weakness" && weakTagIds.size > 0
      ? prompts.filter((prompt) => prompt.tags.some((tag) => weakTagIds.has(tag)))
      : prompts;

  const averageScore =
    progress.totalAttempts > 0 ? progress.scoreSum / progress.totalAttempts : 0;

  return pool.map((prompt) => {
    let leadTagId = prompt.tags[0] ?? "";
    let tagWeight = 0;
    for (const tagId of prompt.tags) {
      const weight = getTagWeight(progress.tags[tagId], now);
      if (weight > tagWeight) {
        tagWeight = weight;
        leadTagId = tagId;
      }
    }

    const weight =
      tagWeight *
      getPromptFactor(progress.prompts[prompt.id], now) *
      getLevelFactor(prompt.level, averageScore, progress.totalAttempts);

    return { prompt, weight: Math.max(0.01, weight), leadTagId };
  });
}

/** 重み付き抽選。テストから乱数を差し替えられるように rng を受ける */
function pickWeighted(candidates: PromptWeight[], random: () => number): PromptWeight | null {
  if (candidates.length === 0) return null;
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let cursor = random() * total;
  for (const candidate of candidates) {
    cursor -= candidate.weight;
    if (cursor <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

export interface PickSessionParams extends BuildWeightsParams {
  setSize?: number;
  random?: () => number;
}

/**
 * 1セッションぶんの問題を選ぶ。
 *
 * 同じ問題は入れない。同じタグも COMPOSE.MAX_SAME_TAG_PER_SET 問までに
 * 抑える——弱点に寄せるほど1タグに偏るが、5問すべてが同じ弱点だと
 * 「今日は何もできなかった」という記憶だけが残る。
 *
 * 上限に当たって候補が尽きたら、まず出題プール全体（弱点以外も含む）へ
 * 広げて枠を埋める。弱点が1つしか無いときの弱点特訓が、そのタグ5問に
 * ならないのはこのため。それでも埋まらないときだけ上限を外す
 * （短いセッションを返すより、多少偏るほうがまだよい）。
 */
export function pickSession({
  progress,
  mode,
  setSize = COMPOSE.DEFAULT_SET_SIZE,
  now = Date.now(),
  prompts,
  random = Math.random,
}: PickSessionParams): ComposePrompt[] {
  const primary = buildPromptWeights({ progress, mode, now, prompts });
  // 弱点特訓で候補が尽きたときに広げる先。弱点以外も含む通常の重み付け。
  const fallback =
    mode === "weakness" ? buildPromptWeights({ progress, mode: "compose", now, prompts }) : primary;

  const picked: ComposePrompt[] = [];
  const usedIds = new Set<string>();
  const tagCounts = new Map<string, number>();

  const isTagAvailable = (prompt: ComposePrompt) =>
    prompt.tags.every((tag) => (tagCounts.get(tag) ?? 0) < COMPOSE.MAX_SAME_TAG_PER_SET);

  const unused = (candidates: PromptWeight[]) =>
    candidates.filter((candidate) => !usedIds.has(candidate.prompt.id));

  while (picked.length < setSize) {
    const primaryPool = unused(primary);
    const fallbackPool = unused(fallback);

    // 上限を守れる候補を、狙いのプール → 全体プール の順で探す。
    // どちらにも無ければ、最後に上限を外して枠を埋める。
    const candidates =
      primaryPool.filter((candidate) => isTagAvailable(candidate.prompt)).length > 0
        ? primaryPool.filter((candidate) => isTagAvailable(candidate.prompt))
        : fallbackPool.filter((candidate) => isTagAvailable(candidate.prompt)).length > 0
          ? fallbackPool.filter((candidate) => isTagAvailable(candidate.prompt))
          : primaryPool.length > 0
            ? primaryPool
            : fallbackPool;

    const chosen = pickWeighted(candidates, random);
    if (!chosen) break;

    picked.push(chosen.prompt);
    usedIds.add(chosen.prompt.id);
    for (const tag of chosen.prompt.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  return picked;
}
