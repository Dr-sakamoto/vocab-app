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
  /** 結果発表後だけ true。答案を読むだけの面にして打ち直しを止める */
  revealed: boolean;
  /** 採点結果。返ってくるまでは null で、そのあいだは判定を出さない */
  outcome: GradeOutcome | null;
}

/**
 * タイピング回答行。日本語IMEで自由記述し、Enter（または右端の⏎）で確定して
 * 次の設問へ移る。確定した回答はその場で裏の採点へ回る。
 *
 * 判定は「その設問の採点が返った時点」で出す（随時公開）。手は次の設問に
 * 移ったあとなので、待たされる時間はコアループに積まれない。
 * 誤答の正解訳がその場に残るので、結果発表まで遡って見直す必要がなくなる
 * （スマホでは遡る操作そのものが面倒だった）。
 *
 * 出さないのは「まだ採点が返っていない設問」だけ。採点の往復を待つ形に
 * すると、そこで手が止まって1問1答へ戻ってしまう。
 *
 * 配色の方針:
 * - 送信ボタンは「押せる状態」になって初めて操作色になる。彩度で状態を表し、
 *   何もしていない間は画面から色を消しておく。
 * - 正解は静かに（10問中ほとんどで起きるので主張させない）、不正解だけ強く見せる。
 * - 不正解時、覚えるべき正解の訳語は赤ではなく最高コントラストの文字色で出す。
 *   赤い文字は地に対する実効コントラストが落ち、いちばん読ませたいものが
 *   いちばん読みにくくなる。赤はラベル（「不正解」）だけに使う。
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
          className={`answer-field w-full rounded-lg py-3 pl-4 text-base outline-none ${
            revealed ? "pr-4" : "pr-14"
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
      </div>

      {/* 採点が返った設問だけ判定を出す。打ち直すと outcome は null に戻り、
          この行の判定も一緒に消える（採点し直しの前に古い正誤を残さない）。
          出題中に生えるので、位置をずらす動きは持たせず淡く出すだけにする
          （動くと、いま打っている行から視線が引き剥がされる）。 */}
      {outcome && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="mt-1.5"
        >
          {isCorrect ? (
            /* 正解は10問中ほとんどで起きる。強い枠や塗りで毎回主張させると
               そのぶん視線と処理が持っていかれるので、細い罫だけに留める。 */
            <div className="rounded-r-lg border-l-2 border-positive bg-surface-1 px-3 py-1.5">
              <div className="text-sm text-positive">
                {outcome.status === "ai_approved"
                  ? "◯ 正解（AI承認）"
                  : outcome.status === "alternative"
                    ? "◯ 正解（別解）"
                    : "◯ 正解"}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-negative bg-negative-surface px-4 py-2.5">
              <div className="mb-1 text-xs text-negative">
                {isBlank ? "− 未回答" : "✕ 不正解"}
              </div>
              {/* 覚えるべき語。この面の上で 14.4:1 を確保している */}
              <div className="text-base leading-snug text-ink-1">
                {outcome.normalizedAnswers.join(" / ")}
              </div>
              {outcome.posViolation && (
                <div className="mt-1 text-xs text-ink-3">{outcome.posViolation}</div>
              )}
              {outcome.aiFeedback && (
                <div className="mt-1 text-xs text-ink-3">{outcome.aiFeedback}</div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
