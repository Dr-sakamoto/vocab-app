"use client";

import { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface TypingAnswerRowProps {
  inputRef: RefObject<HTMLInputElement | null>;
  input: string;
  onInputChange: (value: string) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  /** IME変換中はEnterで判定しないため、親が合成状態を握る */
  isComposing: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  checked: boolean;
  isCorrect: boolean;
  answerStatus: string | null;
  isCheckingAnswer: boolean;
  normalizedAnswers: string[];
  posViolation: string | null;
  /** AIが不正解と判断したときの短い理由 */
  aiFeedback: string | null;
  onCheck: () => void;
  onNext: () => void;
}

/**
 * タイピング回答行。日本語IMEで自由記述し、答え合わせ/次への操作は
 * 入力欄右端の⏎/→アイコンに織り込む（ボタンへ視線を外さないため）。
 *
 * 表記ゆれのAI判定は答え合わせの1往復に含めてサーバー側で完結させる。
 * ここに「AIに判定してもらう」ボタンは置かない（正解しているのに
 * ボタンを押させる割り込みがコアループに入るため）。
 */
export default function TypingAnswerRow({
  inputRef,
  input,
  onInputChange,
  onCompositionStart,
  onCompositionEnd,
  isComposing,
  onFocus,
  onBlur,
  checked,
  isCorrect,
  answerStatus,
  isCheckingAnswer,
  normalizedAnswers,
  posViolation,
  aiFeedback,
  onCheck,
  onNext,
}: TypingAnswerRowProps) {
  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="日本語訳を入力..."
          aria-label="日本語訳を入力してください"
          className="w-full rounded-lg border-2 border-[#9a9a9a] bg-[#0a0a0a] py-3.5 pl-4 pr-16 text-base text-[#e6e6e6] outline-none transition-all placeholder:text-[#7d7d7d] focus:border-[#f5f5f5] focus:shadow-[0_0_12px_rgba(255,255,255,0.35)] disabled:opacity-50"
          onKeyDown={(e) => {
            if (isComposing) return;
            if (e.key !== "Enter") return;
            if (checked) onNext();
            else onCheck();
          }}
        />
        <button
          type="button"
          onClick={checked ? onNext : onCheck}
          disabled={isCheckingAnswer}
          aria-label={checked ? "次の問題へ" : "答え合わせ"}
          className="brass-btn absolute inset-y-1.5 right-1.5 flex w-12 items-center justify-center rounded-md transition-all disabled:opacity-40"
        >
          {isCheckingAnswer ? (
            <span className="ios-spinner" aria-hidden="true">
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="ios-spinner-bar"
                  style={{
                    transform: `rotate(${i * 30}deg)`,
                    animationDelay: `${-((12 - i) % 12) / 12}s`,
                  }}
                />
              ))}
            </span>
          ) : checked ? (
            /* 次へ: → */
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 12h15" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          ) : (
            /* 答え合わせ: ⏎（リターンキー） */
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 5v6a3 3 0 0 1-3 3H5" />
              <path d="m9 9-5 5 5 5" />
            </svg>
          )}
        </button>
      </div>

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
              <div className="rounded-lg border-2 border-[#f5f5f5] bg-[#1c1c1c] px-4 py-3">
                <div className="text-sm font-bold text-[#f5f5f5]">
                  {answerStatus === "ai_approved" ? "〇（AI承認）" : answerStatus === "alternative" ? "◯ 正解（別解）" : "◯ 正解"}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-[#ff5a5a] bg-[#1f0a0a] px-4 py-3">
                <div className="mb-0.5 text-xs font-semibold text-[#ff8a8a]">不正解</div>
                <div className="text-sm font-bold text-[#ff5a5a]">{normalizedAnswers.join(" / ")}</div>
                {posViolation && (
                  <div className="mt-1 text-xs text-[#ffaa7a] opacity-90">{posViolation}</div>
                )}
                {aiFeedback && (
                  <div className="mt-1 text-xs text-[#ffaa7a] opacity-90">{aiFeedback}</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
