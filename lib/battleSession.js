import { evaluateBattlePlay } from "./battleEvaluation.js";
import { CAPTURE_RATES_BY_GRADE, applyCaptureResultToCollection } from "./capture.js";
import {
  canUseMasterBall,
  consumeMasterBall,
  getBattlePlayLimit,
  getOpponentPokemon,
  getPoolUnlockBlocker,
  getTrainerSprite,
  isBattleWon,
  pickNextBattleTrigger,
  resolveBattleDefeat,
  resolveBattleVictory,
  setPendingChallenge,
} from "./storyBattles.js";
import { resolveBattleForProgress } from "./starters.js";

export function getSessionPlayLimit(activeBattle, defaultLimit = 10) {
  return activeBattle ? getBattlePlayLimit(activeBattle) : defaultLimit;
}

export function buildTrainerChallengeAlert(battle) {
  const opponent = getOpponentPokemon(battle, 1, getBattlePlayLimit(battle));
  return {
    title: `${battle.name}が勝負をしかけてきた！`,
    message: battle.preMessage ?? `${battle.location}でバトルが始まる！`,
    image: opponent.sprite,
    trainerSprite: getTrainerSprite(battle),
    duration: 5200,
    battleId: battle.id,
  };
}

export function applyMasterBallCapture(progress, collection, capturePreview) {
  if (!canUseMasterBall(progress) || !capturePreview?.lineId) {
    return { progress, collection, capture: null };
  }

  const capture = {
    caught: true,
    masterBall: true,
    lineId: capturePreview.lineId,
    level: capturePreview.level ?? 1,
    habitat: capturePreview.habitat ?? { id: "master-ball", name: "マスターボール" },
    monsterId: capturePreview.monsterId ?? `master-${capturePreview.lineId}-${Date.now().toString(36)}`,
    captureRate: 1,
    captureRoll: 0,
  };

  return {
    progress: consumeMasterBall(progress),
    collection: applyCaptureResultToCollection(collection, capture),
    capture,
  };
}

export function processBattleEnd({
  progress,
  collection,
  battle,
  score,
  playLimit,
  answers,
  unlockedPoolSize,
  playCount,
  habitat,
  habitatMinPools,
  useMasterBall = false,
}) {
  const won = isBattleWon(score, playLimit, battle);
  let nextProgress = progress;
  let nextCollection = collection;
  const alerts = [];
  const toasts = [];
  let capture = null;

  const evaluation = evaluateBattlePlay({
    answers,
    score,
    playLimit,
    unlockedPoolSize,
    playCount,
    battle,
  });

  if (won) {
    const victory = resolveBattleVictory(progress, battle.id, collection, {
      poolSize: unlockedPoolSize,
    });
    nextProgress = victory.progress;
    nextCollection = victory.collection;
    for (const reward of victory.rewards) {
      toasts.push({
        title: "バトル報酬！",
        message: reward.message,
        image: reward.sprite,
        duration: 1800,
      });
    }

    if (battle.tier === "legendary" || battle.tier === "symbol") {
      if (useMasterBall) {
        nextProgress = consumeMasterBall(nextProgress);
        const lineId = battle.party[0]?.lineId;
        capture = {
          caught: true,
          lineId,
          level: battle.party[0]?.level ?? 30,
          habitat: { id: battle.habitatId ?? "legendary", name: battle.location },
          monsterId: `legend-${battle.id}-${Date.now().toString(36)}`,
          masterBall: true,
        };
        toasts.push({
          title: "マスターボール！",
          message: `${battle.name}を捕まえた！`,
          image: getOpponentPokemon(battle, 1, playLimit).sprite,
          duration: 2000,
        });
      } else {
        const captureRate = CAPTURE_RATES_BY_GRADE[evaluation.grade] ?? 0.1;
        const captureRoll = Math.random();
        const lineId = battle.party[0]?.lineId;
        const level = battle.party[0]?.level ?? 30;
        capture = {
          caught: captureRoll < captureRate,
          captureRate,
          captureRoll,
          lineId,
          level,
          habitat: { id: battle.habitatId ?? "legendary", name: battle.location },
          monsterId: `legend-${battle.id}-${Date.now().toString(36)}`,
        };
        if (!capture.caught) {
          const retry = pickNextBattleTrigger(nextProgress, {
            unlockedPoolSize,
            habitatId: battle.habitatId,
          });
          if (retry?.id === battle.id) {
            nextProgress = setPendingChallenge(nextProgress, battle.id);
            alerts.push(buildTrainerChallengeAlert(resolveBattleForProgress(battle, nextProgress)));
          }
        }
      }
      if (capture?.caught) {
        nextCollection = applyCaptureResultToCollection(nextCollection, capture);
      }
    }
  } else {
    const defeat = resolveBattleDefeat(progress, battle.id, {
      habitatId: habitat?.id ?? null,
      habitatMinPools,
    });
    nextProgress = defeat.progress;
    toasts.push({
      title: "敗北…",
      message: `${battle.name}に負けてしまった。`,
      image: getOpponentPokemon(battle, playLimit, playLimit).sprite,
      duration: 1600,
    });
  }

  return {
    won,
    lost: !won,
    evaluation,
    progress: nextProgress,
    collection: nextCollection,
    capture,
    alerts,
    toasts,
    relocatedHabitatId: won ? null : resolveBattleDefeat(progress, battle.id).relocatedHabitatId,
  };
}

export function processNormalPlayBattleTriggers(progress, { unlockedPoolSize, habitatId, rng = Math.random } = {}) {
  const battle = pickNextBattleTrigger(progress, { unlockedPoolSize, habitatId, rng });
  if (!battle) return { progress, alert: null };
  const resolved = resolveBattleForProgress(battle, progress);
  return {
    progress: setPendingChallenge(progress, battle.id, unlockedPoolSize),
    alert: buildTrainerChallengeAlert(resolved),
  };
}

export function getPoolUnlockStepWithBossGate(score, playLimit, progress, poolSize, {
  perfectStep = 50,
  unlockStep = 30,
  unlockAccuracy = 0.8,
} = {}) {
  const accuracy = playLimit > 0 ? score / playLimit : 0;
  let step = 0;
  if (accuracy >= 1) step = perfectStep;
  else if (accuracy >= unlockAccuracy) step = unlockStep;

  if (step > 0 && getPoolUnlockBlocker(progress, poolSize + step)) {
    step = 0;
  }
  return step;
}
