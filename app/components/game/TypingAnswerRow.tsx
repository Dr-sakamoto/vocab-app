"use client";

import { KeyboardEvent, Ref } from "react";
import { motion } from "framer-motion";
import { GradeOutcome } from "@/lib/types";

export interface TypingAnswerRowProps {
  inputRef?: Ref<HTMLInputElement>;
  input: string;
  onInputChange: (value: string) => void;
  /** 回答を確定して次の設問へ。Enter と右端のボタンから呼ぶ */
  onSubmit: () => void;
  onFocus?: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  /** IME変換中か。変換確定のEnterで設問を送ってしまわないための保険 */
  isComposing: boolean;
  /** 回答を確定済みか。採点は裏で走っているが、正誤はまだ出さない */
  committed: boolean;
  /** 結果発表後だけ true。ここで初めて正誤を見せる */
  revealed: boolean;
  /** 採点結果。revealed が false のあいだは使わない */
  outcome: GradeOutcome | null;
}

/**
 * タイピング回答行。日本語IMEで自由記述し、Enter（または右端の⏎）で確定して
 * 次の設問へ移る。確定した回答はその場で裏の採点へ回るが、正誤は出さない。
 *
 * 1問ごとに答え合わせをすると、採点の往復を毎回待つことになり、
 * そのぶんだけ「思い出して打つ」以外の時間がコアループに積まれる。
 * 10問ぶんの正誤は結果発表でまとめて見せる（＝学校の英単語小テスト）。
 *
 * 配色の方針:
 * - 送信ボタンは「押せる状態」になって初めて操作色になる。彩度で状態を表し、
 *   何もしていない間は画面から色を消しておく。
 * - 正誤は回答欄自体の枠色・地色で表す。カードを別途足さない
 *   （10問中ほとんどを占める正解のときに何も増えないようにするため）。
 * - 不正解時だけ、覚えるべき正解の訳語を欄の下に1行添える。赤ではなく
 *   最高コントラストの文字色で出す。赤い文字は地に対する実効コントラストが
 *   落ち、いちばん読ませたいものがいちばん読みにくくなる。赤は欄の枠と
 *   アイコンだけに使う。
 */
export default function TypingAnswerRow({
  inputRef,
  input,
  onInputChange,
  onSubmit,
  onFocus,
  onCompositionStart,
  onCompositionEnd,
  isComposing,
  committed,
  revealed,
  outcome,
}: TypingAnswerRowProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    // IMEの変換確定のEnterでは設問を送らない（打ち終える前に飛んでしまう）
    if (isComposing || e.nativeEvent.isComposing) return;
    e.preventDefault();
    onSubmit();
  };

  const isCorrect = outcome?.correct ?? false;
  const isBlank = outcome?.status === "blank";
  const fieldStateClass = !revealed
    ? ""
    : isCorrect
      ? "answer-field-correct"
      : "answer-field-incorrect";

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          data-quiz-answer
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          onFocus={onFocus}
          readOnly={revealed}
          placeholder={revealed ? "未回答" : "日本語訳を入力..."}
          aria-label="日本語訳を入力してください"
          className={`answer-field w-full rounded-lg py-3 pl-4 text-base outline-none ${fieldStateClass} ${
            revealed ? "pr-10" : "pr-14"
          }`}
        />
        {!revealed && (
          <button
            type="button"
            onClick={onSubmit}
            aria-label="回答を確定して次の問題へ"
            className={`absolute inset-y-1.5 right-1.5 flex w-11 items-center justify-center rounded-md transition-colors ${
              input.trim().length > 0 && !committed ? "btn-accent" : "text-ink-3"
            }`}
          >
            {/* 確定: ⏎（リターンキー） */}
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
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
          </button>
        )}
        {revealed && outcome && (
          <span
            aria-hidden
            className={`absolute inset-y-0 right-3 flex items-center text-base ${
              isCorrect ? "text-positive" : "text-negative"
            }`}
          >
            {isCorrect ? "◯" : isBlank ? "−" : "✕"}
          </span>
        )}
      </div>

      {revealed && outcome && !isCorrect && (
        /* 不正解のときだけ、欄の下に正解の訳語を1行添える。
           覚えるべき語なので、この面の上で 14.4:1 を確保している ink-1 で出す。 */
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-1.5 px-1"
        >
          <div className="text-base leading-snug text-ink-1">
            {outcome.normalizedAnswers.join(" / ")}
          </div>
          {outcome.posViolation && (
            <div className="mt-0.5 text-xs text-ink-3">{outcome.posViolation}</div>
          )}
          {outcome.aiFeedback && (
            <div className="mt-0.5 text-xs text-ink-3">{outcome.aiFeedback}</div>
          )}
        </motion.div>
      )}
    </>
  );
}
