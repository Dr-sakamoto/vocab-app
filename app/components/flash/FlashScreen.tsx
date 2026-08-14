"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ModeTabs, { StudyMode } from "../ModeTabs";
import { speakEnglishWord, stopSpeaking } from "@/lib/speech";
import { pickFlashIndex, filterMistakeIndices } from "@/lib/flashWeight";
import { VocabItem, WordStat, PoolTier } from "@/lib/types";

export interface FlashScreenProps {
  vocabItems: VocabItem[];
  stats: WordStat[];
  /** 出題対象の語（VOCAB_ITEMS の添字）。出題側と同じ配列を受け取る */
  unlockedIndices: number[];
  totalWords: number;
  tier: PoolTier;
  streakDays: number;
  speedSeconds: number;
  mode: StudyMode;
  /** true の場合、よく間違える語（苦手語）だけに絞って出題する */
  mistakeOnly?: boolean;
  onModeChange: (mode: StudyMode) => void;
  onOpenSettings: () => void;
}

/**
 * 高速フラッシュ表示。単語＋訳を固定ペースで自動送りし、
 * 未挑戦・定着未熟な単語ほど高頻度で見せる（インプット専用、採点なし）。
 * 解放済みプール（tier）限定。新規の永続データは持たない。
 */
export default function FlashScreen({
  vocabItems,
  stats,
  unlockedIndices,
  totalWords,
  tier,
  streakDays,
  speedSeconds,
  mode,
  mistakeOnly = false,
  onModeChange,
  onOpenSettings,
}: FlashScreenProps) {
  const candidates = mistakeOnly ? filterMistakeIndices(unlockedIndices, stats) : unlockedIndices;

  // プール内で何語ユニークに見たか、プールを何周したかもまとめて追跡する
  const [progress, setProgress] = useState<{ index: number; seen: Set<number>; lap: number }>(
    () => {
      const initialIndex = pickFlashIndex(candidates, stats, null) ?? candidates[0] ?? 0;
      return { index: initialIndex, seen: new Set([initialIndex]), lap: 1 };
    },
  );
  const { index, seen: seenIndices, lap } = progress;
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 解放プール自体が変わったら（レベルアップ等）周回カウントをやり直す
  const [poolSnapshot, setPoolSnapshot] = useState(candidates);
  if (candidates !== poolSnapshot) {
    setPoolSnapshot(candidates);
    setProgress((prev) => ({ index: prev.index, seen: new Set([prev.index]), lap: 1 }));
  }

  useEffect(() => {
    if (isPaused || candidates.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      setProgress((prev) => {
        const nextIndex = pickFlashIndex(candidates, stats, prev.index, prev.seen) ?? prev.index;
        const seen = prev.seen.has(nextIndex) ? prev.seen : new Set(prev.seen).add(nextIndex);
        if (candidates.length > 0 && seen.size >= candidates.length) {
          return { index: nextIndex, seen: new Set([nextIndex]), lap: prev.lap + 1 };
        }
        return { index: nextIndex, seen, lap: prev.lap };
      });
    }, speedSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [index, isPaused, candidates, stats, speedSeconds]);

  const q = candidates.length > 0 ? vocabItems[index] : undefined;

  useEffect(() => {
    if (!q) return undefined;
    speakEnglishWord(q.target);
    return () => stopSpeaking();
  }, [index, q]);

  return (
    <div className="quiz-shell app-shell relative flex h-dvh flex-col overflow-hidden">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col p-3">
        <header className="shrink-0">
          <div className="mb-1.5 flex justify-start">
            <ModeTabs mode={mode} onChange={onModeChange} />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
            <div className="flex items-center gap-3">
              {streakDays > 0 && <span className="tabular-nums">連続 {streakDays} 日</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums" style={{ color: tier.color }}>
                {tier.label}
              </span>
              <span className="tabular-nums">
                {candidates.length} / {totalWords} 語
              </span>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="設定を開く"
                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition hover:bg-surface-1 hover:text-ink-2"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center">
          {q ? (
            <>
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? "再開する" : "一時停止する"}
                className="w-full"
              >
                <div className="prompt-card relative px-5 py-8 text-center sm:py-12">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-[11px] tracking-[0.16em] text-ink-3">
                        {q.partOfSpeech}
                      </div>
                      <div className="mt-2 break-words font-word text-3xl tracking-[0.01em] text-ink-1 sm:text-5xl">
                        {q.target}
                      </div>
                      <div className="mt-4 break-words text-lg text-ink-2 sm:text-2xl">
                        {q.answers[0]}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </button>

              <div className="gauge-track mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full">
                <div
                  key={index}
                  className="h-full bg-accent"
                  style={{
                    animation: isPaused ? "none" : `flash-progress ${speedSeconds}s linear forwards`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-ink-3">
                {isPaused
                  ? "一時停止中（タップで再開）"
                  : `見た単語 ${seenIndices.size} / ${candidates.length} 語・プール内${lap}周目（タップで一時停止）`}
              </p>
            </>
          ) : (
            <div className="prompt-card px-5 py-8 text-center sm:py-12">
              <p className="text-ink-2">
                よく間違える単語はまだありません。
              </p>
              <p className="mt-2 text-xs text-ink-3">
                テストやフラッシュを進めると、間違えた語がここに出るようになります。
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
