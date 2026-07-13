"use client";

import { motion } from "framer-motion";
import TiltCard from "../quiz/TiltCard";

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
        <div className="relative z-20">
          <div className="fantasy-title text-xs font-semibold tracking-[0.2em] text-[#ffcf4a]">
            {partOfSpeech}
          </div>
          <div
            className={`mt-1.5 break-words font-bold tracking-tight text-[#61ff5f] leading-tight drop-shadow-[0_0_14px_rgba(97,255,95,0.5)] ${
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
