"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AuroraBackground from "./components/AuroraBackground";
import BattleBanner from "./components/BattleBanner";
import CompactBattleBar from "./components/CompactBattleBar";
import FossilChoiceModal from "./components/FossilChoiceModal";
import StarterChoiceModal from "./components/StarterChoiceModal";
import PokemonBox from "./components/PokemonBox";
import PokemonParty from "./components/PokemonParty";
import ProgressDashboard from "./components/ProgressDashboard";
import ResultScreen from "./components/ResultScreen";
import ToastQueue from "./components/ToastQueue";
import TrainerChallengeAlert from "./components/TrainerChallengeAlert";
import SyncButton from "./components/SyncButton";
import {
  useGameSession,
} from "./hooks/useGameSession";
import {
  useVocabPool,
} from "./hooks/useVocabPool";
import {
  useKeyboardShortcuts,
} from "./hooks/useKeyboardShortcuts";

import {
  applyCaptureResultToCollection,
  getHabitatMinPoolMap,
  pickHabitat,
  rollCaptureEncounter,
} from "@/lib/capture";
import {
  applyMasterBallCapture,
  getPoolUnlockStepWithBossGate,
  getSessionPlayLimit,
  processBattleEnd,
  processNormalPlayBattleTriggers,
} from "@/lib/battleSession";
import { evaluatePlay } from "@/lib/playEvaluation";
import {
  canUseMasterBall,
  DEFAULT_STORY_PROGRESS,
  getBattleForProgress,
  getBattleProgressAccuracy,
  getBattleResultMessage,
  getOpponentPokemon,
  getResumeBattle,
  getStartScreenBattle,
  getTrainerSprite,
  markMewWordSeen,
  normalizeStoryProgress,
  startBattleSession,
  syncRetroactiveBattles,
} from "@/lib/storyBattles";
import { normalizeAnswer } from "@/lib/answerNormalization";
import {
  applyStarterChoice,
  awardMissingProfessorStarters,
  migrateStarterState,
  needsStarterChoice,
} from "@/lib/starters";
import {
  clampMonsterXP,
  DEFAULT_MONSTER_COLLECTION,
  BOX_LIMIT,
  getActiveMonster,
  awardEligibleGiftMonsters,
  claimFossilGift,
  getBoxCount,
  getGiftToastTitle,
  getPendingFossilGift,
  getPoolTier,
  getMonsterDisplayState,
  getMonsterLine,
  getSpecies,
  levelFromTotalXP,
  normalizeMonsterCollection,
  normalizeMonsterLineId,
  sendPartySlotToBox,
  sendMonstersToProfessor,
  setActiveMonster,
  sortBoxMonsters,
  swapMonsterLocations,
  updatePartyXP,
  getLevelUpGrowth,
} from "@/lib/monster";
import { getTierTheme } from "@/lib/tierTheme";
import { QUESTIONS } from "@/lib/vocab";
import { GAME, STORAGE_KEYS } from "@/lib/constants";
import {
  GameView,
  WordStat,
  Battle,
  MonsterCollection,
  PlayEvaluation,
  SessionAnswer,
  StoryProgress,
  ToastItem,
  TrainerChallenge,
  VocabItem,
} from "@/lib/types";
import storage from "@/lib/storage";

const APPROVED_ANSWERS_KEY = "vocab-approved-answers";

/** 各問題に安定した ID */
const VOCAB_ITEMS: VocabItem[] = QUESTIONS.map((q, i) => ({
  ...q,
  id: `w${i}`,
}));

type HabitatSummary = {
  id: string;
  name: string;
  minPool?: number;
};

type CaptureResult = {
  caught?: boolean;
  captureRate?: number | null;
  captureRoll?: number | null;
  habitat?: HabitatSummary;
  lineId?: string;
  encounterWeight?: number;
  level?: number;
  speciesId?: number;
  monsterId?: string;
  reason?: string;
  masterBall?: boolean;
  itemPickup?: unknown;
};

type ResultEvaluation = PlayEvaluation & {
  captureFailed?: boolean;
  capturePreview?: CaptureResult | null;
};

type CompletedBattleResult = {
  battle: Battle;
  won: boolean;
  lost: boolean;
  capture?: CaptureResult | null;
  trainerSprite?: string;
  opponentSprite?: string;
  resultMessage: string;
};

type GiftGroup = {
  id?: string;
  title?: string;
  message?: string;
};

type BoxSortMode = "dex" | "level";

type BattleEndResult = {
  evaluation: ResultEvaluation;
  progress: StoryProgress;
  collection: MonsterCollection;
  capture: CaptureResult | null;
  won: boolean;
  lost: boolean;
  toasts: ToastItem[];
  alerts: TrainerChallenge[];
  relocatedHabitatId?: string | null;
};

const normalizeStoryProgressForPage = normalizeStoryProgress as (
  progress: unknown,
) => StoryProgress;
const syncRetroactiveBattlesForPage = syncRetroactiveBattles as (
  progress: StoryProgress,
  options: { unlockedPoolSize: number },
) => StoryProgress;
const startBattleSessionForPage = startBattleSession as (
  progress: StoryProgress,
  battleId: string,
) => StoryProgress;
const processBattleEndForPage = processBattleEnd as unknown as (
  args: Record<string, unknown>,
) => BattleEndResult;
const processNormalPlayBattleTriggersForPage = processNormalPlayBattleTriggers as (
  progress: StoryProgress,
  options: { unlockedPoolSize: number; habitatId: string | null },
) => { progress: StoryProgress; alert?: TrainerChallenge | null };
const getBattleResultMessageForPage = getBattleResultMessage as (
  battle: Battle,
  won: boolean,
  capture?: CaptureResult | null,
) => string;
const pickHabitatForPage = pickHabitat as unknown as (
  args: Record<string, unknown>,
) => HabitatSummary | null;
const rollCaptureEncounterForPage = rollCaptureEncounter as unknown as (
  args: Record<string, unknown>,
) => CaptureResult | null;
const applyCaptureResultToCollectionForPage = applyCaptureResultToCollection as (
  collection: MonsterCollection,
  result: CaptureResult | null,
) => MonsterCollection;
const applyMasterBallCaptureForPage = applyMasterBallCapture as (
  progress: StoryProgress,
  collection: MonsterCollection,
  preview: CaptureResult,
) => {
  progress: StoryProgress;
  collection: MonsterCollection;
  capture: CaptureResult | null;
};
const applyStarterChoiceForPage = applyStarterChoice as (
  collection: MonsterCollection,
  progress: StoryProgress,
  lineId: string,
) => { collection: MonsterCollection; progress: StoryProgress };
const markMewWordSeenForPage = markMewWordSeen as (
  progress: StoryProgress,
  index: number,
  totalWords: number,
) => StoryProgress;

function getPartOfSpeech(q: VocabItem | undefined): string {
  return q?.partOfSpeech ?? "word";
}

