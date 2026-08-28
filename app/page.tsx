"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StudyScreen from "./components/game/StudyScreen";
import FlashScreen from "./components/flash/FlashScreen";
import { StudyMode } from "./components/ModeTabs";
import SyncButton from "./components/SyncButton";
import { useGameSession } from "./hooks/useGameSession";
import { useVocabPool } from "./hooks/useVocabPool";
import { useClickSound } from "./hooks/useClickSound";
import { isSoundEnabled, setSoundEnabled } from "@/lib/clickSound";
import { isPronunciationEnabled, setPronunciationEnabled } from "@/lib/speech";
import { useVisualViewportVars } from "./hooks/useVisualViewport";

import { evaluatePlay } from "@/lib/playEvaluation";
import { getPoolTier } from "@/lib/poolTier";
import { VOCAB_ITEMS } from "@/lib/vocab";
import {
  buildStatsMapFromStoredProgress,
  hydrateStats,
  migrateApprovedAnswers,
  migrateRejectedAnswers,
} from "@/lib/wordProgress";
import { GAME, STORAGE_KEYS, FLASH } from "@/lib/constants";
import {
  EMPTY_STREAK,
  StreakState,
  getDisplayStreak,
  normalizeStreak,
  recordPlay,
  toDateKey,
} from "@/lib/streak";
import { WordStat, PlayEvaluation, VocabItem } from "@/lib/types";
import storage from "@/lib/storage";

const APPROVED_ANSWERS_KEY = "vocab-approved-answers";
const REJECTED_ANSWERS_KEY = "vocab-rejected-answers";

function getPartOfSpeech(q: VocabItem | undefined): string {
  return q?.partOfSpeech ?? "word";
}

/**
 * 単一画面の暗記アプリ。
 *
 * 英単語を見て日本語訳をタイピングで答える。完全一致で拾えない表記ゆれは
 * /api/check が形態素解析→AI判定まで1往復で確定させる。10問ごとにその場で
 * リザルトへ中身が入れ替わり、続けて次のセットへ流れる。画面遷移は存在しない。
 */
