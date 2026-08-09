import { useState, useCallback, useMemo } from "react";
import { WordStat } from "@/lib/types";
import { GAME } from "@/lib/constants";
import { DIFFICULTY_ORDERED_INDICES } from "@/lib/vocab";
import { getUnlockedIndices } from "@/lib/vocabPool";
import { weightedPickIndex } from "@/lib/weightedPick";
import { getQuestionWeight } from "@/lib/questionWeight";

// ─────────────────────────────────────────────────────────────────────────────
// ヘルパー関数群（旧 page.js から移植）
// ─────────────────────────────────────────────────────────────────────────────

function getAttempts(stat?: WordStat) {
  return (stat?.correct ?? 0) + (stat?.wrong ?? 0);
}

function pickRandomIndex(indices: number[]) {
  return indices[Math.floor(Math.random() * indices.length)];
}

interface UseVocabPoolProps {
  stats: WordStat[];
  vocabItemsLength: number;
}

export function useVocabPool({ stats, vocabItemsLength }: UseVocabPoolProps) {
  const [unlockedPoolSize, setUnlockedPoolSize] = useState<number>(() =>
    Math.min(GAME.INITIAL_POOL_SIZE, vocabItemsLength),
  );
  const [lastUnlockCount, setLastUnlockCount] = useState<number>(0);

  const poolLimit = Math.max(1, Math.min(unlockedPoolSize, vocabItemsLength));

  /**
   * 実際に出題対象となる語（VOCAB_ITEMS の添字）。
   *
   * 中身は「難易度順の上位N語 ∪ 挑戦済みの語」なので、語数は解放カウンタ
   * （unlockedPoolSize）とは一致しない。上位N語の外で挑戦した語がある分だけ多い。
   * 出題・フラッシュ・画面表示のすべてがこの1本の配列を見ることで、
   * 「ヘッダーの語数」と「実際のプール」が食い違わないようにする。
   */
  const unlockedIndices = useMemo(
    () => getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, poolLimit, stats),
    [poolLimit, stats],
  );

  /**
   * 解放カウンタを step だけ進め、それによってプールへ実際に加わった語数を
   * lastUnlockCount に記録する。
   *
   * 新たに解放される順位帯に挑戦済みの語が含まれていると、その語はすでに
   * プールに入っているため、実際の増分は step より小さくなる。リザルトの
   * 「新たに◯語がプールに追加された」を実数に合わせる。
   */
  const unlockMore = useCallback(
    (step: number) => {
      if (step <= 0) {
        setLastUnlockCount(0);
        return;
      }
      const nextPoolSize = Math.min(unlockedPoolSize + step, vocabItemsLength);
      const nextIndices = getUnlockedIndices(
        DIFFICULTY_ORDERED_INDICES,
        Math.max(1, Math.min(nextPoolSize, vocabItemsLength)),
        stats,
      );
      setUnlockedPoolSize(nextPoolSize);
      setLastUnlockCount(nextIndices.length - unlockedIndices.length);
    },
    [stats, unlockedIndices, unlockedPoolSize, vocabItemsLength],
  );

  const pickNextQuestionIndex = useCallback(
    (
      avoidIndex: number | null,
      seenSet: Set<number>,
      currentSessionAccuracy: number,
    ): number | null => {
      let candidates = unlockedIndices.filter((i) => !seenSet?.has(i));
      if (typeof avoidIndex === "number" && candidates.length > 1) {
        candidates = candidates.filter((i) => i !== avoidIndex);
      }
      if (candidates.length === 0) return null;

      const fresh = candidates.filter((i) => getAttempts(stats[i]) === 0);
      const practiced = candidates.filter((i) => getAttempts(stats[i]) > 0);
      const tryFresh =
        fresh.length > 0 &&
        (practiced.length === 0 ||
          (currentSessionAccuracy >= 0.7 && Math.random() < 0.28));

      return tryFresh
        ? pickRandomIndex(fresh)
        : weightedPickIndex(candidates, (i) =>
            getQuestionWeight(stats[i], currentSessionAccuracy),
          );
    },
    [stats, unlockedIndices],
  );

  return {
    unlockedPoolSize,
    setUnlockedPoolSize,
    unlockedIndices,
    unlockMore,
    lastUnlockCount,
    setLastUnlockCount,
    pickNextQuestionIndex,
  };
}
