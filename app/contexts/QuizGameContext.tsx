"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { StudyMode } from "../components/ModeTabs";
import { useQuizSet } from "../hooks/useQuizSet";
import { useVocabPool } from "../hooks/useVocabPool";
import { useClickSound } from "../hooks/useClickSound";
import { getSoundVolume, setSoundVolume } from "@/lib/clickSound";
import {
  isPronunciationEnabled,
  setPronunciationEnabled,
  getPronunciationVolume,
  setPronunciationVolume,
  speakEnglishWord,
} from "@/lib/speech";
import { useVisualViewportVars } from "../hooks/useVisualViewport";
import { useCloudSync } from "../hooks/useCloudSync";

import { evaluatePlay } from "@/lib/playEvaluation";
import { applySetToStats, summarizeSet } from "@/lib/quizSet";
import { evaluateUnlockGate } from "@/lib/unlockGate";
import { getPoolTier } from "@/lib/poolTier";
import { VOCAB_ITEMS } from "@/lib/vocab";
import {
  buildStatsMapFromStoredProgress,
  hydrateStats,
  migrateApprovedAnswers,
  migrateRejectedAnswers,
} from "@/lib/wordProgress";
import { countRetained, countRetentionGain, countRetentionLevels } from "@/lib/retention";
import { GAME, STORAGE_KEYS, FLASH, SOUND } from "@/lib/constants";
import {
  EMPTY_STREAK,
  StreakState,
  getDisplayStreak,
  normalizeStreak,
  recordPlay,
  toDateKey,
} from "@/lib/streak";
import { WordStat, PlayEvaluation, SessionAnswer } from "@/lib/types";
import storage from "@/lib/storage";
import { StudyScreenProps } from "../components/game/StudyScreen";

const APPROVED_ANSWERS_KEY = "vocab-approved-answers";
const REJECTED_ANSWERS_KEY = "vocab-rejected-answers";

/**
 * 結果発表が出てから、Enterで次のセットへ進めるようになるまでの猶予。
 * 10問を Enter で送り続けた勢いのまま最後の1打が余ると、答案を一度も
 * 読まないまま次のセットへ飛んでしまう。
 */
const RESULT_ENTER_GRACE_MS = 700;

interface FlashProps {
  vocabItems: typeof VOCAB_ITEMS;
  stats: WordStat[];
  unlockedIndices: number[];
  totalWords: number;
  tier: ReturnType<typeof getPoolTier>;
  streakDays: number;
  speedSeconds: number;
  mode: StudyMode;
  mistakeOnly: boolean;
  mistakeThreshold: number;
  onModeChange: (mode: StudyMode) => void;
  onOpenSettings: () => void;
}

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  soundVolume: number;
  onSoundVolumeChange: (value: number) => void;
  pronunciationEnabled: boolean;
  onPronunciationToggle: () => void;
  pronunciationVolume: number;
  onPronunciationVolumeChange: (value: number) => void;
  flashSpeed: number;
  onFlashSpeedChange: (value: number) => void;
  mistakeThreshold: number;
  onMistakeThresholdChange: (value: number) => void;
  cloudSync: ReturnType<typeof useCloudSync>;
}

interface QuizGameContextValue {
  phase: "quiz" | "result";
  mode: StudyMode;
  vocabIsEmpty: boolean;
  flash: FlashProps;
  study: Omit<StudyScreenProps, "phase">;
  settings: SettingsProps;
}

const QuizGameContext = createContext<QuizGameContextValue | null>(null);

/**
 * クイズ本編の状態と、結果発表への遷移をまとめて持つプロバイダ。
 *
 * 10問を一枚の小テストとして出し、英単語を見て日本語訳をタイピングで答える。
 * 確定した回答はその場で裏の採点へ回り（完全一致で拾えない表記ゆれは
 * /api/check が形態素解析→AI判定まで1往復で確定させる）、正誤は10問ぶん
 * まとめて結果発表で見せる。採点の往復は次の問題を打つ時間と重なって消える。
 *
 * 結果発表は `/result` への画面遷移として見せる。状態はレイアウト直下の
 * この Provider に置いているので、遷移をまたいでも採点中の裏処理や
 * クラウド同期は途切れない。
 */
