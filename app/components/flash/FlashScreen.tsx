"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "../quiz/TiltCard";
import ModeTabs, { StudyMode } from "../ModeTabs";
import { speakEnglishWord, stopSpeaking } from "@/lib/speech";
import { pickFlashIndex } from "@/lib/flashWeight";
import { DIFFICULTY_ORDERED_INDICES } from "@/lib/vocab";
import { getUnlockedIndices } from "@/lib/vocabPool";
import { VocabItem, WordStat, PoolTier } from "@/lib/types";

export interface FlashScreenProps {
  vocabItems: VocabItem[];
  stats: WordStat[];
  unlockedPoolSize: number;
  totalWords: number;
  tier: PoolTier;
  streakDays: number;
  speedSeconds: number;
  mode: StudyMode;
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
  unlockedPoolSize,
  totalWords,
  tier,
  streakDays,
  speedSeconds,
  mode,
  onModeChange,
  onOpenSettings,
}: FlashScreenProps) {
  // 出題プールと同じ「難易度順の上位N語 ∪ 既に挑戦した語」を候補にする
  const candidates = useMemo(
    () => getUnlockedIndices(DIFFICULTY_ORDERED_INDICES, unlockedPoolSize, stats),
    [unlockedPoolSize, stats],
  );
  const [index, setIndex] = useState<number>(
    () => pickFlashIndex(candidates, stats, null) ?? candidates[0] ?? 0,
  );
  const [seenCount, setSeenCount] = useState<number>(1);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    if (isPaused) return undefined;
    const timer = window.setTimeout(() => {
      setIndex((current) => pickFlashIndex(candidates, stats, current) ?? current);
      setSeenCount((c) => c + 1);
    }, speedSeconds * 1000);
    return () => window.clearTimeout(timer);
  }, [index, isPaused, candidates, stats, speedSeconds]);

  const q = vocabItems[index];

  useEffect(() => {
    if (!q) return undefined;
    speakEnglishWord(q.target);
    return () => stopSpeaking();
  }, [index, q]);

  if (!q) return null;

  return (
    <div className="quiz-shell fantasy-shell relative flex h-dvh flex-col overflow-hidden bg-[#0a0a0a]">
      <div className="relative z-10 mx-auto flex h-full w-full max-w-2xl flex-col p-3">
        <header className="shrink-0">
          <div className="mb-1.5 flex justify-start">
            <ModeTabs mode={mode} onChange={onModeChange} />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-[#7d7d7d]">
            <div className="flex items-center gap-3">
              {streakDays > 0 && <span className="tabular-nums">連続 {streakDays} 日</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums" style={{ color: tier.color }}>
                {tier.label}
              </span>
              <span className="tabular-nums">
                {unlockedPoolSize} / {totalWords} 語
              </span>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="設定を開く"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#9a9a9a]/50 text-[#9a9a9a] transition hover:bg-white/5"
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
          <button
            type="button"
            onClick={() => setIsPaused((p) => !p)}
            aria-label={isPaused ? "再開する" : "一時停止する"}
            className="w-full"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TiltCard className="quest-card relative overflow-hidden rounded-lg px-5 py-8 text-center sm:py-12">
                  <div className="fantasy-title text-xs font-semibold tracking-[0.2em] text-[#ffcf4a]">
                    {q.partOfSpeech}
                  </div>
                  <div className="mt-1.5 break-words text-3xl font-bold tracking-tight text-[#f5f5f5] drop-shadow-[0_0_14px_rgba(255,255,255,0.5)] sm:text-5xl">
                    {q.target}
                  </div>
                  <div className="mt-4 break-words text-lg font-semibold text-[#9affc0] sm:text-2xl">
                    {q.answers[0]}
                  </div>
                </TiltCard>
              </motion.div>
            </AnimatePresence>
          </button>

          <div className="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
            <div
              key={index}
              className="h-full bg-[#58d0ff]"
              style={{
                animation: isPaused ? "none" : `flash-progress ${speedSeconds}s linear forwards`,
              }}
            />
          </div>

          <p className="mt-2 text-xs text-[#7d7d7d]">
            {isPaused ? "一時停止中（タップで再開）" : `見た単語 ${seenCount} 語（タップで一時停止）`}
          </p>
        </main>
      </div>
    </div>
  );
}
