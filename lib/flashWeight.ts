import { WordStat } from "./types";
import { weightedPickIndex } from "./weightedPick";
import { FLASH } from "./constants";

function getFlashWeight(stat: WordStat | undefined): number {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  const attempts = correct + wrong;
  if (attempts === 0) return 4; // 未挑戦は最優先で見せる
  if (wrong === 0) return correct >= 2 ? 0.3 : 0.8; // 定着済み／直近正解は出現を抑える
  return 1.2; // 学習中
}

/** 既定回数以上間違えている「よく間違える語」かどうか */
export function isMistakeWord(stat: WordStat | undefined): boolean {
  return (stat?.wrong ?? 0) >= FLASH.MISTAKE_MIN_WRONG;
}

/** candidates のうち「よく間違える語」だけを抜き出す */
export function filterMistakeIndices(candidates: number[], stats: WordStat[]): number[] {
  return candidates.filter((i) => isMistakeWord(stats[i]));
}

/**
 * 解放済みプール（tier）内から、未挑戦・定着未熟な単語ほど高頻度で出す重み付き抽選。
 * `candidates` は解放済みの VOCAB_ITEMS 添字（useVocabPool と同じ
 * getUnlockedIndices の結果を渡す想定）。新規の永続データは持たず、
 * 既存の correct/wrong 統計だけから重みを出す。
 *
 * `seenInLap` を渡すと、1周（lap）の中で既に出した単語は次の抽選候補から
 * 除外する（1周し切るまで同じ単語を重複させないため）。
 */
export function pickFlashIndex(
  candidates: number[],
  stats: WordStat[],
  avoidIndex: number | null,
  seenInLap?: ReadonlySet<number>,
): number | null {
  let pool = candidates;
  if (seenInLap && seenInLap.size > 0 && seenInLap.size < pool.length) {
    pool = pool.filter((i) => !seenInLap.has(i));
  }
  if (avoidIndex !== null && pool.length > 1) {
    pool = pool.filter((i) => i !== avoidIndex);
  }
  return weightedPickIndex(pool, (i) => getFlashWeight(stats[i]));
}