export default function Page() {
  const [activeView, setActiveView] = useState<GameView>("start");
  const [stats, setStats] = useState<WordStat[]>(() =>
    VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })),
  );

  const didLoadFromStorageRef = useRef<boolean>(false);

  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>([]);
  const [resultEvaluation, setResultEvaluation] = useState<ResultEvaluation | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [currentHabitat, setCurrentHabitat] = useState<HabitatSummary | null>(null);
  const [flowPlayCount, setFlowPlayCount] = useState<number>(1);
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const [fossilChoice, setFossilChoice] = useState<GiftGroup | null>(null);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(() =>
    normalizeStoryProgressForPage(DEFAULT_STORY_PROGRESS),
  );
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [trainerChallenge, setTrainerChallenge] = useState<TrainerChallenge | null>(null);
  const [pendingStarterBattleId, setPendingStarterBattleId] = useState<string | null>(null);
  const [battleOutcome, setBattleOutcome] = useState<"won" | "lost" | null>(null);
  const [completedBattleResult, setCompletedBattleResult] =
    useState<CompletedBattleResult | null>(null);
  const [useMasterBallThisBattle, setUseMasterBallThisBattle] = useState<boolean>(false);

  const [index, setIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenInPlayRef = useRef<Set<number> | null>(null);
  if (seenInPlayRef.current === null) {
    seenInPlayRef.current = new Set<number>([index]);
  }

  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [dashboardReturnView, setDashboardReturnView] = useState<GameView>("study");

  const [monsterCollection, setMonsterCollection] = useState<MonsterCollection>(() =>
    normalizeMonsterCollection(DEFAULT_MONSTER_COLLECTION),
  );
  const [isPokemonBoxOpen, setIsPokemonBoxOpen] = useState<boolean>(false);
  const savedCollectionExistsRef = useRef<boolean>(false);

  const [approvedAnswers, setApprovedAnswers] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem(APPROVED_ANSWERS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [isRequestingReview, setIsRequestingReview] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<{ approved: boolean; score: number; feedback?: string } | null>(null);

  const resultUnlockAppliedRef = useRef<boolean>(false);

  const q = VOCAB_ITEMS[index];
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);
  const levelUpSoundRef = useRef<HTMLAudioElement | null>(null);
  const evolutionSoundRef = useRef<HTMLAudioElement | null>(null);
  const monsterCollectionRef = useRef<MonsterCollection>(monsterCollection);
  const storyProgressRef = useRef<StoryProgress>(storyProgress);
  const activeBattleRef = useRef<Battle | null>(activeBattle);
  const currentHabitatRef = useRef<HabitatSummary | null>(null);

  const {
    unlockedPoolSize,
    setUnlockedPoolSize,
    lastUnlockCount,
    setLastUnlockCount,
    pickNextQuestionIndex,
  } = useVocabPool({ stats, vocabItemsLength: VOCAB_ITEMS.length });

  const sessionPlayLimit = getSessionPlayLimit(activeBattle, GAME.PLAY_LIMIT);
  const activeMonster = getActiveMonster(monsterCollection);
  const boxCount = getBoxCount(monsterCollection);
  const isBoxOverLimit = boxCount > BOX_LIMIT;
  const habitatMinPools = useMemo(() => getHabitatMinPoolMap(), []);

  const {
    score,
    setScore,
    total,
    setTotal,
    streak,
    setStreak,
    bestStreak,
    setBestStreak,
    sessionAnswers: gameSessionAnswers,
    setSessionAnswers: setGameSessionAnswers,
    input,
    setInput,
    checked,
    setChecked,
    isCorrect,
    setIsCorrect,
    answerStatus,
    setAnswerStatus,
    isCheckingAnswer,
    checkAnswer,
    resetSession,
    prepareNextQuestion,
    normalizedAnswers,
    posViolation,
    setPosViolation,
  } = useGameSession({ q, index, activeView, stats, setStats, approvedAnswers });

  const answeredCount = checked ? total : total - 1;
  const currentSessionAccuracy = answeredCount <= 0 ? 1 : score / answeredCount;
  const currentBattleAccuracy = getBattleProgressAccuracy(score, sessionPlayLimit);

  const enqueueToast = useCallback((toast: ToastItem) => {
    setToastQueue((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        duration: 800,
        ...toast,
      },
    ]);
  }, []);

  useEffect(() => {
    if (activeToast || toastQueue.length === 0) return;
    setActiveToast(toastQueue[0]);
    setToastQueue((prev) => prev.slice(1));
  }, [activeToast, toastQueue]);

  const dismissActiveToast = useCallback(() => setActiveToast(null), []);

  const buildPartyChangeToasts = (
    previousCollection: MonsterCollection,
    nextCollection: MonsterCollection,
  ): ToastItem[] => {
    const prev = normalizeMonsterCollection(previousCollection);
    const next = normalizeMonsterCollection(nextCollection);
    const activeId = next.activeId;
    const partyIds = next.partyIds.filter(Boolean) as string[];
    const orderedIds = [...new Set([activeId, ...partyIds])].filter(Boolean) as string[];

    const events: ToastItem[] = [];
    for (const monsterId of orderedIds) {
      const prevMonster = prev.monsters.find((mon) => mon.id === monsterId);
      const nextMonster = next.monsters.find((mon) => mon.id === monsterId);
      if (!prevMonster || !nextMonster) continue;

      const prevState = getMonsterDisplayState(prevMonster);
      const nextState = getMonsterDisplayState(nextMonster);
      const isActive = monsterId === activeId;

      if (!prevMonster.heldItemType && nextMonster.heldItemType) {
        events.push({
          title: "アイテムをひろった！",
          message: `${nextState.species.name}が${nextMonster.heldItemName}をひろった！`,
          image: nextState.species.sprite,
          isActive,
        });
      }
      if (nextState.level > prevState.level) {
        const growths = getLevelUpGrowth(prevState.level, nextState.level);
        const growthSummary = growths
          .filter((g) => g.bonus > 0)
          .map((g) => `${g.statName}+${g.bonus}`)
          .join(" ");
        events.push({
          title: "レベルアップ",
          message: `${nextState.species.name}のレベルがあがった！`,
          image: nextState.species.sprite,
          detail: `Lv.${prevState.level} → Lv.${nextState.level}  ${growthSummary}`,
          isActive,
        });
      }
      if (nextState.species.id !== prevState.species.id) {
        events.push({
          title: "進化！",
          message: `${nextState.species.name}に進化した！`,
          image: nextState.species.sprite,
          detail: `${prevState.species.name} → ${nextState.species.name}`,
          isActive,
        });
      }
    }
    return events;
  };

  const enqueueGiftToasts = useCallback(
    (awarded: any[] = []) => {
      awarded.forEach((gift) => {
        enqueueToast({
          title: getGiftToastTitle(gift),
          message: gift.message,
          image: gift.sprite,
          duration: 1600,
        });
      });
    },
    [enqueueToast],
  );

  const syncGiftProgress = useCallback(
    (collection: MonsterCollection, poolSize: number, { showToasts = false } = {}) => {
      const poolResult = awardEligibleGiftMonsters(collection, {
        unlockedPoolSize: poolSize,
        trigger: "pool",
        habitatMinPools,
      });
      const professorResult = awardEligibleGiftMonsters(poolResult.collection, {
        unlockedPoolSize: poolSize,
        trigger: "professor-transfer",
        habitatMinPools,
      });
      const nextCollection = professorResult.collection;
      const awarded = [...poolResult.awarded, ...professorResult.awarded];
      const pendingFossil = getPendingFossilGift(nextCollection, {
        unlockedPoolSize: poolSize,
        habitatMinPools,
      });

      if (showToasts) enqueueGiftToasts(awarded);
      if (pendingFossil) setFossilChoice(pendingFossil);

      return { collection: nextCollection, awarded, pendingFossil };
    },
    [enqueueGiftToasts, habitatMinPools],
  );

  const handleFossilChoice = useCallback(
    (lineId: string) => {
      const { collection: nextCollection, awarded } = claimFossilGift(
        monsterCollectionRef.current,
        lineId,
        { habitatMinPools },
      );
      if (!awarded) return;
      monsterCollectionRef.current = nextCollection;
      setMonsterCollection(nextCollection);
      setFossilChoice(null);
      enqueueGiftToasts([awarded]);
    },
    [enqueueGiftToasts, habitatMinPools],
  );

  const playEvaluation = useMemo(
    () =>
      evaluatePlay({
        answers: gameSessionAnswers,
        score,
        playLimit: GAME.PLAY_LIMIT,
        bestStreak,
        unlockedPoolSize,
        playCount: flowPlayCount,
      }),
    [bestStreak, flowPlayCount, score, gameSessionAnswers, unlockedPoolSize],
  );

  const selectNextHabitat = useCallback(
    (poolSize = unlockedPoolSize, collection = monsterCollectionRef.current) => {
      const habitat = pickHabitatForPage({
        unlockedPoolSize: poolSize,
        habitatVisits: collection?.habitatVisits ?? {},
        rng: Math.random,
      });
      currentHabitatRef.current = habitat;
      setCurrentHabitat(habitat);
      return habitat;
    },
    [unlockedPoolSize],
  );

  // ── 音声 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    correctSoundRef.current = new Audio("/success.mp3");
    correctSoundRef.current.volume = 0.4;
    correctSoundRef.current.preload = "auto";

    levelUpSoundRef.current = new Audio("/levelup.mp3");
    levelUpSoundRef.current.volume = 0.5;
    levelUpSoundRef.current.preload = "auto";

    evolutionSoundRef.current = new Audio("/pokemon-evolve.mp3");
    evolutionSoundRef.current.volume = 0.5;
    evolutionSoundRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!checked || !isCorrect || !correctSoundRef.current) return;
    correctSoundRef.current.currentTime = 0;
    const playPromise = correctSoundRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.debug("Sound play error (ignoring):", error);
      });
    }
  }, [checked, isCorrect]);

  useEffect(() => {
    monsterCollectionRef.current = monsterCollection;
  }, [monsterCollection]);

  useEffect(() => {
    storyProgressRef.current = storyProgress;
  }, [storyProgress]);

  useEffect(() => {
    activeBattleRef.current = activeBattle;
  }, [activeBattle]);

  const persistProgress = useCallback(
    ({
      nextStats = stats,
      nextPoolSize = unlockedPoolSize,
      nextCollection = monsterCollectionRef.current,
      nextStory = storyProgressRef.current,
    } = {}) => {
      if (!didLoadFromStorageRef.current) return;
      try {
        const active = getActiveMonster(nextCollection);
        const collectionPayload = {
          ...normalizeMonsterCollection(nextCollection),
          storyProgress: normalizeStoryProgressForPage(nextStory),
        };
        
        storage.set(
          STORAGE_KEYS.PROGRESS,
          VOCAB_ITEMS.map((v, i) => ({
            id: v.id,
            target: v.target,
            correct: nextStats[i]?.correct ?? 0,
            wrong: nextStats[i]?.wrong ?? 0,
          })),
        );
        storage.set(STORAGE_KEYS.POOL_SIZE, nextPoolSize);
        storage.set(STORAGE_KEYS.MONSTER_COLLECTION, collectionPayload);
        storage.set(STORAGE_KEYS.STORY_PROGRESS, normalizeStoryProgressForPage(nextStory));
        storage.set(STORAGE_KEYS.MONSTER_XP, active.totalXP);
        storage.setString(STORAGE_KEYS.MONSTER_LINE_ID, active.lineId);
      } catch {
        /* ignore */
      }
    },
    [stats, unlockedPoolSize],
  );

  const startScreenBattle = useMemo(
    () => getStartScreenBattle(storyProgress),
    [storyProgress],
  );

  useEffect(() => {
    if (activeView !== "study" || isCheckingAnswer) return;
    inputRef.current?.focus();
  }, [activeView, checked, index, isCheckingAnswer]);

  // ── localStorage 復元 ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      // プールサイズ
      let loadedPoolSize = Math.min(GAME.INITIAL_POOL_SIZE, VOCAB_ITEMS.length);
      const savedPool = Number(storage.get(STORAGE_KEYS.POOL_SIZE, null));
      if (Number.isFinite(savedPool) && savedPool > 0) {
        loadedPoolSize = Math.max(
          Math.min(GAME.INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
          Math.min(Math.floor(savedPool), VOCAB_ITEMS.length),
        );
        setUnlockedPoolSize(loadedPoolSize);
      }

      // モンスター XP
      const savedXP = clampMonsterXP(storage.get(STORAGE_KEYS.MONSTER_XP, null));
      const savedMonsterLineId = storage.getString(STORAGE_KEYS.MONSTER_LINE_ID, "");
      const rawCollection = storage.get(STORAGE_KEYS.MONSTER_COLLECTION, null);
      savedCollectionExistsRef.current = rawCollection !== null;
      const normalizedCollection = normalizeMonsterCollection(rawCollection, {
        lineId: normalizeMonsterLineId(savedMonsterLineId),
        totalXP: savedXP,
      });
      const rawStory = storage.get(STORAGE_KEYS.STORY_PROGRESS, null);
      const loadedStory = normalizeStoryProgressForPage(
        rawStory
          ? rawStory
          : normalizedCollection.storyProgress ?? DEFAULT_STORY_PROGRESS,
      );
      const syncedGifts = syncGiftProgress(normalizedCollection, loadedPoolSize);
      const migratedStarters = migrateStarterState(
        syncedGifts.collection,
        loadedStory,
      );
      const retroStory = syncRetroactiveBattlesForPage(migratedStarters.progress, {
        unlockedPoolSize: loadedPoolSize,
      });
      monsterCollectionRef.current = migratedStarters.collection;
      setMonsterCollection(migratedStarters.collection);
      storyProgressRef.current = retroStory;
      setStoryProgress(retroStory);

      const resumeBattle = getResumeBattle(retroStory);
      if (resumeBattle) {
        setActiveBattle(resumeBattle);
        activeBattleRef.current = resumeBattle;
      }
      const loadedHabitat = pickHabitatForPage({
        unlockedPoolSize: loadedPoolSize,
        habitatVisits: syncedGifts.collection.habitatVisits,
        rng: Math.random,
      });
      currentHabitatRef.current = loadedHabitat;
      setCurrentHabitat(loadedHabitat);

      // 単語進捗
      const parsed = storage.get<any[] | null>(STORAGE_KEYS.PROGRESS, null);
      if (!parsed || !Array.isArray(parsed)) {
        didLoadFromStorageRef.current = true;
        return;
      }

      const map = new Map();
      for (const item of parsed) {
        if (!item || typeof item !== "object") continue;
        const correct = Number(item.correct);
        const wrong = Number(item.wrong);
        const safe = {
          correct: Number.isFinite(correct) && correct >= 0 ? correct : 0,
          wrong: Number.isFinite(wrong) && wrong >= 0 ? wrong : 0,
        };
        if (typeof item.id === "string") {
          map.set(item.id, safe);
          continue;
        }
        const idx = VOCAB_ITEMS.findIndex((v) => v.target === item.target);
        if (idx >= 0) map.set(VOCAB_ITEMS[idx].id, safe);
      }

      setStats((prev) =>
        VOCAB_ITEMS.map((v, i) => {
          const saved = map.get(v.id);
          return saved
            ? { correct: saved.correct, wrong: saved.wrong }
            : prev[i] ?? { correct: 0, wrong: 0 };
        }),
      );
    } catch {
      /* ignore */
    } finally {
      didLoadFromStorageRef.current = true;
    }
  }, [syncGiftProgress, setUnlockedPoolSize]);

  // ── localStorage 保存 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    storage.set(
      STORAGE_KEYS.PROGRESS,
      VOCAB_ITEMS.map((v, i) => ({
        id: v.id,
        target: v.target,
        correct: stats[i]?.correct ?? 0,
        wrong: stats[i]?.wrong ?? 0,
      })),
    );
  }, [stats]);

  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    storage.set(STORAGE_KEYS.POOL_SIZE, unlockedPoolSize);
  }, [unlockedPoolSize]);

  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    persistProgress({
      nextCollection: monsterCollection,
      nextStory: storyProgress,
    });
  }, [monsterCollection, persistProgress, storyProgress]);

  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    if (pendingStarterBattleId || activeBattle) return;
    if (savedCollectionExistsRef.current) return;
    const normalized = normalizeMonsterCollection(monsterCollection);
    if (
      normalized.monsters.length === 0 &&
      needsStarterChoice(storyProgress)
    ) {
      setPendingStarterBattleId("rival-1");
    }
  }, [storyProgress, activeBattle, pendingStarterBattleId, monsterCollection]);

  // ── 出題 ──────────────────────────────────────────────────────────────────
  const progress = `${total} / ${sessionPlayLimit}`;
  const progressPct = Math.max(
    0,
    Math.min(100, (total / sessionPlayLimit) * 100),
  );

  useEffect(() => {
    if (activeView !== "study" || !q) return;
    setStoryProgress((prev) => {
      const next = markMewWordSeenForPage(prev, index, VOCAB_ITEMS.length);
      storyProgressRef.current = next;
      return next;
    });
  }, [activeView, index, q]);

  // ── プレイ終了処理（プール解放 + XP 付与）────────────────────────────────
  const applyEndOfPlay = useCallback(
    (
      finalScore: number,
      finalBestStreak: number,
      currentPoolSize: number,
      finalAnswers: SessionAnswer[],
      finalHabitat: HabitatSummary | null,
      playCount: number,
    ) => {
      if (resultUnlockAppliedRef.current) return;
      resultUnlockAppliedRef.current = true;

      const battle = activeBattleRef.current;
      const playLimit = getSessionPlayLimit(battle, GAME.PLAY_LIMIT);
      const currentCollection = monsterCollectionRef.current;
      let nextStory = storyProgressRef.current;
      let nextCollection = currentCollection;
      let capture: CaptureResult | null = null;
      let finalEvaluation: ResultEvaluation;

      if (battle) {
        const battleResult = processBattleEndForPage({
          progress: nextStory,
          collection: currentCollection,
          battle,
          score: finalScore,
          playLimit,
          answers: finalAnswers,
          unlockedPoolSize: currentPoolSize,
          playCount,
          habitat: finalHabitat,
          habitatMinPools,
          useMasterBall: useMasterBallThisBattle,
        });
        finalEvaluation = battleResult.evaluation;
        nextStory = battleResult.progress;
        nextCollection = battleResult.collection;
        capture = battleResult.capture;
        setBattleOutcome(battleResult.won ? "won" : "lost");
        setCompletedBattleResult({
          battle,
          won: battleResult.won,
          lost: battleResult.lost,
          capture: battleResult.capture,
          trainerSprite: getTrainerSprite(battle) ?? undefined,
          opponentSprite: getOpponentPokemon(battle, playLimit, playLimit)
            .sprite,
          resultMessage: getBattleResultMessageForPage(
            battle,
            battleResult.won,
            battleResult.capture,
          ),
        });
        setUseMasterBallThisBattle(false);
        setActiveBattle(null);
        activeBattleRef.current = null;

        battleResult.toasts.forEach((toast: any) => enqueueToast(toast));
        if (battleResult.alerts[0]) setTrainerChallenge(battleResult.alerts[0]);

        if (battleResult.relocatedHabitatId) {
          const relocated = {
            id: battleResult.relocatedHabitatId,
            name: battleResult.relocatedHabitatId,
          };
          currentHabitatRef.current = relocated;
          setCurrentHabitat(relocated);
        }

        setResultEvaluation(finalEvaluation);
        setLastUnlockCount(0);
        setCaptureResult(capture);

        const gained = finalEvaluation.xp ?? 0;
        const leveledCollection = updatePartyXP(nextCollection, gained);
        nextCollection = leveledCollection;
        monsterCollectionRef.current = nextCollection;
        setMonsterCollection(nextCollection);
        setStoryProgress(nextStory);
        storyProgressRef.current = nextStory;

        const partyToasts = buildPartyChangeToasts(
          currentCollection,
          nextCollection,
        );
        partyToasts.forEach((toast) => enqueueToast(toast));

        if (capture?.caught) {
          const capturedLine = getMonsterLine(capture.lineId);
          if (capturedLine) {
            enqueueToast({
              title: "ポケモン捕獲！",
              message: `${capturedLine.name}を捕まえた！`,
              image: capturedLine.sprite,
            });
          }
        }

        persistProgress({
          nextCollection,
          nextStory,
          nextPoolSize: currentPoolSize,
        });
        return;
      }

      finalEvaluation = evaluatePlay({
        answers: finalAnswers,
        score: finalScore,
        playLimit,
        bestStreak: finalBestStreak,
        unlockedPoolSize: currentPoolSize,
        playCount,
      });
      setResultEvaluation(finalEvaluation);
      setBattleOutcome(null);
      setCompletedBattleResult(null);

      const step = getPoolUnlockStepWithBossGate(
        finalScore,
        playLimit,
        nextStory,
        currentPoolSize,
        {
          perfectStep: GAME.PERFECT_UNLOCK_STEP,
          unlockStep: GAME.UNLOCK_STEP,
          unlockAccuracy: GAME.UNLOCK_ACCURACY,
        },
      );
      const nextPoolSize =
        step > 0
          ? Math.min(currentPoolSize + step, VOCAB_ITEMS.length)
          : currentPoolSize;
      if (step > 0) {
        setUnlockedPoolSize((prev) => {
          const next = Math.min(prev + step, VOCAB_ITEMS.length);
          setLastUnlockCount(next - prev);
          return next;
        });
      } else {
        setLastUnlockCount(0);
      }

      const gained = finalEvaluation.xp ?? 0;
      const currentMonster = getActiveMonster(currentCollection);
      let didLevelUp = false;
      let didEvolve = false;
      let leveledCollection = currentCollection;
      if (currentMonster) {
        const previousXP = currentMonster.totalXP;
        const previousLevel = levelFromTotalXP(previousXP);
        const nextLevel = levelFromTotalXP(
          clampMonsterXP(previousXP + gained),
        );
        didLevelUp = nextLevel > previousLevel;
        didEvolve =
          getSpecies(previousLevel, currentMonster.lineId).id !==
          getSpecies(nextLevel, currentMonster.lineId).id;
        leveledCollection = updatePartyXP(currentCollection, gained);
      }

      capture = rollCaptureEncounterForPage({
        grade: finalEvaluation.grade,
        unlockedPoolSize: currentPoolSize,
        habitatVisits: leveledCollection.habitatVisits,
        seed: `${Date.now()}-${Math.random()}`,
        habitat: finalHabitat,
        monsterCollection: leveledCollection,
      });
      if (capture?.lineId && !capture.caught) {
        finalEvaluation = {
          ...finalEvaluation,
          captureFailed: true,
          capturePreview: capture,
        };
        setResultEvaluation(finalEvaluation);
      }
      nextCollection = applyCaptureResultToCollectionForPage(
        leveledCollection,
        capture,
      );
      const giftSync = syncGiftProgress(nextCollection, nextPoolSize, {
        showToasts: false,
      });
      nextCollection = giftSync.collection;
      setCaptureResult(capture);
      monsterCollectionRef.current = nextCollection;
      setMonsterCollection(nextCollection);

      const trigger = processNormalPlayBattleTriggersForPage(nextStory, {
        unlockedPoolSize: nextPoolSize,
        habitatId: finalHabitat?.id ?? null,
      });
      nextStory = trigger.progress;
      setStoryProgress(nextStory);
      storyProgressRef.current = nextStory;
      if (trigger.alert) setTrainerChallenge(trigger.alert);

      if (capture?.caught) {
        const capturedLine = getMonsterLine(capture.lineId);
        if (capturedLine) {
          enqueueToast({
            title: "ポケモン捕獲！",
            message: `${capturedLine.name}を捕まえた！`,
            image: capturedLine.sprite,
          });
        }
      }

      const partyToasts = buildPartyChangeToasts(
        currentCollection,
        nextCollection,
      );
      partyToasts.forEach((toast) => enqueueToast(toast));
      enqueueGiftToasts(giftSync.awarded);

      if (didEvolve && evolutionSoundRef.current) {
        evolutionSoundRef.current.currentTime = 0;
        const playPromise = evolutionSoundRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.debug("Evolution sound play error (ignoring):", error);
          });
        }
      } else if (didLevelUp && levelUpSoundRef.current) {
        levelUpSoundRef.current.currentTime = 0;
        const playPromise = levelUpSoundRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.debug("Level up sound play error (ignoring):", error);
          });
        }
      }

      persistProgress({
        nextCollection,
        nextStory,
        nextPoolSize,
      });
    },
    [
      enqueueGiftToasts,
      habitatMinPools,
      persistProgress,
      syncGiftProgress,
      useMasterBallThisBattle,
      setUnlockedPoolSize,
      setLastUnlockCount,
    ],
  );

  // ── 次へ ───────────────────────────────────────────────────────────────────
  const next = () => {
    if (!checked || activeView === "result") return;

    if (total >= sessionPlayLimit) {
      applyEndOfPlay(
        score,
        bestStreak,
        unlockedPoolSize,
        sessionAnswers,
        currentHabitatRef.current,
        flowPlayCount,
      );
      setActiveView("result");
      return;
    }

    setTotal((t) => t + 1);
    const seenInPlay = seenInPlayRef.current ?? new Set<number>([index]);
    seenInPlayRef.current = seenInPlay;
    const nextIndex = pickNextQuestionIndex(
      index,
      seenInPlay,
      currentSessionAccuracy,
      activeBattleRef.current,
    );
    if (nextIndex === null) {
      applyEndOfPlay(
        score,
        bestStreak,
        unlockedPoolSize,
        sessionAnswers,
        currentHabitatRef.current,
        flowPlayCount,
      );
      setActiveView("result");
      return;
    }
    seenInPlay.add(nextIndex);
    setIndex(nextIndex);
    prepareNextQuestion();
    setReviewResult(null);
  };

  const openDashboard = useCallback((returnView: GameView = "study") => {
    setDashboardReturnView(returnView);
    setActiveView("dashboard");
  }, []);

  const addApprovedAnswer = useCallback((wordId: string, normalizedAnswer: string) => {
    setApprovedAnswers((prev) => {
      const existing = prev[wordId] ?? [];
      if (existing.includes(normalizedAnswer)) return prev;
      const next = { ...prev, [wordId]: [...existing, normalizedAnswer] };
      try { localStorage.setItem(APPROVED_ANSWERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleAiApproval = useCallback(() => {
    if (!q) return;
    addApprovedAnswer(q.id, normalizeAnswer(input));
    setIsCorrect(true);
    setAnswerStatus("ai_approved");
    setScore((s) => s + 1);
    setStreak((st) => {
      const ns = st + 1;
      setBestStreak((b) => Math.max(b, ns));
      return ns;
    });
    setGameSessionAnswers((a) =>
      a.map((ans) => (ans.id === q.id ? { ...ans, correct: true } : ans)),
    );
    setStats((prev) => {
      const next = [...prev];
      const cur = next[index] ?? { correct: 0, wrong: 0 };
      next[index] = { correct: cur.correct + 1, wrong: Math.max(0, cur.wrong - 1) };
      return next;
    });
  }, [q, input, index, addApprovedAnswer, setIsCorrect, setAnswerStatus, setScore, setStreak, setBestStreak, setGameSessionAnswers, setStats]);

  const requestAiReview = useCallback(async () => {
    if (isRequestingReview || !q) return;
    setIsRequestingReview(true);
    try {
      const response = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, target: q.target }),
      });
      if (response.ok) {
        const result = await response.json();
        setReviewResult(result);
        if (result.approved) handleAiApproval();
      } else {
        setReviewResult({ approved: false, score: 0, feedback: "審議に失敗しました" });
      }
    } catch {
      setReviewResult({ approved: false, score: 0, feedback: "通信エラー" });
    } finally {
      setIsRequestingReview(false);
    }
  }, [isRequestingReview, q, input, handleAiApproval]);

  const handleSyncMerged = useCallback(
    (merged: { stats: WordStat[]; unlockedPoolSize: number; monsterCollection: MonsterCollection; approvedAnswers?: Record<string, string[]> }) => {
      setStats(merged.stats);
      setUnlockedPoolSize(merged.unlockedPoolSize);
      setMonsterCollection(merged.monsterCollection);
      if (merged.approvedAnswers) setApprovedAnswers(merged.approvedAnswers);
      if (merged.monsterCollection.storyProgress) {
        const normalizedStory = normalizeStoryProgressForPage(merged.monsterCollection.storyProgress);
        storyProgressRef.current = normalizedStory;
        setStoryProgress(normalizedStory);
      }
    },
    [],
  );

  const resetPlayState = useCallback(
    ({ keepHabitat = true, battle = null }: { keepHabitat?: boolean; battle?: Battle | null } = {}) => {
      resetSession();
      setSessionAnswers([]);
      setResultEvaluation(null);
      setCaptureResult(null);
      setBattleOutcome(null);
      setCompletedBattleResult(null);
      setUseMasterBallThisBattle(false);
      if (!keepHabitat || !currentHabitatRef.current) selectNextHabitat();
      const newIndex =
        pickNextQuestionIndex(null, new Set(), 1.0, battle) ?? 0;
      setIndex(newIndex);
      seenInPlayRef.current = new Set([newIndex]);
      setLastUnlockCount(0);
      resultUnlockAppliedRef.current = false;
    },
    [pickNextQuestionIndex, selectNextHabitat, resetSession],
  );

  const beginBattleSession = useCallback(
    (battleId: string, progress: StoryProgress, collection: MonsterCollection) => {
      const battle = getBattleForProgress(battleId, progress);
      if (!battle) return;
      const nextStory = startBattleSessionForPage(progress, battleId);
      setStoryProgress(nextStory);
      storyProgressRef.current = nextStory;
      setActiveBattle(battle);
      activeBattleRef.current = battle;
      setCompletedBattleResult(null);
      setUseMasterBallThisBattle(false);
      setFlowPlayCount(1);
      resetPlayState({ keepHabitat: true, battle });
      persistProgress({ nextStory, nextCollection: collection });
      setActiveView("study");
    },
    [persistProgress, resetPlayState],
  );

  const startBattle = useCallback(
    (battleId: string) => {
      if (
        needsStarterChoice(storyProgressRef.current, battleId) &&
        !savedCollectionExistsRef.current
      ) {
        setPendingStarterBattleId(battleId);
        return;
      }
      beginBattleSession(
        battleId,
        storyProgressRef.current,
        monsterCollectionRef.current,
      );
    },
    [beginBattleSession],
  );

  const handleStarterSelect = useCallback(
    (lineId: string) => {
      const { collection, progress } = applyStarterChoiceForPage(
        monsterCollectionRef.current,
        storyProgressRef.current,
        lineId,
      );
      monsterCollectionRef.current = collection;
      setMonsterCollection(collection);
      storyProgressRef.current = progress;
      setStoryProgress(progress);
      const battleId = pendingStarterBattleId ?? "rival-1";
      setPendingStarterBattleId(null);
      beginBattleSession(battleId, progress, collection);
    },
    [beginBattleSession, pendingStarterBattleId],
  );

  const handleUseMasterBall = useCallback(() => {
    const preview =
      completedBattleResult?.capture ??
      resultEvaluation?.capturePreview ??
      captureResult;
    if (!preview?.lineId || !canUseMasterBall(storyProgressRef.current)) return;

    const applied = applyMasterBallCaptureForPage(
      storyProgressRef.current,
      monsterCollectionRef.current,
      preview,
    );
    if (!applied.capture) return;

    const nextCollection = applied.collection;
    const nextStory = applied.progress;
    monsterCollectionRef.current = nextCollection;
    setMonsterCollection(nextCollection);
    setStoryProgress(nextStory);
    storyProgressRef.current = nextStory;
    setCaptureResult(applied.capture);

    if (completedBattleResult) {
      setCompletedBattleResult({
        ...completedBattleResult,
        capture: applied.capture,
        resultMessage: getBattleResultMessageForPage(
          completedBattleResult.battle,
          true,
          applied.capture,
        ),
      });
    }

    const capturedLine = getMonsterLine(applied.capture.lineId);
    enqueueToast({
      title: "マスターボール！",
      message: `${capturedLine?.name ?? "ポケモン"}を捕まえた！`,
      image: capturedLine?.sprite,
      duration: 2000,
    });
    persistProgress({ nextCollection, nextStory });
  }, [
    captureResult,
    completedBattleResult,
    enqueueToast,
    persistProgress,
    resultEvaluation,
  ]);

  const startGame = useCallback(() => {
    setActiveBattle(null);
    activeBattleRef.current = null;
    setFlowPlayCount(1);
    resetPlayState({ keepHabitat: true, battle: null });
    setActiveView("study");
  }, [resetPlayState]);

  const restart = useCallback(() => {
    if (completedBattleResult?.battle && completedBattleResult.lost) {
      startBattle(completedBattleResult.battle.id);
      return;
    }
    setFlowPlayCount((count) => count + 1);
    resetPlayState({ keepHabitat: true, battle: null });
    setActiveView("study");
  }, [completedBattleResult, resetPlayState, startBattle]);

  const backToStart = useCallback(() => {
    setFlowPlayCount(1);
    resetPlayState({ keepHabitat: false });
    setActiveView("start");
  }, [resetPlayState]);

  const handleSendToProfessor = useCallback(
    (monsterIds: string[]) => {
      const transferredCollection = sendMonstersToProfessor(
        monsterCollectionRef.current,
        monsterIds,
      );
      const { collection: giftCollection, awarded } = awardEligibleGiftMonsters(
        transferredCollection,
        {
          unlockedPoolSize,
          trigger: "professor-transfer",
          habitatMinPools,
        },
      );
      const professorStarters = awardMissingProfessorStarters(
        giftCollection,
        storyProgressRef.current,
      );
      const nextCollection = professorStarters.collection;
      const nextStory = professorStarters.progress;
      monsterCollectionRef.current = nextCollection;
      setMonsterCollection(nextCollection);
      if (nextStory !== storyProgressRef.current) {
        storyProgressRef.current = nextStory;
        setStoryProgress(nextStory);
        persistProgress({ nextCollection, nextStory });
      }
      enqueueGiftToasts(awarded);
      for (const gift of professorStarters.awarded) {
        enqueueToast({
          title: "博士からの贈り物！",
          message: gift.message,
          image: gift.sprite,
          duration: 2200,
        });
      }
      const pendingFossil = getPendingFossilGift(nextCollection, {
        unlockedPoolSize,
        habitatMinPools,
      });
      if (pendingFossil) setFossilChoice(pendingFossil);
    },
    [
      enqueueGiftToasts,
      enqueueToast,
      habitatMinPools,
      persistProgress,
      unlockedPoolSize,
    ],
  );

  // Hook game session answers to page state answers
  useEffect(() => {
    setSessionAnswers(gameSessionAnswers);
  }, [gameSessionAnswers]);

  // Keyboard triggers using custom hook
  useKeyboardShortcuts({
    activeView,
    startGame,
    restart,
  });

  const currentTier = getPoolTier(unlockedPoolSize);
  const tierTheme = getTierTheme(currentTier.label);

  useEffect(() => {
    if (currentHabitatRef.current) return;
    selectNextHabitat();
  }, [selectNextHabitat]);

  const shouldShowPokemonBox = isPokemonBoxOpen || isBoxOverLimit;

  const fossilChoiceModal = (
    <FossilChoiceModal group={fossilChoice} onSelect={handleFossilChoice} />
  );
  const starterChoiceModal = pendingStarterBattleId ? (
    <StarterChoiceModal onSelect={handleStarterSelect} />
  ) : null;

  if (!q) {
    return (
      <>
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border bg-white p-6">
            <h1 className="text-xl font-semibold">英単語クイズ</h1>
            <p className="mt-3 text-zinc-700">問題データがありません。</p>
          </div>
        </div>
        <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
        <TrainerChallengeAlert
          alert={trainerChallenge}
          onDismiss={() => setTrainerChallenge(null)}
        />
        {fossilChoiceModal}
        {starterChoiceModal}
      </>
    );
  }

  if (activeView === "dashboard") {
    return (
      <>
        <ProgressDashboard
          stats={stats}
          totalWords={VOCAB_ITEMS.length}
          onBack={() => setActiveView(dashboardReturnView)}
        />
        <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
        <TrainerChallengeAlert
          alert={trainerChallenge}
          onDismiss={() => setTrainerChallenge(null)}
        />
        {fossilChoiceModal}
        {starterChoiceModal}
      </>
    );
  }

  if (activeView === "result") {
    return (
      <>
        <ResultScreen
          score={score}
          bestStreak={bestStreak}
          playLimit={
            completedBattleResult
              ? getSessionPlayLimit(completedBattleResult.battle, GAME.PLAY_LIMIT)
              : sessionPlayLimit
          }
          unlockedPoolSize={unlockedPoolSize}
          totalWords={VOCAB_ITEMS.length}
          unlockedThisRun={lastUnlockCount}
          evaluation={resultEvaluation ?? playEvaluation}
          battleResult={completedBattleResult}
          masterBallAvailable={canUseMasterBall(storyProgress)}
          onUseMasterBall={handleUseMasterBall}
          onRestart={restart}
          onOpenDashboard={() => openDashboard("result")}
          onBackToStart={backToStart}
        />
        <ToastQueue
          toast={activeToast}
          onDismiss={dismissActiveToast}
          position="mobile-bottom"
        />
        <TrainerChallengeAlert
          alert={trainerChallenge}
          onDismiss={() => setTrainerChallenge(null)}
        />
        {fossilChoiceModal}
        {starterChoiceModal}
      </>
    );
  }

  if (activeView === "start") {
    const poolPct = Math.min(100, (unlockedPoolSize / VOCAB_ITEMS.length) * 100);
    return (
      <>
        <div
          className="relative overflow-hidden min-h-screen text-zinc-900 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundImage: tierTheme.pageGradient }}
        >
          <AuroraBackground vivid colors={tierTheme.auroraColors} />
          <div className="relative z-10 w-full max-w-md space-y-3">
            {/* メインカード */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl overflow-hidden shadow-2xl shadow-indigo-300/40 border border-indigo-100/50"
            >
              {/* グラデーションヘッダー（ゆっくり色が動くアニメーションつき、ティアに応じて配色が変わる） */}
              <div
                className="gradient-cta relative overflow-hidden px-6 pt-6 pb-6"
                style={{ backgroundImage: tierTheme.accentGradient }}
              >
                <h1 className="font-display text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]">
                  英単語クイズ
                </h1>
                <div className="mt-1 flex items-center gap-1.5 text-indigo-200 text-sm">
                  <span>{currentHabitat?.name || "—"}</span>
                  <span>·</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                    {currentTier.label} ×{currentTier.multiplier}
                  </span>
                </div>

                {/* プール進捗バー */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-xs text-indigo-200">出題プール</span>
                    <span className="text-xs font-semibold text-white tabular-nums">
                      {unlockedPoolSize} <span className="text-indigo-300 font-normal">/ {VOCAB_ITEMS.length}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/20">
                    <motion.div
                      className="h-full rounded-full bg-white"
                      initial={{ width: 0 }}
                      animate={{ width: `${poolPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                </div>

                {/* バッジ */}
                {storyProgress.badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {storyProgress.badges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-white/20 border border-white/30 px-2.5 py-0.5 text-xs font-semibold text-white"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}

                {canUseMasterBall(storyProgress) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                    ◎ マスターボール所持
                  </div>
                )}
              </div>

              {/* ボタンエリア */}
              <div className="bg-white px-5 py-5 space-y-2.5">
                {startScreenBattle && (
                  <motion.button
                    type="button"
                    onClick={() => startBattle(startScreenBattle.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-sm font-bold text-white shadow-md shadow-rose-200 hover:shadow-rose-300 transition-shadow"
                  >
                    ⚔ {startScreenBattle.name}とたたかう！
                  </motion.button>
                )}
                <motion.button
                  type="button"
                  onClick={startGame}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{ backgroundImage: tierTheme.accentGradient }}
                  className="gradient-cta w-full h-12 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-indigo-300/50 hover:shadow-indigo-400/60 transition-shadow"
                >
                  1プレイ開始（10問）
                </motion.button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openDashboard("start")}
                    className="flex-1 h-10 rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    進捗
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPokemonBoxOpen(true)}
                    aria-expanded={isPokemonBoxOpen}
                    className="flex-1 h-10 rounded-xl border border-indigo-100 bg-indigo-50 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    ポケモン
                  </button>
                </div>

                <div className="pt-1 border-t border-zinc-100">
                  <SyncButton
                    stats={stats}
                    unlockedPoolSize={unlockedPoolSize}
                    monsterCollection={monsterCollection}
                    approvedAnswers={approvedAnswers}
                    onMerged={handleSyncMerged}
                  />
                </div>
              </div>
            </motion.div>

            {/* モンスター */}
            {shouldShowPokemonBox && (
              <PokemonBox
                collection={monsterCollection}
                limit={BOX_LIMIT}
                forceManage={isBoxOverLimit}
                onClose={() => setIsPokemonBoxOpen(false)}
                onSwap={(first, second) =>
                  setMonsterCollection((prev) =>
                    swapMonsterLocations(prev, first, second),
                  )
                }
                onRemove={(partyIndex: number) =>
                  setMonsterCollection((prev) =>
                    sendPartySlotToBox(prev, partyIndex),
                  )
                }
                onSendToProfessor={handleSendToProfessor}
                onSortBox={(mode: BoxSortMode) =>
                  setMonsterCollection((prev) => sortBoxMonsters(prev, mode))
                }
              />
            )}

            <PokemonParty
              collection={monsterCollection}
              onSelect={(monsterId: string) =>
                setMonsterCollection((prev) =>
                  setActiveMonster(prev, monsterId),
                )
              }
            />
          </div>
        </div>
        <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
        <TrainerChallengeAlert
          alert={trainerChallenge}
          onDismiss={() => setTrainerChallenge(null)}
        />
        {fossilChoiceModal}
        {starterChoiceModal}
      </>
    );
  }

  // ── クイズ画面 ──────────────────────────────────────────────────────────
  // モバイル: 全画面フレックスコラム（キーボード出現時も下にボタンが残る）
  // PC: 中央寄せカード
  return (
    <>
      <div
        className="relative overflow-hidden flex flex-col min-h-dvh text-zinc-900 sm:min-h-screen sm:items-center sm:justify-center sm:p-6"
        style={{ backgroundImage: tierTheme.quizGradient }}
      >
        <AuroraBackground vivid colors={tierTheme.auroraColors} />
        {activeBattle && (
          <div className="sticky top-0 z-40 shrink-0 sm:hidden">
            <CompactBattleBar
              battle={activeBattle}
              questionNumber={total}
              playLimit={sessionPlayLimit}
              currentAccuracy={currentBattleAccuracy}
              masterBallAvailable={canUseMasterBall(storyProgress)}
              useMasterBall={useMasterBallThisBattle}
              onToggleMasterBall={() =>
                setUseMasterBallThisBattle((prev) => !prev)
              }
            />
          </div>
        )}

        {/* カード */}
        <div className="relative z-10 flex flex-1 flex-col bg-white w-full sm:flex-initial sm:max-w-lg sm:rounded-3xl sm:border sm:border-indigo-100/60 sm:shadow-xl sm:shadow-indigo-100/40 sm:overflow-hidden">

          {/* スクロール可能なコンテンツ領域 */}
          <div className="flex-1 overflow-y-auto sm:overflow-visible">
            {activeBattle && (
              <div className="hidden sm:block px-5 pt-5">
                <BattleBanner
                  battle={activeBattle}
                  questionNumber={total}
                  playLimit={sessionPlayLimit}
                  currentAccuracy={currentBattleAccuracy}
                  won={battleOutcome === "won"}
                  lost={battleOutcome === "lost"}
                  masterBallAvailable={canUseMasterBall(storyProgress)}
                  useMasterBall={useMasterBallThisBattle}
                  onToggleMasterBall={() =>
                    setUseMasterBallThisBattle((prev) => !prev)
                  }
                />
              </div>
            )}

            {/* プログレス行 */}
            <div className="px-4 pt-4 sm:px-6 sm:pt-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-1.5 overflow-hidden rounded-full bg-indigo-100"
                  role="progressbar"
                  aria-valuenow={total}
                  aria-valuemin={1}
                  aria-valuemax={sessionPlayLimit}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <div className="text-xs text-indigo-400 shrink-0 font-medium">{progress}</div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                <span>{score} 正解</span>
                <AnimatePresence>
                  {bestStreak > 1 && (
                    <motion.span
                      key={bestStreak}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-amber-500 font-semibold drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                    >
                      🔥 {bestStreak}連続
                    </motion.span>
                  )}
                </AnimatePresence>
                {!activeBattle && (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-xs font-bold text-white"
                    style={{ backgroundColor: currentTier.color }}
                  >
                    ×{currentTier.multiplier}
                  </span>
                )}
              </div>
            </div>

            {/* 問題カード：問題が変わるたびスライドイン（ティアに応じて配色が変わる） */}
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ backgroundImage: tierTheme.accentGradient }}
              className="gradient-cta relative mx-4 mt-4 overflow-hidden rounded-2xl px-5 py-8 text-center shadow-xl shadow-indigo-300/40 sm:mx-6 sm:py-10"
            >
              <div className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
                {getPartOfSpeech(q)}
              </div>
              <div className="font-display mt-3 break-words text-4xl font-bold tracking-tight text-white leading-tight drop-shadow-[0_0_24px_rgba(255,255,255,0.4)] sm:text-5xl">
                {q.target}
              </div>
            </motion.div>

            {/* 入力フィールド */}
            <div className="px-4 mt-4 pb-2 sm:px-6">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder="日本語訳を入力..."
                aria-label="日本語訳を入力してください"
                className="w-full rounded-xl border-2 border-indigo-100 bg-indigo-50/50 px-4 py-3 text-base outline-none transition-all focus:border-indigo-400 focus:bg-white focus:shadow-lg focus:shadow-indigo-200/50 disabled:opacity-50"
                onKeyDown={(e) => {
                  if (isComposing) return;
                  if (e.key !== "Enter") return;
                  if (checked) next();
                  else checkAnswer();
                }}
                disabled={isCheckingAnswer}
              />

              <AnimatePresence mode="wait">
                {checked && (
                  <motion.div
                    key={isCorrect ? "correct" : "wrong"}
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="mt-2"
                  >
                    {isCorrect ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                        <div className="text-sm font-bold text-emerald-700">
                          {answerStatus === "ai_approved" ? "〇（AI承認）" : answerStatus === "alternative" ? "◯ 正解（別解）" : "◯ 正解"}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3">
                        <div className="text-xs font-semibold text-rose-400 mb-0.5">不正解</div>
                        <div className="text-sm font-bold text-rose-900">{normalizedAnswers.join(" / ")}</div>
                        {posViolation && (
                          <div className="mt-1 text-xs text-rose-700 opacity-80">{posViolation}</div>
                        )}
                        {!reviewResult && (
                          <div className="mt-2 flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={requestAiReview}
                              disabled={isRequestingReview}
                              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition text-left"
                            >
                              {isRequestingReview ? "AIが審議中..." : "AIに審議してもらう"}
                            </button>
                            {isRequestingReview && (
                              <p className="text-xs text-zinc-400 px-1">AIの審議には少し時間がかかります。そのままお待ちください。</p>
                            )}
                          </div>
                        )}
                        {reviewResult && !reviewResult.approved && (
                          <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                            AI審議: 不承認（{reviewResult.score}点）{reviewResult.feedback ? `— ${reviewResult.feedback}` : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ボタン：モバイルでは最下部に固定 */}
          <div className="shrink-0 px-4 pb-5 pt-2 bg-white sm:px-6 sm:pb-6">
            <motion.button
              type="button"
              onClick={checked ? next : checkAnswer}
              disabled={isCheckingAnswer}
              whileTap={{ scale: 0.98 }}
              style={checked ? undefined : { backgroundImage: tierTheme.accentGradient }}
              className={`w-full h-14 text-base font-bold rounded-2xl transition-all flex items-center justify-center ${
                checked
                  ? "bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100"
                  : "gradient-cta text-white shadow-lg shadow-indigo-300/50 hover:shadow-indigo-400/60"
              } disabled:opacity-40`}
            >
              {isCheckingAnswer ? "判定中…" : checked ? "次へ →" : "答え合わせ"}
            </motion.button>
          </div>
        </div>
      </div>

      <ToastQueue toast={activeToast} onDismiss={dismissActiveToast} />
      <TrainerChallengeAlert
        alert={trainerChallenge}
        onDismiss={() => setTrainerChallenge(null)}
      />
      {fossilChoiceModal}
      {starterChoiceModal}
    </>
  );
}
