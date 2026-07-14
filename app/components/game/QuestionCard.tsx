"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import TiltCard from "../quiz/TiltCard";
import { speakEnglishWord, stopSpeaking } from "@/lib/speech";

export interface QuestionCardProps {
  /** 問題が変わるたびにスライドインさせるためのキー */
  questionKey: number | string;
  partOfSpeech: string;
  word: string;
  /** スマホは余白を絞る */
  dense?: boolean;
  /** 未回答のときだけ表示する「わからない」ボタンの押下時 */
  onSkip?: () => void;
  skipDisabled?: boolean;
}

/** 出題カード。呪文書の1ページ風（ハイファンタジースキン） */
export default function QuestionCard({
  questionKey,
  partOfSpeech,
  word,
  dense = false,
  onSkip,
  skipDisabled = false,
}: QuestionCardProps) {
  // 問題が切り替わったら新しい単語を自動で読み上げ、次に切り替わる時に止める
  useEffect(() => {
    speakEnglishWord(word);
    return () => stopSpeaking();
  }, [questionKey, word]);

  return (
    <motion.div
      key={questionKey}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard
        className={`quest-card relative overflow-hidden rounded-lg px-5 text-center ${
          dense ? "py-4" : "py-6 sm:py-9"
        }`}
      >
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={skipDisabled}
            aria-label="この問題をわからないとして次へ"
            className="absolute left-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-sm border-2 border-[#ff5a5a] text-xs font-bold text-[#ff5a5a] transition hover:bg-[#ff5a5a]/15 disabled:opacity-40"
          >
            ?
          </button>
        )}
        <button
          type="button"
          onClick={() => speakEnglishWord(word)}
          aria-label="英単語を読み上げる"
          className="absolute right-2 top-2 z-30 flex h-6 w-6 items-center justify-center rounded-sm border-2 border-[#58d0ff] text-[#58d0ff] transition hover:bg-[#58d0ff]/15"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 9v6h4l5 4V5L8 9H4Z" />
            <path d="M16.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 6a8.5 8.5 0 0 1 0 12" />
          </svg>
        </button>
        <div className="relative z-20">
          <div className="fantasy-title text-xs font-semibold tracking-[0.2em] text-[#ffcf4a]">
            {partOfSpeech}
          </div>
          <div
            className={`mt-1.5 break-words font-bold tracking-tight text-[#f5f5f5] leading-tight drop-shadow-[0_0_14px_rgba(255,255,255,0.5)] ${
              dense ? "text-3xl" : "text-3xl sm:text-5xl"
            }`}
          >
            {word}
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
