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
 * タイピング回答行。日本語IMEで自由記述し、答え合わせ/次への操作は
 * 入力欄右端の⏎/→アイコンに織り込む（ボタンへ視線を外さないため）。
 *
 * 配色の方針:
 * - 送信ボタンは「押せる状態」になって初めて操作色になる。彩度で状態を表し、
 *   何もしていない間は画面から色を消しておく。
 * - 正解は静かに（毎回起きるので主張させない）、不正解だけ強く見せる。
 * - 不正解時、覚えるべき正解の訳語は赤ではなく最高コントラストの文字色で出す。
 *   赤い文字は地に対する実効コントラストが落ち、いちばん読ませたいものが
 *   いちばん読みにくくなる。赤はラベル（「不正解」）だけに使う。
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
          placeholder="日本語訳を入力..."
          aria-label="日本語訳を入力してください"
          className="answer-field w-full rounded-lg py-3.5 pl-4 pr-16 text-base outline-none disabled:opacity-50"
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
          className={`absolute inset-y-1.5 right-1.5 flex w-12 items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
            checked || input.trim().length > 0
              ? "btn-accent"
              : "text-ink-3"
          }`}
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
              /* 正解は10問中ほとんどで起きる。強い枠や塗りで毎回主張させると
                 そのぶん視線と処理が持っていかれるので、細い罫だけに留める。 */
              <div className="rounded-r-lg border-l-2 border-positive bg-surface-1 px-3 py-2">
                <div className="text-sm text-positive">
                  {answerStatus === "ai_approved" ? "◯ 正解（AI承認）" : answerStatus === "alternative" ? "◯ 正解（別解）" : "◯ 正解"}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-negative bg-negative-surface px-4 py-3">
                <div className="mb-1 text-xs text-negative">✕ 不正解</div>
                {/* 覚えるべき語。この面の上で 14.4:1 を確保している */}
                <div className="text-base leading-snug text-ink-1">
                  {normalizedAnswers.join(" / ")}
                </div>
                {posViolation && (
                  <div className="mt-1 text-xs text-ink-3">{posViolation}</div>
                )}
                {!reviewResult && answerStatus !== "skipped" && (
                  <div className="mt-2 flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={onRequestAiReview}
                      disabled={isRequestingReview}
                      className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs disabled:opacity-50"
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
                      {isRequestingReview ? "AIが判定中..." : "AIに判定してもらう"}
                    </button>
                    {isRequestingReview && (
                      <p className="px-1 text-xs text-ink-3">判定には少し時間がかかります。そのままお待ちください。</p>
                    )}
                  </div>
                )}
                {reviewResult && !reviewResult.approved && (
                  <div className="mt-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-ink-2">
                    AI判定: 不正解（{reviewResult.score}点）{reviewResult.feedback ? `— ${reviewResult.feedback}` : ""}
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
