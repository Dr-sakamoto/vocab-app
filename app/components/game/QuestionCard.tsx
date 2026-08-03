"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { speakEnglishWord, stopSpeaking } from "@/lib/speech";

export interface QuestionCardProps {
  /** 問題が変わるたびにフェードさせるためのキー */
  questionKey: number | string;
  partOfSpeech: string;
  word: string;
  /** スマホは余白を絞る */
  dense?: boolean;
  /** 未回答のときだけ表示する「わからない」ボタンの押下時 */
  onSkip?: () => void;
  skipDisabled?: boolean;
}

/**
 * 出題カード。英単語と品詞だけを見せる。
 *
 * 配色・演出の方針:
 * - 枠は固定し、単語だけがフェードで入れ替わる。カード自体が動くと
 *   いちばん読ませたい文字の周りで視線が奪われる。
 * - 単語に発光（drop-shadow）を掛けない。グローは字形のエッジを鈍らせ、
 *   未知語の綴りを読み取る妨げになる。
 * - 字間を詰めない。未知の綴りは「読む」より「解読する」作業に近く、
 *   詰まった字間は文字同士の混雑（crowding）で不利になる。
 * - 補助要素（品詞・読み上げ・わからない）はすべて無彩色。彩度を持つのは
 *   ユーザーが次に取るべき行動だけにする。
 */
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
    <div
      className={`prompt-card relative px-5 text-center ${
        dense ? "py-4" : "py-6 sm:py-9"
      }`}
    >
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={skipDisabled}
          aria-label="この問題をわからないとして次へ"
          className="absolute left-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-md text-xs text-ink-3 transition hover:bg-surface-2 hover:text-ink-2 disabled:opacity-40"
        >
          ?
        </button>
      )}
      <button
        type="button"
        onClick={() => speakEnglishWord(word)}
        aria-label="英単語を読み上げる"
        className="absolute right-2 top-2 z-30 flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink-2"
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
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" />
        </svg>
      </button>
      <motion.div
        key={questionKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative z-20"
      >
        <div className="text-[11px] tracking-[0.16em] text-ink-3">
          {partOfSpeech}
        </div>
        <div
          className={`mt-2 break-words font-word leading-tight tracking-[0.01em] text-ink-1 ${
            dense ? "text-3xl" : "text-3xl sm:text-5xl"
          }`}
        >
          {word}
        </div>
      </motion.div>
    </div>
  );
}