export function QuizGameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  /** 問題ウィンドウの中身。`/` が出題、`/result` が結果発表 */
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  /** いま入力中の設問。読み上げとスクロール追従の基準 */
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [stats, setStats] = useState<WordStat[]>(() =>
    VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })),
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [resultEvaluation, setResultEvaluation] = useState<PlayEvaluation | null>(null);
  /** 締めたセットの成績。結果発表と定着ドーナツはこれだけを見る */
  const [setAnswers, setSetAnswers] = useState<SessionAnswer[]>([]);
  const [setScore, setSetScore] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [soundVolume, setSoundVolumeState] = useState<number>(SOUND.DEFAULT_VOLUME);
  const [pronunciationEnabled, setPronunciationEnabledState] = useState<boolean>(true);
  const [pronunciationVolume, setPronunciationVolumeState] = useState<number>(1);
  const [mode, setMode] = useState<StudyMode>("test");
  const [flashSpeed, setFlashSpeedState] = useState<number>(FLASH.DEFAULT_SPEED_SEC);
  const [mistakeThreshold, setMistakeThresholdState] = useState<number>(
    FLASH.MISTAKE_THRESHOLD_DEFAULT,
  );
  const [isComposing, setIsComposing] = useState<boolean>(false);
  /** 同一セッションで連続プレイした回数。多いほどフロー係数が上がる */
  const [flowPlayCount, setFlowPlayCount] = useState<number>(1);

  /** 設問ごとの回答欄。Enter で次の設問へフォーカスを送るのに使う */
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const didLoadFromStorageRef = useRef<boolean>(false);
  const resultUnlockAppliedRef = useRef<boolean>(false);
  /** 結果発表が出た時刻。直後の余分なEnterで答案を飛ばさないために見る */
  const resultShownAtRef = useRef<number>(0);
  const correctSoundRef = useRef<HTMLAudioElement | null>(null);

  const [dailyStreak, setDailyStreak] = useState<StreakState>(EMPTY_STREAK);
  const [approvedAnswers, setApprovedAnswers] = useState<Record<string, string[]>>(() => {
    // 旧ID `w${i}` で保存されたキーもここで安定IDへ移行する
    try {
      return migrateApprovedAnswers(
        JSON.parse(localStorage.getItem(APPROVED_ANSWERS_KEY) ?? "{}"),
      );
    } catch { return {}; }
  });
  const [rejectedAnswers, setRejectedAnswers] = useState<Record<string, string[]>>(() => {
    try {
      return migrateRejectedAnswers(
        JSON.parse(localStorage.getItem(REJECTED_ANSWERS_KEY) ?? "{}"),
      );
    } catch { return {}; }
  });

  /** AIが認めた回答を記憶し、次回同じ回答をしたときのAI往復を省く */
  const addApprovedAnswer = useCallback((wordId: string, normalizedAnswer: string) => {
    setApprovedAnswers((prev) => {
      const existing = prev[wordId] ?? [];
      if (existing.includes(normalizedAnswer)) return prev;
      const next = { ...prev, [wordId]: [...existing, normalizedAnswer] };
      try { localStorage.setItem(APPROVED_ANSWERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  /** AIが不正解と判定した回答を記憶し、次回同じ誤答をしたときのAPI/AI往復を省く */
  const addRejectedAnswer = useCallback((wordId: string, normalizedAnswer: string) => {
    setRejectedAnswers((prev) => {
      const existing = prev[wordId] ?? [];
      if (existing.includes(normalizedAnswer)) return prev;
      const next = { ...prev, [wordId]: [...existing, normalizedAnswer] };
      try { localStorage.setItem(REJECTED_ANSWERS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const {
    unlockedPoolSize,
    setUnlockedPoolSize,
    unlockedIndices,
    unlockMore,
    lastUnlockCount,
    setLastUnlockCount,
    pickNextQuestionIndex,
  } = useVocabPool({ stats, vocabItemsLength: VOCAB_ITEMS.length });

  const {
    entries,
    setId,
    startSet,
    setInput,
    commit,
    nextUnanswered,
    answeredCount,
    allCommitted,
    allGraded,
  } = useQuizSet({
    approvedAnswers,
    rejectedAnswers,
    onAiApproved: addApprovedAnswer,
    onAiRejected: addRejectedAnswer,
  });

  // ── 音声 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    correctSoundRef.current = new Audio("/success.mp3");
    correctSoundRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (correctSoundRef.current) correctSoundRef.current.volume = soundVolume * 0.4;
  }, [soundVolume]);

  /**
   * 効果音は回答ごとには鳴らさない。1問ずつ鳴らすとそこで正誤が漏れて、
   * 結果発表まで伏せる意味が無くなる。プールが解放される出来にだけ鳴らす。
   */
  const playCorrectSound = useCallback(() => {
    const sound = correctSoundRef.current;
    if (!sound) return;
    sound.currentTime = 0;
    sound.play()?.catch?.((error) => {
      console.debug("Sound play error (ignoring):", error);
    });
  }, []);

  // プレイ開始時に「今日プレイした」ことを記録し、毎日ストリークを更新する。
  const markDailyPlay = useCallback(() => {
    setDailyStreak((prev) => {
      const next = recordPlay(prev, toDateKey(new Date()));
      if (next !== prev) storage.set(STORAGE_KEYS.STREAK, next);
      return next;
    });
  }, []);

  const handleSoundVolumeChange = useCallback((value: number) => {
    const clamped = Math.min(SOUND.MAX_VOLUME, Math.max(SOUND.MIN_VOLUME, value));
    setSoundVolume(clamped);
    setSoundVolumeState(clamped);
  }, []);

  const handlePronunciationVolumeChange = useCallback((value: number) => {
    const clamped = Math.min(SOUND.MAX_VOLUME, Math.max(SOUND.MIN_VOLUME, value));
    setPronunciationVolume(clamped);
    setPronunciationVolumeState(clamped);
  }, []);

  const handleFlashSpeedChange = useCallback((value: number) => {
    const clamped = Math.min(FLASH.MAX_SPEED_SEC, Math.max(FLASH.MIN_SPEED_SEC, value));
    setFlashSpeedState(clamped);
    storage.set(STORAGE_KEYS.FLASH_SPEED, clamped);
  }, []);

  const handleMistakeThresholdChange = useCallback((value: number) => {
    const clamped = Math.min(
      FLASH.MISTAKE_THRESHOLD_MAX,
      Math.max(FLASH.MISTAKE_THRESHOLD_MIN, Math.round(value)),
    );
    setMistakeThresholdState(clamped);
    storage.set(STORAGE_KEYS.MISTAKE_THRESHOLD, clamped);
  }, []);

  // フラッシュモードもストリーク対象の学習時間として扱う。フラッシュ画面は
  // `/` にしか無いので、結果発表（`/result`）から選んだときはそこへ戻す。
  const handleModeChange = useCallback((next: StudyMode) => {
    setMode(next);
    if (next === "flash" || next === "mistakeFlash") {
      markDailyPlay();
      if (pathname !== "/") router.push("/");
    }
  }, [markDailyPlay, pathname, router]);

  const focusSlot = useCallback((slot: number) => {
    inputRefs.current[slot]?.focus();
  }, []);

  // セットを組み直したら1問目の回答欄にカーソルを置く。
  // 読み上げはフォーカスに紐づいているので、ここで1問目が読み上げられる。
  useEffect(() => {
    if (phase !== "quiz" || setId === 0) return;
    focusSlot(0);
  }, [phase, setId, focusSlot]);

  // ── localStorage 復元 ──────────────────────────────────────────────────────
  useEffect(() => {
    // エフェクト本体で大量の setState を同期実行すると余分な再レンダーを招くため、
    // マイクロタスクへずらす。
    queueMicrotask(() => {
      try {
        setSoundVolumeState(getSoundVolume());
        setPronunciationEnabledState(isPronunciationEnabled());
        setPronunciationVolumeState(getPronunciationVolume());
        setDailyStreak(normalizeStreak(storage.get(STORAGE_KEYS.STREAK, EMPTY_STREAK)));

        const savedSpeed = Number(
          storage.get(STORAGE_KEYS.FLASH_SPEED, FLASH.DEFAULT_SPEED_SEC),
        );
        if (Number.isFinite(savedSpeed)) {
          setFlashSpeedState(
            Math.min(FLASH.MAX_SPEED_SEC, Math.max(FLASH.MIN_SPEED_SEC, savedSpeed)),
          );
        }

        const savedThreshold = Number(
          storage.get(STORAGE_KEYS.MISTAKE_THRESHOLD, FLASH.MISTAKE_THRESHOLD_DEFAULT),
        );
        if (Number.isFinite(savedThreshold)) {
          setMistakeThresholdState(
            Math.min(
              FLASH.MISTAKE_THRESHOLD_MAX,
              Math.max(FLASH.MISTAKE_THRESHOLD_MIN, Math.round(savedThreshold)),
            ),
          );
        }

        const savedPool = Number(storage.get(STORAGE_KEYS.POOL_SIZE, null));
        if (Number.isFinite(savedPool) && savedPool > 0) {
          setUnlockedPoolSize(
            Math.max(
              Math.min(GAME.INITIAL_POOL_SIZE, VOCAB_ITEMS.length),
              Math.min(Math.floor(savedPool), VOCAB_ITEMS.length),
            ),
          );
        }

        // 単語進捗。旧ID `w${i}` で保存されたレコードは安定IDへ移行する
        const parsed = storage.get<unknown[] | null>(STORAGE_KEYS.PROGRESS, null);
        if (parsed && Array.isArray(parsed)) {
          const map = buildStatsMapFromStoredProgress(parsed, VOCAB_ITEMS);
          setStats((prev) => hydrateStats(VOCAB_ITEMS, map, prev));
        }
      } catch {
        /* ignore */
      } finally {
        didLoadFromStorageRef.current = true;
        setIsLoaded(true);
      }
    });
  }, [setUnlockedPoolSize]);

  /**
   * 1セットぶん（10問）をまとめて抽選する。
   *
   * 1問ずつ出していた頃は「直前の1語」だけを次の抽選から外していた。
   * まとめて出すいまは、直前のセットで正解した語を外す（`excluded`）。
   * 答えを見たばかりの語をそのまま次のセットへ出しても想起の負荷にならない。
   * 落とした語は外さない——間隔反復の0日目に当たり、すぐ出し直すほうがよい。
   */
  const pickSet = useCallback(
    (excluded: number[], accuracy: number) => {
      const seen = new Set<number>(excluded);
      const picked: number[] = [];
      for (let i = 0; i < GAME.PLAY_LIMIT; i += 1) {
        const nextIndex = pickNextQuestionIndex(null, seen, accuracy);
        if (nextIndex === null) break;
        seen.add(nextIndex);
        picked.push(nextIndex);
      }
      return picked.map((poolIndex) => ({ poolIndex, item: VOCAB_ITEMS[poolIndex] }));
    },
    [pickNextQuestionIndex],
  );

  // 復元完了後に最初のセットを組む（復元された stats・プールを反映した抽選にする）
  const didInitQuestionRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isLoaded || didInitQuestionRef.current) return;
    didInitQuestionRef.current = true;
    startSet(pickSet([], 1.0));
    markDailyPlay();
  }, [isLoaded, pickSet, startSet, markDailyPlay]);

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
        // 分散学習の状態。まだ解答していない語では undefined になり、
        // JSON.stringify がキーごと落とすので保存量は増えない。
        lastAnswered: stats[i]?.lastAnswered,
        correctStreak: stats[i]?.correctStreak,
      })),
    );
  }, [stats]);

  useEffect(() => {
    if (!didLoadFromStorageRef.current) return;
    storage.set(STORAGE_KEYS.POOL_SIZE, unlockedPoolSize);
  }, [unlockedPoolSize]);

  // ── 10問セットの締め（評価 + 統計反映 + プール解放）─────────────────────
  /**
   * 全問の採点が返ってから一度だけ走る。10問ぶんの正誤をまとめて
   * 統計へ畳み込み、そこで初めて結果を表に出す。
   */
  const finishSet = useCallback(() => {
    if (resultUnlockAppliedRef.current) return;
    resultUnlockAppliedRef.current = true;

    const { answers, score, bestStreak } = summarizeSet(entries, stats);

    // 正誤カウントに加えて分散学習の状態（最終解答時刻・連続正解数）も更新する
    setStats((prevStats) => applySetToStats(entries, prevStats));

    setSetAnswers(answers);
    setSetScore(score);
    setResultEvaluation(
      evaluatePlay({
        answers,
        score,
        playLimit: GAME.PLAY_LIMIT,
        bestStreak,
        unlockedPoolSize,
        playCount: flowPlayCount,
      }),
    );

    // 定着ドーナツの分布が条件を満たしていれば出題プールを解放する。
    // 見るのはこの10問の出来ではなくプール全体の分布なので、判定には
    // このセットを畳み込んだあとの統計を使う（そうしないと1セット遅れる）。
    // 解放しても出題対象の集合そのものは変わらない（挑戦済みの語は
    // すでにプールに入っている）ので、分布は unlockedIndices で数えてよい。
    const { step } = evaluateUnlockGate(
      countRetentionLevels(unlockedIndices, applySetToStats(entries, stats)),
    );

    unlockMore(step);
    if (step > 0) playCorrectSound();

    resultShownAtRef.current = Date.now();
    setPhase("result");
    router.push("/result");
  }, [
    entries,
    stats,
    flowPlayCount,
    playCorrectSound,
    unlockMore,
    unlockedIndices,
    unlockedPoolSize,
    router,
  ]);

  // 全問確定して採点も出そろったら、そのまま結果発表へ移る。
  // ここに「採点する」ボタンは置かない（押させるだけの割り込みになる）。
  useEffect(() => {
    if (phase !== "quiz" || !allGraded) return;
    finishSet();
  }, [phase, allGraded, finishSet]);

  // ── 回答の確定 ─────────────────────────────────────────────────────────────
  /**
   * 回答を確定して次の未回答へ送る。採点は裏で走り、結果は待たない。
   * 空欄のまま送ってもよい（＝わからない）。未回答として不正解に数える。
   */
  const submitSlot = useCallback((slot: number) => {
    commit(slot);
    const next = nextUnanswered(slot);
    if (next === null) {
      // 最後の1問。キーボードを閉じて採点の締めに任せる
      inputRefs.current[slot]?.blur();
      return;
    }
    focusSlot(next);
  }, [commit, nextUnanswered, focusSlot]);

  /** 回答欄にカーソルが入ったら、その設問を読み上げる */
  const handleFocusSlot = useCallback((slot: number) => {
    setActiveSlot(slot);
    if (phase !== "quiz") return;
    const entry = entries[slot];
    if (!entry) return;
    const { target, collocation } = entry.item;
    speakEnglishWord(collocation ? `${target} ${collocation}` : target);
  }, [entries, phase]);

  /** リザルトから次の10問セットへ。出題画面（`/`）へ遷移して中身を入れ替える */
  const continueToNextSet = useCallback(() => {
    markDailyPlay();
    setFlowPlayCount((count) => count + 1);
    setResultEvaluation(null);
    setSetAnswers([]);
    setSetScore(0);
    setActiveSlot(0);

    const solved = entries
      .filter((entry) => entry.outcome?.correct)
      .map((entry) => entry.poolIndex);
    const accuracy = entries.length > 0 ? setScore / entries.length : 1;
    startSet(pickSet(solved, accuracy));

    setLastUnlockCount(0);
    resultUnlockAppliedRef.current = false;
    setPhase("quiz");
    router.push("/");
  }, [
    entries,
    setScore,
    markDailyPlay,
    pickSet,
    startSet,
    setLastUnlockCount,
    router,
  ]);

  // `/result` への直接アクセスや再読み込みでは結果データを持っていないため、
  // 出題画面へ戻す（結果は状態にしか無く、URLだけでは復元できない）。
  useEffect(() => {
    if (pathname === "/result" && phase !== "result") {
      router.replace("/");
    }
  }, [pathname, phase, router]);

  // PCで答案からフォーカスが外れていてもEnterで戻れるようにする。
  // クリックでフォーカスが外れた状態や、リザルト画面（次のセットへ）でも
  // Enterキーが効かないと操作が止まってしまうため、キー入力はウィンドウ全体で拾う。
  useEffect(() => {
    if (mode !== "test" || isSettingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || isComposing) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("button")) return;

      if (phase === "result") {
        // 回答を送り終えた勢いで余ったEnterでは進めない
        if (Date.now() - resultShownAtRef.current < RESULT_ENTER_GRACE_MS) return;
        continueToNextSet();
        return;
      }
      // 回答欄の中のEnterは行側（TypingAnswerRow）が確定として処理する
      if (target?.closest?.("[data-quiz-answer]")) return;
      const slot = nextUnanswered(activeSlot - 1);
      if (slot !== null) focusSlot(slot);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    mode,
    isSettingsOpen,
    isComposing,
    phase,
    activeSlot,
    nextUnanswered,
    focusSlot,
    continueToNextSet,
  ]);

  const handleSyncMerged = useCallback(
    (merged: {
      stats: WordStat[];
      unlockedPoolSize: number;
      approvedAnswers: Record<string, string[]>;
      rejectedAnswers: Record<string, string[]>;
      dailyStreak: StreakState;
    }) => {
      setStats(merged.stats);
      setUnlockedPoolSize(merged.unlockedPoolSize);
      setApprovedAnswers(merged.approvedAnswers);
      setRejectedAnswers(merged.rejectedAnswers);
      setDailyStreak(merged.dailyStreak);
      storage.set(STORAGE_KEYS.STREAK, merged.dailyStreak);
      try {
        localStorage.setItem(
          APPROVED_ANSWERS_KEY,
          JSON.stringify(merged.approvedAnswers),
        );
        localStorage.setItem(
          REJECTED_ANSWERS_KEY,
          JSON.stringify(merged.rejectedAnswers),
        );
      } catch {}
    },
    [setUnlockedPoolSize],
  );

  const cloudSync = useCloudSync({
    stats,
    unlockedPoolSize,
    approvedAnswers,
    rejectedAnswers,
    dailyStreak,
    isReady: isLoaded,
    onMerged: handleSyncMerged,
  });
  const { syncAuto } = cloudSync;

  // 10問セットの区切りで裏側から同期する。設定を開かなくても、
  // 別の端末を開いた時点で最新の進捗が乗っている状態にする。
  // 画面遷移を挟んでも待ち時間は挟まないので、コアループは止まらない。
  useEffect(() => {
    if (phase !== "result") return;
    syncAuto();
  }, [phase, syncAuto]);

  // 全ボタン共通のクリック音
  useClickSound();

  // モバイルのキーボード表示に合わせて画面を視覚ビューポートに収める
  useVisualViewportVars();

  const currentTier = useMemo(() => getPoolTier(unlockedPoolSize), [unlockedPoolSize]);

  /**
   * 定着ドーナツの中身。新しい保存データは持たず、既存の correct/wrong 統計と
   * そのセットの回答だけから出す（＝同期済みのデータだけで完結する）。
   */
  const retention = useMemo(
    () => ({
      retained: countRetained(unlockedIndices, stats),
      poolSize: unlockedIndices.length,
      gain: countRetentionGain(setAnswers),
      levelCounts: countRetentionLevels(unlockedIndices, stats),
      totalWords: VOCAB_ITEMS.length,
    }),
    [unlockedIndices, stats, setAnswers],
  );
  const displayStreak = getDisplayStreak(dailyStreak, toDateKey(new Date()));
  const setSize = entries.length || GAME.PLAY_LIMIT;
  const progressPct =
    phase === "result"
      ? 100
      : Math.max(0, Math.min(100, (answeredCount / setSize) * 100));

  const registerInput = useCallback((slot: number, element: HTMLInputElement | null) => {
    inputRefs.current[slot] = element;
  }, []);

  const onOpenSettings = useCallback(() => setIsSettingsOpen(true), []);

  const value = useMemo<QuizGameContextValue>(
    () => ({
      phase,
      mode,
      vocabIsEmpty: VOCAB_ITEMS.length === 0,
      flash: {
        vocabItems: VOCAB_ITEMS,
        stats,
        unlockedIndices,
        totalWords: VOCAB_ITEMS.length,
        tier: currentTier,
        streakDays: displayStreak,
        speedSeconds: flashSpeed,
        mode,
        mistakeOnly: mode === "mistakeFlash",
        mistakeThreshold,
        onModeChange: handleModeChange,
        onOpenSettings,
      },
      study: {
        mode,
        onModeChange: handleModeChange,
        status: {
          answered: answeredCount,
          setSize,
          score: setScore,
          progressPct,
          streakDays: displayStreak,
          unlockedWordCount: unlockedIndices.length,
          totalWords: VOCAB_ITEMS.length,
          tier: currentTier,
        },
        sheet: {
          entries,
          revealed: phase === "result",
          activeSlot,
          isComposing,
          onInputChange: setInput,
          onSubmitSlot: submitSlot,
          onFocusSlot: handleFocusSlot,
          onCompositionStart: () => setIsComposing(true),
          onCompositionEnd: () => setIsComposing(false),
          registerInput,
        },
        isGrading: allCommitted && !allGraded,
        result: {
          evaluation: resultEvaluation,
          unlockedThisRun: lastUnlockCount,
          retention,
          // 落とした語がある回は読ませる。読んでいる途中で次のセットへ
          // 切り替わるほうが割り込みになる
          autoContinue: setScore >= setSize,
          onContinue: continueToNextSet,
        },
        onOpenSettings,
      },
      settings: {
        isOpen: isSettingsOpen,
        onClose: () => setIsSettingsOpen(false),
        soundVolume,
        onSoundVolumeChange: handleSoundVolumeChange,
        pronunciationEnabled,
        onPronunciationToggle: () => {
          const nextEnabled = !pronunciationEnabled;
          setPronunciationEnabled(nextEnabled);
          setPronunciationEnabledState(nextEnabled);
        },
        pronunciationVolume,
        onPronunciationVolumeChange: handlePronunciationVolumeChange,
        flashSpeed,
        onFlashSpeedChange: handleFlashSpeedChange,
        mistakeThreshold,
        onMistakeThresholdChange: handleMistakeThresholdChange,
        cloudSync,
      },
    }),
    [
      phase,
      mode,
      stats,
      unlockedIndices,
      currentTier,
      displayStreak,
      flashSpeed,
      mistakeThreshold,
      handleModeChange,
      onOpenSettings,
      answeredCount,
      setSize,
      setScore,
      progressPct,
      entries,
      activeSlot,
      isComposing,
      setInput,
      submitSlot,
      handleFocusSlot,
      registerInput,
      allCommitted,
      allGraded,
      resultEvaluation,
      lastUnlockCount,
      retention,
      continueToNextSet,
      isSettingsOpen,
      soundVolume,
      handleSoundVolumeChange,
      pronunciationEnabled,
      pronunciationVolume,
      handlePronunciationVolumeChange,
      handleFlashSpeedChange,
      handleMistakeThresholdChange,
      cloudSync,
    ],
  );

  return <QuizGameContext.Provider value={value}>{children}</QuizGameContext.Provider>;
}

export function useQuizGame(): QuizGameContextValue {
  const ctx = useContext(QuizGameContext);
  if (!ctx) throw new Error("useQuizGame must be used within QuizGameProvider");
  return ctx;
}