export default function Page() {
  /** 問題ウィンドウの中身。ページ遷移ではなくブロック内の入れ替え */
  const [phase, setPhase] = useState<"quiz" | "result">("quiz");
  const [index, setIndex] = useState<number>(0);
  const [stats, setStats] = useState<WordStat[]>(() =>
    VOCAB_ITEMS.map(() => ({ correct: 0, wrong: 0 })),
  );
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [resultEvaluation, setResultEvaluation] = useState<PlayEvaluation | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);
  const [pronunciationEnabled, setPronunciationEnabledState] = useState<boolean>(true);
  const [mode, setMode] = useState<StudyMode>("test");
  const [flashSpeed, setFlashSpeedState] = useState<number>(FLASH.DEFAULT_SPEED_SEC);
  const [mistakeThreshold, setMistakeThresholdState] = useState<number>(
    FLASH.MISTAKE_THRESHOLD_DEFAULT,
  );
  const [isComposing, setIsComposing] = useState<boolean>(false);
  /** 同一セッションで連続プレイした回数。多いほどフロー係数が上がる */
  const [flowPlayCount, setFlowPlayCount] = useState<number>(1);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const seenInPlayRef = useRef<Set<number> | null>(null);
  const didLoadFromStorageRef = useRef<boolean>(false);
  const resultUnlockAppliedRef = useRef<boolean>(false);
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
  const q = VOCAB_ITEMS[index];

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
    score,
    total,
    setTotal,
    bestStreak,
    sessionAnswers: gameSessionAnswers,
    input,
    setInput,
    checked,
    isCorrect,
    answerStatus,
    isCheckingAnswer,
    checkAnswer,
    giveUp,
    resetSession,
    prepareNextQuestion,
    normalizedAnswers,
    posViolation,
    aiFeedback,
  } = useGameSession({
    q,
    index,
    activeView: phase === "result" ? "result" : "study",
    stats,
    setStats,
    approvedAnswers,
    rejectedAnswers,
    onAiApproved: addApprovedAnswer,
    onAiRejected: addRejectedAnswer,
  });

  // ── 音声 ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    correctSoundRef.current = new Audio("/success.mp3");
    correctSoundRef.current.volume = 0.4;
    correctSoundRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!checked || !isCorrect || !correctSoundRef.current) return;
    correctSoundRef.current.currentTime = 0;
    correctSoundRef.current.play()?.catch?.((error) => {
      console.debug("Sound play error (ignoring):", error);
    });
  }, [checked, isCorrect]);

  // プレイ開始時に「今日プレイした」ことを記録し、毎日ストリークを更新する。
  const markDailyPlay = useCallback(() => {
    setDailyStreak((prev) => {
      const next = recordPlay(prev, toDateKey(new Date()));
      if (next !== prev) storage.set(STORAGE_KEYS.STREAK, next);
      return next;
    });
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

  // フラッシュモードもストリーク対象の学習時間として扱う
  const handleModeChange = useCallback((next: StudyMode) => {
    setMode(next);
    if (next === "flash" || next === "mistakeFlash") markDailyPlay();
  }, [markDailyPlay]);

  // 回答欄は常にフォーカスしておく。IMEをすぐ打ち始められる状態を保つ。
  useEffect(() => {
    if (phase !== "quiz" || isCheckingAnswer) return;
    inputRef.current?.focus();
  }, [phase, checked, index, isCheckingAnswer]);

  // ── localStorage 復元 ──────────────────────────────────────────────────────
  useEffect(() => {
    // エフェクト本体で大量の setState を同期実行すると余分な再レンダーを招くため、
    // マイクロタスクへずらす。
    queueMicrotask(() => {
      try {
        setSoundEnabledState(isSoundEnabled());
        setPronunciationEnabledState(isPronunciationEnabled());
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

  // 復元完了後に最初の問題を選ぶ（復元された stats・プールを反映した抽選にする）
  const didInitQuestionRef = useRef<boolean>(false);
  useEffect(() => {
    if (!isLoaded || didInitQuestionRef.current) return;
    didInitQuestionRef.current = true;
    const newIndex = pickNextQuestionIndex(null, new Set(), 1.0) ?? 0;
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

  // ── 10問区切りの締め（評価 + プール解放）───────────────────────────────────
  const finishSet = useCallback(() => {
    if (resultUnlockAppliedRef.current) return;
    resultUnlockAppliedRef.current = true;

    setResultEvaluation(
      evaluatePlay({
        answers: gameSessionAnswers,
        score,
        playLimit: GAME.PLAY_LIMIT,
        bestStreak,
        unlockedPoolSize,
        playCount: flowPlayCount,
      }),
    );

    // 正答率に応じて出題プールを解放する
    const accuracy = score / GAME.PLAY_LIMIT;
    let step = 0;
    if (accuracy >= 1) step = GAME.PERFECT_UNLOCK_STEP;
    else if (accuracy >= GAME.UNLOCK_ACCURACY) step = GAME.UNLOCK_STEP;

    unlockMore(step);

    setPhase("result");
  }, [
    bestStreak,
    flowPlayCount,
    gameSessionAnswers,
    score,
    unlockMore,
    unlockedPoolSize,
  ]);

  // ── 次へ ───────────────────────────────────────────────────────────────────
  const advanceQuestion = useCallback((answeredCount: number) => {
    if (total >= GAME.PLAY_LIMIT) {
      finishSet();
      return;
    }

    setTotal((t) => t + 1);
    const seenInPlay = seenInPlayRef.current ?? new Set<number>([index]);
    seenInPlayRef.current = seenInPlay;
    const currentSessionAccuracy = answeredCount <= 0 ? 1 : score / answeredCount;
    const nextIndex = pickNextQuestionIndex(index, seenInPlay, currentSessionAccuracy);
    if (nextIndex === null) {
      finishSet();
      return;
    }
    seenInPlay.add(nextIndex);
    setIndex(nextIndex);
    prepareNextQuestion();
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

  /** リザルトから次の10問セットへ。画面はそのまま、中身だけ入れ替える */
  const continueToNextSet = useCallback(() => {
    markDailyPlay();
    setFlowPlayCount((count) => count + 1);
    resetSession();
    setResultEvaluation(null);
    // 直前のセットで最後に出した単語（＝直近正解したばかりの単語）を
    // 次セットの1問目から除外する
    const newIndex = pickNextQuestionIndex(index, new Set([index]), 1.0) ?? 0;
    setIndex(newIndex);
    seenInPlayRef.current = new Set([newIndex]);
    setLastUnlockCount(0);
    resultUnlockAppliedRef.current = false;
    setPhase("quiz");
  }, [
    index,
    markDailyPlay,
    pickNextQuestionIndex,
    resetSession,
    setLastUnlockCount,
  ]);

  const handleSyncMerged = useCallback(
    (merged: {
      stats: WordStat[];
      unlockedPoolSize: number;
      approvedAnswers: Record<string, string[]>;
      rejectedAnswers: Record<string, string[]>;
    }) => {
      setStats(merged.stats);
      setUnlockedPoolSize(merged.unlockedPoolSize);
      setApprovedAnswers(merged.approvedAnswers);
      setRejectedAnswers(merged.rejectedAnswers);
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

  // 全ボタン共通のクリック音
  useClickSound();

  // モバイルのキーボード表示に合わせて画面を視覚ビューポートに収める
  useVisualViewportVars();

  const currentTier = useMemo(() => getPoolTier(unlockedPoolSize), [unlockedPoolSize]);
  const displayStreak = getDisplayStreak(dailyStreak, toDateKey(new Date()));
  const progressPct = Math.max(0, Math.min(100, (total / GAME.PLAY_LIMIT) * 100));

  if (!q) {
    return (
      <div className="app-shell flex min-h-screen items-center justify-center p-6">
        <div className="prompt-card w-full max-w-xl p-6">
          <h1 className="text-xl text-ink-1">英単語クイズ</h1>
          <p className="mt-3 text-ink-2">問題データがありません。</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {mode === "flash" || mode === "mistakeFlash" ? (
        <FlashScreen
          vocabItems={VOCAB_ITEMS}
          stats={stats}
          unlockedIndices={unlockedIndices}
          totalWords={VOCAB_ITEMS.length}
          tier={currentTier}
          streakDays={displayStreak}
          speedSeconds={flashSpeed}
          mode={mode}
          mistakeOnly={mode === "mistakeFlash"}
          mistakeThreshold={mistakeThreshold}
          onModeChange={handleModeChange}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      ) : (
        <StudyScreen
          phase={phase}
          mode={mode}
          onModeChange={handleModeChange}
          status={{
            score,
            total,
            playLimit: GAME.PLAY_LIMIT,
            progressPct,
            streakDays: displayStreak,
            unlockedWordCount: unlockedIndices.length,
            totalWords: VOCAB_ITEMS.length,
            tier: currentTier,
          }}
          question={{
            questionKey: index,
            partOfSpeech: getPartOfSpeech(q),
            word: q.target,
            onSkip: checked ? undefined : giveUp,
            skipDisabled: isCheckingAnswer,
          }}
          typing={{
            inputRef,
            input,
            onInputChange: setInput,
            onCompositionStart: () => setIsComposing(true),
            onCompositionEnd: () => setIsComposing(false),
            isComposing,
            checked,
            isCorrect,
            answerStatus,
            isCheckingAnswer,
            normalizedAnswers,
            posViolation,
            aiFeedback,
            onCheck: () => checkAnswer(),
            onNext: next,
          }}
          result={{
            evaluation: resultEvaluation,
            unlockedThisRun: lastUnlockCount,
            onContinue: continueToNextSet,
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface-1 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base text-ink-1">設定</h2>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg leading-none text-ink-3 transition hover:bg-surface-2 hover:text-ink-1"
                aria-label="close"
              >
                ×
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
              <span className="text-sm text-ink-1">効果音</span>
              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                aria-label="効果音のオン・オフ"
                onClick={() => {
                  const nextEnabled = !soundEnabled;
                  setSoundEnabled(nextEnabled);
                  setSoundEnabledState(nextEnabled);
                }}
                className={[
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                  soundEnabled ? "bg-accent" : "bg-line-strong",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    soundEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between rounded-xl border border-line px-3 py-2.5">
              <span className="text-sm text-ink-1">発音</span>
              <button
                type="button"
                role="switch"
                aria-checked={pronunciationEnabled}
                aria-label="英語の発音読み上げのオン・オフ"
                onClick={() => {
                  const nextEnabled = !pronunciationEnabled;
                  setPronunciationEnabled(nextEnabled);
                  setPronunciationEnabledState(nextEnabled);
                }}
                className={[
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                  pronunciationEnabled ? "bg-accent" : "bg-line-strong",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    pronunciationEnabled ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink-1">フラッシュ速度</span>
                <span className="text-xs tabular-nums text-ink-3">
                  {flashSpeed.toFixed(1)}秒 / 語
                </span>
              </div>
              <input
                type="range"
                min={FLASH.MIN_SPEED_SEC}
                max={FLASH.MAX_SPEED_SEC}
                step={0.1}
                value={flashSpeed}
                onChange={(e) => handleFlashSpeedChange(Number(e.target.value))}
                aria-label="フラッシュ速度（秒/語）"
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div className="mb-4 rounded-xl border border-line px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-ink-1">苦手フラッシュの苦手度</span>
                <span className="text-xs tabular-nums text-ink-3">
                  {mistakeThreshold}回以上
                </span>
              </div>
              <input
                type="range"
                min={FLASH.MISTAKE_THRESHOLD_MIN}
                max={FLASH.MISTAKE_THRESHOLD_MAX}
                step={1}
                value={mistakeThreshold}
                onChange={(e) => handleMistakeThresholdChange(Number(e.target.value))}
                aria-label="苦手フラッシュの苦手度（間違えた回数のしきい値）"
                className="w-full accent-[var(--accent)]"
              />
              <p className="mt-1.5 text-[11px] text-ink-3">
                下げるほど、少し間違えただけの語も苦手フラッシュの対象に入る。
                誤答の2倍以上正解できた語は、回数に関わらず卒業して対象から外れる
              </p>
            </div>

            <h3 className="mb-2 text-sm text-ink-2">クラウド同期</h3>
            <SyncButton
              stats={stats}
              unlockedPoolSize={unlockedPoolSize}
              approvedAnswers={approvedAnswers}
              rejectedAnswers={rejectedAnswers}
              onMerged={handleSyncMerged}
            />
          </div>
        </div>
      )}
    </>
  );
}
