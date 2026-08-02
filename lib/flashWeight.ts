import { WordStat } from "./types";
import { weightedPickIndex } from "./weightedPick";

function getFlashWeight(stat: WordStat | undefined): number {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  const attempts = correct + wrong;
  if (attempts === 0) return 4; // 未挑戦は最優先で見せる
  if (correct >= 2 && wrong === 0) return 0.3; // 定着済みはほぼ出さない
  return 1.2; // 学習中
}

/**
 * 解放済みプール（tier）内から、未挑戦・定着未熟な単語ほど高頻度で出す重み付き抽選。
 * `candidates` は解放済みの VOCAB_ITEMS 添字（useVocabPool と同じ
 * getUnlockedIndices の結果を渡す想定）。新規の永続データは持たず、
 * 既存の correct/wrong 統計だけから重みを出す。
 */
export function pickFlashIndex(
  candidates: number[],
  stats: WordStat[],
  avoidIndex: number | null,
): number | null {
  const pool =
    avoidIndex !== null && candidates.length > 1
      ? candidates.filter((i) => i !== avoidIndex)
      : candidates;
  return weightedPickIndex(pool, (i) => getFlashWeight(stats[i]));
}
