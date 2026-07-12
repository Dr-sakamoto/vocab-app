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
}

/** 出題カード。呪文書の1ページ風（ハイファンタジースキン） */
export default function QuestionCard({
  questionKey,
  partOfSpeech,
  word,
  dense = false,
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
        <div className="relative z-20">
          <div className="fantasy-title text-xs font-semibold tracking-[0.2em] text-[#b08d3c]">
            {partOfSpeech}
          </div>
          <div
            className={`mt-1.5 break-words font-bold tracking-tight text-[#f3e3b5] leading-tight drop-shadow-[0_0_18px_rgba(176,141,60,0.45)] ${
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
