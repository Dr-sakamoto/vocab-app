"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FossilChoiceModal from "./components/FossilChoiceModal";
import PokemonBox from "./components/PokemonBox";
import StarterChoiceModal from "./components/StarterChoiceModal";
import SyncButton from "./components/SyncButton";
import ToastQueue from "./components/ToastQueue";
import DesktopGameScreen from "./components/game/DesktopGameScreen";
import MobileGameScreen from "./components/game/MobileGameScreen";
import { useGameSession } from "./hooks/useGameSession";
import { useVocabPool } from "./hooks/useVocabPool";
import { useClickSound } from "./hooks/useClickSound";
import { useVisualViewportVars } from "./hooks/useVisualViewport";

import {
  applyCaptureResultToCollection,
  getHabitatMinPoolMap,
  getUnlockedHabitats,
} from "@/lib/capture";
import { evaluatePlay } from "@/lib/playEvaluation";
import {
  DEFAULT_STORY_PROGRESS,
  markMewWordSeen,
  normalizeStoryProgress,
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
import { buildAnswerRounds } from "@/lib/tileQuiz";
import {
  applyAnswerToMissions,
  isNewWordStat,
  isWeakWordStat,
} from "@/lib/missions";
import {
  WildEncounterState,
  applyDamageToEncounter,
  getBattleParty,
  getPartyAttackPower,
  normalizeWildEncounter,
  rollWildEncounter,
  spawnWildEncounter,
  tryCaptureEncounter,
} from "@/lib/wildEncounter";
import { QUESTIONS } from "@/lib/vocab";
import { GAME, STORAGE_KEYS } from "@/lib/constants";
import {
  EMPTY_STREAK,
  StreakState,
  getDisplayStreak,
  normalizeStreak,
  recordPlay,
  toDateKey,
} from "@/lib/streak";
import {
  WordStat,
  MonsterCollection,
  PlayEvaluation,
  StoryProgress,
  ActiveToast,
  ToastItem,
  VocabItem,
} from "@/lib/types";
import storage from "@/lib/storage";

const APPROVED_ANSWERS_KEY = "vocab-approved-answers";
const MIN_FRONT_TOAST_MS = 1000;

/** 各問題に安定した ID */
const VOCAB_ITEMS: VocabItem[] = QUESTIONS.map((q, i) => ({
  ...q,
  id: `w${i}`,
}));

type GiftGroup = {
  id?: string;
  title?: string;
  message?: string;
};

type BoxSortMode = "dex" | "level";

const normalizeStoryProgressForPage = normalizeStoryProgress as (
  progress: unknown,
) => StoryProgress;
const syncRetroactiveBattlesForPage = syncRetroactiveBattles as (
  progress: StoryProgress,
  options: { unlockedPoolSize: number },
) => StoryProgress;
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

/**
 * 単一画面・3ブロック構成のメインページ。
 *
 * 1. ワールドウィンドウ（28%）: 出現エティモン・ミッション・現在地
 * 2. 問題ウィンドウ（52%）: 出題。答え合わせは入力欄内の⏎アイコンに統合。
 *    10問区切りで中身だけリザルトに入れ替わる
 * 3. エティモンウィンドウ（20%）: 手持ち4体と編成ドロワーの取っ手
 *
 * 画面遷移は存在しない。スタート画面・リザルト画面・ポケモン画面への
 * 移動が学習フローを切っていたため、すべてこの1画面に統合した。
 */
export default function Page() {
  /** 問題ウィンドウの中身。ページ遷移ではなくブロック内の入れ替え */
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [stats, setStats] = useState<WordStat[]>(() =>
    VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })),
  );

  const didLoadFromStorageRef = useRef<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const [resultEvaluation, setResultEvaluation] = useState<PlayEvaluation | null>(null);
  const [flowPlayCount, setFlowPlayCount] = useState<number>(1);
  const [activeToasts, setActiveToastsState] = useState<ActiveToast[]>([]);
  const [fossilChoice, setFossilChoice] = useState<GiftGroup | null>(null);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(() =>
    normalizeStoryProgressForPage(DEFAULT_STORY_PROGRESS),
  );
  const [monsterCollection, setMonsterCollection] = useState<MonsterCollection>(() =>
    normalizeMonsterCollection(DEFAULT_MONSTER_COLLECTION),
  );
  const [encounter, setEncounter] = useState<WildEncounterState | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);

  const [index, setIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenInPlayRef = useRef<Set<number> | null>(null);
  if (seenInPlayRef.current === null) {
    seenInPlayRef.current = new Set<number>([index]);
  }

  const [isComposing, setIsComposing] = useState<boolean>(false);
  // 初期値 true: 復元が終わるまでスターター選択モーダルを出さない
  const [savedCollectionExists, setSavedCollectionExists] = useState<boolean>(true);

  // ── スマホ最適化 ────────────────────────────────────────────────────────
  // PC/スマホでUI・仕様が異なるためスクリーンを分離する。
  // スマホはソフトウェアキーボードがフローを切るため回答を文字盤
  // （みんはや式・1文字ずつタップ）に固定。PCは物理キーボードでタイピング。
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const answerMode: "tiles" | "typing" = isMobile ? "tiles" : "typing";

  // SSR とハイドレーションの不一致を避けるため、初期値は空で、実データは
  // マウント後の localStorage 復元 useEffect で読み込む。
  const [dailyStreak, setDailyStreak] = useState<StreakState>(EMPTY_STREAK);

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
  const encounterRef = useRef<WildEncounterState | null>(null);

  const {
    unlockedPoolSize,
    setUnlockedPoolSize,
    lastUnlockCount,
    setLastUnlockCount,
    pickNextQuestionIndex,
  } = useVocabPool({ stats, vocabItemsLength: VOCAB_ITEMS.length });

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
  } = useGameSession({
    q,
    index,
    activeView: phase === "result" ? "result" : "study",
    stats,
    setStats,
    approvedAnswers,
  });

  // ── トースト通知 ──────────────────────────────────────────────────────────
  // 通知は1段目に来たら最低でもMIN_FRONT_TOAST_MSだけ留まってから、
  // 後続の通知に押し出される（新しいものが来ても即座には奪わせない）
  const activeToastsRef = useRef<ActiveToast[]>([]);
  const frontToastEnteredAtRef = useRef<number>(0);
  const pendingToastQueueRef = useRef<ToastItem[]>([]);
  const toastPromoteTimerRef = useRef<number | null>(null);

  const promoteToast = useCallback((toast: ToastItem) => {
    const instanceId = `${Date.now()}-${Math.random()}`;
    const next = [{ ...toast, instanceId }, ...activeToastsRef.current].slice(0, 3);
    frontToastEnteredAtRef.current = Date.now();
    activeToastsRef.current = next;
    setActiveToastsState(next);
  }, []);

  const dismissToast = useCallback((instanceId: string) => {
    const prev = activeToastsRef.current;
    const next = prev.filter((t) => t.instanceId !== instanceId);
    if (next[0]?.instanceId !== prev[0]?.instanceId) {
      frontToastEnteredAtRef.current = Date.now();
    }
    activeToastsRef.current = next;
    setActiveToastsState(next);
  }, []);

  const scheduleToastQueueDrainRef = useRef<() => void>(() => {});
  const scheduleToastQueueDrain = useCallback(() => {
    if (toastPromoteTimerRef.current !== null) return;
    if (pendingToastQueueRef.current.length === 0) return;
    const elapsed = Date.now() - frontToastEnteredAtRef.current;
    const wait = Math.max(0, MIN_FRONT_TOAST_MS - elapsed);
    toastPromoteTimerRef.current = window.setTimeout(() => {
      toastPromoteTimerRef.current = null;
      const next = pendingToastQueueRef.current.shift();
      if (next) promoteToast(next);
      scheduleToastQueueDrainRef.current();
    }, wait);
  }, [promoteToast]);
  useEffect(() => {
    scheduleToastQueueDrainRef.current = scheduleToastQueueDrain;
  }, [scheduleToastQueueDrain]);

  const enqueueToast = useCallback(
    (toast: ToastItem) => {
      const elapsed = Date.now() - frontToastEnteredAtRef.current;
      if (activeToastsRef.current.length === 0 || elapsed >= MIN_FRONT_TOAST_MS) {
        promoteToast(toast);
      } else {
        pendingToastQueueRef.current.push(toast);
        scheduleToastQueueDrain();
      }
    },
    [promoteToast, scheduleToastQueueDrain],
  );

  const enqueueToasts = useCallback(
    (toasts: ToastItem[]) => {
      toasts.forEach((toast) => enqueueToast(toast));
    },
    [enqueueToast],
  );

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
      enqueueToasts(
        awarded.map((gift) => ({
          title: getGiftToastTitle(gift),
          message: gift.message,
          image: gift.sprite,
        })),
      );
    },
    [enqueueToasts],
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
    encounterRef.current = encounter;
  }, [encounter]);

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

  const persistEncounter = useCallback((next: WildEncounterState | null) => {
    if (!didLoadFromStorageRef.current) return;
    try {
      storage.set(STORAGE_KEYS.WILD_ENCOUNTER, next);
    } catch {
      /* ignore */
    }
  }, []);

  /** 新しい野生エティモンを出現させる */
  const spawnEncounter = useCallback(
    (poolSize: number, collection: MonsterCollection) => {
      const spawned = spawnWildEncounter({
        unlockedPoolSize: poolSize,
        habitatVisits: collection?.habitatVisits ?? {},
        seed: `${Date.now()}-${Math.random()}`,
        collection,
      });
      encounterRef.current = spawned;
      setEncounter(spawned);
      persistEncounter(spawned);
      return spawned;
    },
    [persistEncounter],
  );

  // プレイ開始時に「今日プレイした」ことを記録し、毎日ストリークを更新する。
  const markDailyPlay = useCallback(() => {
    setDailyStreak((prev) => {
      const next = recordPlay(prev, toDateKey(new Date()));
      if (next !== prev) storage.set(STORAGE_KEYS.STREAK, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (phase !== "quiz" || isCheckingAnswer || answerMode !== "typing") return;
    inputRef.current?.focus();
  }, [phase, checked, index, isCheckingAnswer, answerMode]);

  // 文字盤（みんはや式）。問題ごとに固定シードで生成し、再レンダーで揺れない
  const tileBoard = useMemo(
    () =>
      answerMode === "tiles"
        ? buildAnswerRounds({
            items: VOCAB_ITEMS,
            index,
            unlockedPoolSize,
            seed: `tiles:${index}:${total}:${flowPlayCount}`,
          })
        : null,
    [answerMode, index, unlockedPoolSize, total, flowPlayCount],
  );

  // ── localStorage 復元 ──────────────────────────────────────────────────────
  useEffect(() => {
    try {
      setDailyStreak(normalizeStreak(storage.get(STORAGE_KEYS.STREAK, EMPTY_STREAK)));

      let loadedPoolSize = Math.min(GAME.INITIAL_POOL_SIZE, VOCAB_ITEMS.length);
      const savedPool = Number(storage.get(STORAGE_KEYS.POOL_SIZE, null));
      if (Number.isFinite(savedPool) && savedPool > 0) {
        loadedPoolSize = Math.max(
          Math.min(GAME.INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
          Math.min(Math.floor(savedPool), VOCAB_ITEMS.length),
        );
        setUnlockedPoolSize(loadedPoolSize);
      }

      const savedXP = clampMonsterXP(storage.get(STORAGE_KEYS.MONSTER_XP, null));
      const savedMonsterLineId = storage.getString(STORAGE_KEYS.MONSTER_LINE_ID, "");
      const rawCollection = storage.get(STORAGE_KEYS.MONSTER_COLLECTION, null);
      setSavedCollectionExists(rawCollection !== null);
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

      // 出現エティモンの復元。進行中のものがなければ非遭遇状態から始める
      // （遭遇率に従い、1問ごとの抽選で遭遇する）
      const restoredEncounter = normalizeWildEncounter(
        storage.get(STORAGE_KEYS.WILD_ENCOUNTER, null),
      );
      if (restoredEncounter) {
        encounterRef.current = restoredEncounter;
        setEncounter(restoredEncounter);
      }

      // 単語進捗
      const parsed = storage.get<any[] | null>(STORAGE_KEYS.PROGRESS, null);
      if (parsed && Array.isArray(parsed)) {
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
      }
    } catch {
      /* ignore */
    } finally {
      didLoadFromStorageRef.current = true;
      setIsLoaded(true);
    }
  }, [syncGiftProgress, setUnlockedPoolSize]);

  // 復元完了後に最初の問題を選ぶ（復元された stats・プールを反映した抽選にする）
  const didInitQuestionRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isLoaded || didInitQuestionRef.current) return;
    didInitQuestionRef.current = true;
    const newIndex = pickNextQuestionIndex(null, new Set(), 1.0, null) ?? 0;
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    markDailyPlay();
  }, [isLoaded, pickNextQuestionIndex, markDailyPlay]);

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

  // 手持ちがいない新規プレイヤーには最初のエティモンを選ばせる
  const showStarterChoice =
    isLoaded &&
    !savedCollectionExists &&
    normalizeMonsterCollection(monsterCollection).monsters.length === 0 &&
    needsStarterChoice(storyProgress);

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
      setSavedCollectionExists(true);
      persistProgress({ nextCollection: collection, nextStory: progress });
    },
    [persistProgress],
  );

  // ── ミュウ単語トラッキング（既存データ互換のため維持） ─────────────────────
  useEffect(() => {
    if (phase !== "quiz" || !q) return;
    setStoryProgress((prev) => {
      const next = markMewWordSeenForPage(prev, index, VOCAB_ITEMS.length);
      storyProgressRef.current = next;
      return next;
    });
  }, [phase, index, q]);

  // ── 回答 → ミッション進行・HPダメージ・捕獲/逃走 ─────────────────────────
  // useGameSession の回答記録（previousCorrect/previousWrong 付き）を正本に、
  // 新しく増えた回答だけを1件ずつ処理する。
  const processedAnswerCountRef = useRef<number>(0);
  useEffect(() => {
    if (gameSessionAnswers.length <= processedAnswerCountRef.current) {
      processedAnswerCountRef.current = gameSessionAnswers.length;
      return;
    }
    processedAnswerCountRef.current = gameSessionAnswers.length;

    const latest = gameSessionAnswers[gameSessionAnswers.length - 1];
    if (!latest) return;

    const current = encounterRef.current;
    const collection = monsterCollectionRef.current;

    // 非遭遇中: 遭遇率を参照し、1問ごとに現在地のテーブルから遭遇を抽選する
    if (!current || current.status !== "active") {
      if (rollWildEncounter()) {
        spawnEncounter(unlockedPoolSize, collection);
      }
      return;
    }

    const party = getBattleParty(collection);
    const partyLineIds = party.map((monster) => monster.lineId);
    const partyMaxLevel = party.reduce(
      (max, monster) => Math.max(max, getMonsterDisplayState(monster).level),
      0,
    );

    const previousStat = {
      correct: latest.previousCorrect,
      wrong: latest.previousWrong,
    };
    const { missions, completedNow } = applyAnswerToMissions(current.missions, {
      correct: latest.correct,
      wasWeakWord: isWeakWordStat(previousStat),
      wasNewWord: isNewWordStat(previousStat),
      streak,
      partyLineIds,
      partyMaxLevel,
    });
    let nextEncounter: WildEncounterState = { ...current, missions };

    completedNow.forEach((mission) =>
      enqueueToast({
        title: "ミッション達成！",
        message: mission.label,
        duration: 1500,
      }),
    );

    // 全ミッション達成 → HPが残っているうちに捕獲成立
    const captureAttempt = tryCaptureEncounter(nextEncounter);
    if (captureAttempt.capture) {
      const capturedCollection = applyCaptureResultToCollection(
        collection,
        captureAttempt.capture,
      );
      monsterCollectionRef.current = capturedCollection;
      setMonsterCollection(capturedCollection);
      enqueueToast({
        title: "エティモン捕獲！",
        message: `${nextEncounter.name}を捕まえた！`,
        image: nextEncounter.sprite,
      });
      persistProgress({ nextCollection: capturedCollection });
      // 捕獲後は非遭遇状態に戻す（次の遭遇は1問ごとの抽選で決まる）
      encounterRef.current = null;
      setEncounter(null);
      persistEncounter(null);
      return;
    }

    // 正解ダメージ。HPが尽きたら倒してしまい、逃げられる
    if (latest.correct) {
      const damage = getPartyAttackPower(collection);
      const { encounter: damaged, escaped } = applyDamageToEncounter(
        nextEncounter,
        damage,
      );
      nextEncounter = damaged;
      if (escaped) {
        enqueueToast({
          title: "倒してしまった…",
          message: `${nextEncounter.name}は力尽きて逃げていった`,
          image: nextEncounter.sprite,
        });
        // 逃走後も非遭遇状態に戻す（次の遭遇は1問ごとの抽選で決まる）
        encounterRef.current = null;
        setEncounter(null);
        persistEncounter(null);
        return;
      }
    }

    encounterRef.current = nextEncounter;
    setEncounter(nextEncounter);
    persistEncounter(nextEncounter);
  }, [
    gameSessionAnswers,
    streak,
    enqueueToast,
    persistEncounter,
    persistProgress,
    spawnEncounter,
    unlockedPoolSize,
  ]);

  // ── 10問区切りの締め（プール解放 + XP 付与）───────────────────────────────
  const finishSet = useCallback(() => {
    if (resultUnlockAppliedRef.current) return;
    resultUnlockAppliedRef.current = true;

    const currentCollection = monsterCollectionRef.current;
    const finalEvaluation = evaluatePlay({
      answers: gameSessionAnswers,
      score,
      playLimit: GAME.PLAY_LIMIT,
      bestStreak,
      unlockedPoolSize,
      playCount: flowPlayCount,
    });
    setResultEvaluation(finalEvaluation);

    // プール解放。バトル画面を廃止したため、ボスゲートは通さない
    const accuracy = score / GAME.PLAY_LIMIT;
    let step = 0;
    if (accuracy >= 1) step = GAME.PERFECT_UNLOCK_STEP;
    else if (accuracy >= GAME.UNLOCK_ACCURACY) step = GAME.UNLOCK_STEP;
    const nextPoolSize =
      step > 0
        ? Math.min(unlockedPoolSize + step, VOCAB_ITEMS.length)
        : unlockedPoolSize;
    if (step > 0) {
      setUnlockedPoolSize(nextPoolSize);
      setLastUnlockCount(nextPoolSize - unlockedPoolSize);
    } else {
      setLastUnlockCount(0);
    }

    // XP をパーティへ付与。レベルアップ/進化はトーストと効果音で通知
    const gained = finalEvaluation.xp ?? 0;
    const activeMonster = getActiveMonster(currentCollection);
    let didLevelUp = false;
    let didEvolve = false;
    if (activeMonster) {
      const previousLevel = levelFromTotalXP(activeMonster.totalXP);
      const nextLevel = levelFromTotalXP(
        clampMonsterXP(activeMonster.totalXP + gained),
      );
      didLevelUp = nextLevel > previousLevel;
      didEvolve =
        getSpecies(previousLevel, activeMonster.lineId).id !==
        getSpecies(nextLevel, activeMonster.lineId).id;
    }
    let nextCollection = updatePartyXP(currentCollection, gained);

    const giftSync = syncGiftProgress(nextCollection, nextPoolSize, {
      showToasts: false,
    });
    nextCollection = giftSync.collection;

    const partyToasts = buildPartyChangeToasts(currentCollection, nextCollection);
    monsterCollectionRef.current = nextCollection;
    setMonsterCollection(nextCollection);
    enqueueToasts(partyToasts);
    enqueueGiftToasts(giftSync.awarded);

    if (didEvolve && evolutionSoundRef.current) {
      evolutionSoundRef.current.currentTime = 0;
      evolutionSoundRef.current.play()?.catch?.((error) => {
        console.debug("Evolution sound play error (ignoring):", error);
      });
    } else if (didLevelUp && levelUpSoundRef.current) {
      levelUpSoundRef.current.currentTime = 0;
      levelUpSoundRef.current.play()?.catch?.((error) => {
        console.debug("Level up sound play error (ignoring):", error);
      });
    }

    persistProgress({
      nextCollection,
      nextPoolSize,
    });
    setPhase("result");
  }, [
    bestStreak,
    enqueueGiftToasts,
    enqueueToasts,
    flowPlayCount,
    gameSessionAnswers,
    persistProgress,
    score,
    setLastUnlockCount,
    setUnlockedPoolSize,
    syncGiftProgress,
    unlockedPoolSize,
  ]);

  // ── 次へ ───────────────────────────────────────────────────────────────────
  // useCallback で参照を安定させる: モバイルの文字盤は checked のまま自動で
  // 次へ進むタイマーを持つため、無関係な再レンダリングのたびに next の参照が
  // 変わるとタイマーがリセットされ続けて自動送りが働かなくなってしまう。
  const advanceQuestion = useCallback((answeredCount: number) => {
    if (total >= GAME.PLAY_LIMIT) {
      finishSet();
      return;
    }

    setTotal((t) => t + 1);
    const seenInPlay = seenInPlayRef.current ?? new Set<number>([index]);
    seenInPlayRef.current = seenInPlay;
    const currentSessionAccuracy = answeredCount <= 0 ? 1 : score / answeredCount;
    const nextIndex = pickNextQuestionIndex(
      index,
      seenInPlay,
      currentSessionAccuracy,
      null,
    );
    if (nextIndex === null) {
      finishSet();
      return;
    }
    seenInPlay.add(nextIndex);
    setIndex(nextIndex);
    prepareNextQuestion();
    setReviewResult(null);
  }, [
    total,
    finishSet,
    setTotal,
    index,
    score,
    pickNextQuestionIndex,
    prepareNextQuestion,
  ]);

  const next = useCallback(() => {
    if (!checked || phase === "result") return;
    advanceQuestion(total);
  }, [checked, phase, total, advanceQuestion]);

  // ── とばす ─────────────────────────────────────────────────────────────────
  // 未回答のまま次の問題へ。正誤どちらにもしないため score・streak・
  // 単語ごとの正誤統計・バトルのダメージ/捕獲判定には一切触れない。
  // セット区切り（10問）は next と同じく total を進めて維持する。
  const skip = useCallback(() => {
    if (checked || phase === "result") return;
    advanceQuestion(total - 1);
  }, [checked, phase, total, advanceQuestion]);

  /** リザルトから次の10問セットへ。画面はそのまま、中身だけ入れ替える */
  const continueToNextSet = useCallback(() => {
    markDailyPlay();
    setFlowPlayCount((count) => count + 1);
    resetSession();
    setResultEvaluation(null);
    setReviewResult(null);
    const newIndex = pickNextQuestionIndex(null, new Set(), 1.0, null) ?? 0;
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    setLastUnlockCount(0);
    resultUnlockAppliedRef.current = false;
    processedAnswerCountRef.current = 0;
    if (!encounterRef.current || encounterRef.current.status !== "active") {
      spawnEncounter(unlockedPoolSize, monsterCollectionRef.current);
    }
    setPhase("quiz");
  }, [
    markDailyPlay,
    pickNextQuestionIndex,
    resetSession,
    setLastUnlockCount,
    spawnEncounter,
    unlockedPoolSize,
  ]);

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
    [setUnlockedPoolSize],
  );

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
      enqueueToasts(
        professorStarters.awarded.map((gift) => ({
          title: "博士からの贈り物！",
          message: gift.message,
          image: gift.sprite,
        })),
      );
      const pendingFossil = getPendingFossilGift(nextCollection, {
        unlockedPoolSize,
        habitatMinPools,
      });
      if (pendingFossil) setFossilChoice(pendingFossil);
    },
    [
      enqueueGiftToasts,
      enqueueToasts,
      habitatMinPools,
      persistProgress,
      unlockedPoolSize,
    ],
  );

  // 全ボタン共通の「カチャ」というクリック音
  useClickSound();

  // モバイルのキーボード表示に合わせて画面を視覚ビューポートに収める
  useVisualViewportVars();

  const currentTier = getPoolTier(unlockedPoolSize);
  const displayStreak = getDisplayStreak(dailyStreak, toDateKey(new Date()));
  const fallbackHabitatName = useMemo(
    () => getUnlockedHabitats(unlockedPoolSize).at(-1)?.name ?? "",
    [unlockedPoolSize],
  );

  const progressPct = Math.max(0, Math.min(100, (total / GAME.PLAY_LIMIT) * 100));
  const shouldOpenDrawer = isDrawerOpen || isBoxOverLimit;

  // 各スクリーンへ渡す props 群（レイアウトはスクリーン側の責務）
  const worldProps = {
    encounter: encounter?.status === "active" ? encounter : null,
    fallbackHabitatName,
    tier: currentTier,
    unlockedPoolSize,
    totalWords: VOCAB_ITEMS.length,
    streakDays: displayStreak,
  };
  const quizProps = {
    phase,
    questionKey: index,
    partOfSpeech: getPartOfSpeech(q),
    word: q.target,
    total,
    playLimit: GAME.PLAY_LIMIT,
    progressPct,
    score,
    bestStreak,
    tierMultiplier: currentTier.multiplier,
    onSkip: checked ? undefined : skip,
    skipDisabled: isCheckingAnswer,
  };
  const resultProps = {
    evaluation: resultEvaluation,
    score,
    playLimit: GAME.PLAY_LIMIT,
    unlockedThisRun: lastUnlockCount,
    onContinue: continueToNextSet,
  };
  const typingProps = {
    inputRef,
    input,
    onInputChange: setInput,
    onCompositionStart: () => setIsComposing(true),
    onCompositionEnd: () => setIsComposing(false),
    isComposing,
    onFocus: () => {},
    onBlur: () => {},
    checked,
    isCorrect,
    answerStatus,
    isCheckingAnswer,
    normalizedAnswers,
    posViolation,
    reviewResult,
    isRequestingReview,
    onRequestAiReview: requestAiReview,
    onCheck: () => checkAnswer(),
    onNext: next,
  };
  const tileProps = {
    board: tileBoard,
    resetKey: `${index}:${total}:${flowPlayCount}`,
    checked,
    isCorrect,
    isCheckingAnswer,
    normalizedAnswers,
    onSubmit: (text: string) => checkAnswer(text, { skipApi: true }),
    onNext: next,
  };
  const dockProps = {
    collection: monsterCollection,
    onSelect: (monsterId: string) =>
      setMonsterCollection((prev) => setActiveMonster(prev, monsterId)),
    onOpenDrawer: () => setIsDrawerOpen(true),
  };

  if (!q) {
    return (
      <>
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border bg-white p-6">
            <h1 className="text-xl font-semibold">英単語クイズ</h1>
            <p className="mt-3 text-zinc-700">問題データがありません。</p>
          </div>
        </div>
        <ToastQueue toasts={activeToasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileGameScreen
          world={worldProps}
          quiz={quizProps}
          result={resultProps}
          tiles={tileProps}
          dock={dockProps}
        />
      ) : (
        <DesktopGameScreen
          world={worldProps}
          quiz={quizProps}
          result={resultProps}
          typing={typingProps}
          dock={dockProps}
        />
      )}

      {/* 手持ち編成（取っ手から開く。PokemonBox 自体がモーダルとして出る） */}
      {shouldOpenDrawer && (
        <PokemonBox
          collection={monsterCollection}
          limit={BOX_LIMIT}
          forceManage={isBoxOverLimit}
          onClose={() => setIsDrawerOpen(false)}
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
          onOpenSync={() => setIsSyncOpen(true)}
        />
      )}

      {/* クラウド同期モーダル（モンスター管理画面の⚙️から開く） */}
      {isSyncOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950">クラウド同期</h2>
              <button
                type="button"
                onClick={() => setIsSyncOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-lg leading-none text-zinc-500 hover:bg-zinc-50"
                aria-label="close"
              >
                ×
              </button>
            </div>
            <SyncButton
              stats={stats}
              unlockedPoolSize={unlockedPoolSize}
              monsterCollection={monsterCollection}
              approvedAnswers={approvedAnswers}
              onMerged={handleSyncMerged}
            />
          </div>
        </div>
      )}

      <ToastQueue toasts={activeToasts} onDismiss={dismissToast} />
      <FossilChoiceModal group={fossilChoice} onSelect={handleFossilChoice} />
      {showStarterChoice && <StarterChoiceModal onSelect={handleStarterSelect} />}
    </>
  );
}
