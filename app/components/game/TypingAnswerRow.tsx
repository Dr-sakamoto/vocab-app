"use client";

import { RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ReviewResultState {
  approved: boolean;
  score: number;
  feedback?: string;
}

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
  reviewResult: ReviewResultState | null;
  isRequestingReview: boolean;
  onRequestAiReview: () => void;
  onCheck: () => void;
  onNext: () => void;
}

/**
 * タイピング回答行（ハイファンタジースキン）。
 * 答え合わせ/次への操作は入力欄右端の⏎/→アイコンに織り込む。
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
  reviewResult,
  isRequestingReview,
  onRequestAiReview,
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
          placeholder="日本語訳を記す..."
          aria-label="日本語訳を入力してください"
          className="w-full rounded-lg border-2 border-[#6d5228] bg-[#fdf8e6] py-3.5 pl-4 pr-16 text-base text-[#2b1d0e] outline-none transition-all placeholder:text-[#8a7a55] focus:border-[#b08d3c] focus:shadow-[0_0_12px_rgba(176,141,60,0.35)] disabled:opacity-50"
          onKeyDown={(e) => {
            if (isComposing) return;
            if (e.key !== "Enter") return;
            if (checked) onNext();
            else onCheck();
          }}
          disabled={isCheckingAnswer}
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
              <div className="rounded-lg border border-[#3f5d3a] bg-[#e6ead4] px-4 py-3">
                <div className="text-sm font-bold text-[#2c4327]">
                  {answerStatus === "ai_approved" ? "〇（AI承認）" : answerStatus === "alternative" ? "◯ 正解（別解）" : "◯ 正解"}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[#7a2a2a] bg-[#f0dcd2] px-4 py-3">
                <div className="mb-0.5 text-xs font-semibold text-[#a05252]">不正解</div>
                <div className="text-sm font-bold text-[#5a1d1d]">{normalizedAnswers.join(" / ")}</div>
                {posViolation && (
                  <div className="mt-1 text-xs text-[#7a2a2a] opacity-90">{posViolation}</div>
                )}
                {!reviewResult && (
                  <div className="mt-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={onRequestAiReview}
                      disabled={isRequestingReview}
                      className="brass-btn flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition disabled:opacity-50"
                    >
                      {isRequestingReview && (
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
                      )}
                      {isRequestingReview ? "賢者が審議中..." : "賢者（AI）に審議してもらう"}
                    </button>
                    {isRequestingReview && (
                      <p className="px-1 text-xs text-[#8a7a55]">審議には少し時間がかかります。そのままお待ちください。</p>
                    )}
                  </div>
                )}
                {reviewResult && !reviewResult.approved && (
                  <div className="mt-2 rounded-lg border border-[#6d5228]/40 bg-[#fdf8e6] px-3 py-2 text-xs text-[#5b4423]">
                    AI審議: 不承認（{reviewResult.score}点）{reviewResult.feedback ? `— ${reviewResult.feedback}` : ""}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
