import { WordStat } from "./types";

function hasProgress(stat: WordStat | undefined): boolean {
  return (stat?.correct ?? 0) > 0 || (stat?.wrong ?? 0) > 0;
}

/**
 * 解放済みの出題プール（VOCAB_ITEMS の添字）を返す。
 *
 * 「難易度順の上位N語」に「既に挑戦した語」を加える。出題順を難易度順へ
 * 並べ替えると、上位N語の中身が以前と変わる。既習語を加えないと、
 * 旧プールで学習中だった難語が突然出題されなくなってしまう
 * （統計は残るが二度と出てこない）ため、和集合にする。
 *
 * N（unlockedPoolSize）の値と意味（解放語数）は変えていないので、
 * 解放ペースと Tier 倍率は従来どおり。
 */
export function getUnlockedIndices(
  orderedIndices: number[],
  unlockedPoolSize: number,
  stats: WordStat[],
): number[] {
  const limit = Math.max(0, Math.min(unlockedPoolSize, orderedIndices.length));

  const unlocked = new Set<number>(orderedIndices.slice(0, limit));
  for (let i = 0; i < stats.length; i += 1) {
    if (hasProgress(stats[i])) unlocked.add(i);
  }

  return [...unlocked];
}
