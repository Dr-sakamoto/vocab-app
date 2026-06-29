import { useState, useCallback } from "react";
import { pickBattleQuestionIndex } from "@/lib/storyBattles";
import { WordStat, Battle } from "@/lib/types";
import { GAME } from "@/lib/constants";

// ─────────────────────────────────────────────────────────────────────────────
// ヘルパー関数群（旧 page.js から移植）
// ─────────────────────────────────────────────────────────────────────────────

function getAttempts(stat?: WordStat) {
  return (stat?.correct ?? 0) + (stat?.wrong ?? 0);
}

function pickRandomIndex(indices: number[]) {
  return indices[Math.floor(Math.random() * indices.length)];
}

function weightedPickIndex(indices: number[], getWeight: (i: number) => number) {
  const weighted = indices.map((i) => ({
    index: i,
    weight: Math.max(0.01, getWeight(i)),
  }));
  const total = weighted.reduce((s, x) => s + x.weight, 0);
  let cursor = Math.random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) return item.index;
  }
  return weighted.at(-1)?.index ?? null;
}

function getQuestionWeight(stat: WordStat | undefined, currentAccuracy: number) {
  const correct = stat?.correct ?? 0;
  const wrong = stat?.wrong ?? 0;
  const attempts = correct + wrong;
  if (attempts === 0) return currentAccuracy < 0.65 ? 0.25 : 1.8;
  const weakness = wrong / (correct + 1);
  const confidenceBoost = correct >= 2 && wrong === 0 ? 0.45 : 1;
  const recoveryBoost = wrong > 0 ? 2.2 + weakness * 3 : 0;
  const stillLearning = Math.max(0, 3 - correct) * 0.35;
  return (1 + recoveryBoost + stillLearning) * confidenceBoost;
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

  const pickNextQuestionIndex = useCallback(
    (
      avoidIndex: number | null,
      seenSet: Set<number>,
      currentSessionAccuracy: number,
      battle: Battle | null,
    ): number | null => {
      if (battle) {
        return pickBattleQuestionIndex({
          stats,
          unlockedPoolSize,
          seenSet,
          avoidIndex: avoidIndex ?? undefined,
          battle,
        });
      }

      const poolLimit = Math.max(1, Math.min(unlockedPoolSize, vocabItemsLength));
      let candidates = Array.from({ length: poolLimit }, (_, i) => i).filter(
        (i) => !seenSet?.has(i),
      );
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
    [stats, unlockedPoolSize, vocabItemsLength],
  );

  return {
    unlockedPoolSize,
    setUnlockedPoolSize,
    lastUnlockCount,
    setLastUnlockCount,
    pickNextQuestionIndex,
  };
}
