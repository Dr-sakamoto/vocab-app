import { evaluatePlay } from "./playEvaluation.js";
import { getBattleTierConfig } from "./storyBattles.js";

export function evaluateBattlePlay({
  answers,
  score,
  playLimit,
  unlockedPoolSize,
  playCount = 1,
  battle = null,
}) {
  const base = evaluatePlay({
    answers,
    score,
    playLimit,
    bestStreak: 0,
    unlockedPoolSize,
    playCount,
  });

  const tierConfig = getBattleTierConfig(battle);
  const battleMultiplier = tierConfig.xpMultiplier ?? 1.5;
  const boostedXp = Math.round((base.xp ?? 0) * battleMultiplier);

  return {
    ...base,
    xp: boostedXp,
    battleMultiplier,
    battleTier: battle?.tier ?? "normal",
    trainerName: battle?.name ?? null,
    isBattle: true,
    breakdown: [
      ...base.breakdown,
      {
        label: "⚔️ トレーナー戦ボーナス",
        points: boostedXp - (base.xp ?? 0),
        max: null,
        detail: `×${battleMultiplier}（${tierConfig.label}）`,
      },
    ],
  };
}
