"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnswerRoundsBoard } from "@/lib/tileQuiz";
import { ReviewResultState } from "./TypingAnswerRow";

export interface TileAnswerBoardProps {
  board: AnswerRoundsBoard | null;
  /** 問題が変わったら盤面の選択状態をリセットするためのキー */
  resetKey: string;
  checked: boolean;
  isCorrect: boolean;
  answerStatus: string | null;
  isCheckingAnswer: boolean;
  /** 不正解時に表示する正答（別解含む表示用） */
  normalizedAnswers: string[];
  reviewResult: ReviewResultState | null;
  isRequestingReview: boolean;
  onRequestAiReview: () => void;
  onSubmit: (text: string) => void;
  onNext: () => void;
  /** 未回答のときだけ渡す。回答済みなら undefined にしてボタンを隠す */
  onSkip?: () => void;
  skipDisabled?: boolean;
}

/**
 * みんはや式の文字盤回答（スマホ固定）。
 * 1文字選ぶごとに選択肢（8択）が入れ替わり、正答の文字数ぶん繰り返す。
 * 総文字数（残りスロット数）は伏せる。正答の文字数ぶんラウンドを使い切っても
 * パネルは消さず、ラウンドを先頭から繰り返し表示し続ける（ちょうど正答の
 * 文字数に達した瞬間にパネルが消えると、それ自体が文字数のヒントになって
 * しまうため）。送信するかどうかはあくまでユーザーが「決定」ボタンを押した
 * タイミングで決める。決定ボタンは1文字でも選んでいれば押せる（文字数の一致は
 * 条件にしない）。
 * 判定後は正解なら即座に、不正解なら3秒後に自動で次の問題へ進む
 * （「次へ」ボタンは不正解時の待ち時間を早める手動スキップとして残す）。
 */
const CORRECT_ADVANCE_DELAY_MS = 700;
const WRONG_ADVANCE_DELAY_MS = 3000;

export default function TileAnswerBoard({
  board,
  resetKey,
  checked,
  isCorrect,
  answerStatus,
  isCheckingAnswer,
  normalizedAnswers,
  reviewResult,
  isRequestingReview,
  onRequestAiReview,
  onSubmit,
  onNext,
  onSkip,
  skipDisabled = false,
}: TileAnswerBoardProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const submittedRef = useRef<boolean>(false);
  const lastResetKeyRef = useRef<string>(resetKey);
  const answerFieldRef = useRef<HTMLDivElement>(null);

  // 問題が変わったら（resetKey が変わったら）盤面の選択状態をリセットする。
  useEffect(() => {
    if (lastResetKeyRef.current !== resetKey) {
      lastResetKeyRef.current = resetKey;
      setPicked([]);
      submittedRef.current = false;
    }
  }, [resetKey]);

  const handleSubmit = () => {
    if (!board || checked || isCheckingAnswer || submittedRef.current) return;
    if (picked.length === 0) return;
    submittedRef.current = true;
    onSubmit(picked.join(""));
  };

  // 判定後は自動で次へ（正解はすぐ／不正解は3秒待ってから）。
  // AI審議をリクエスト中は結果を待つため自動送りを止める。審議結果が
  // 届いたら（承認なら正解扱いに切り替わり／非承認ならそのまま）
  // 改めて3秒（または正解なら即時）のカウントダウンを始める。
  useEffect(() => {
    if (!checked || isRequestingReview) return;
    const delay = isCorrect ? CORRECT_ADVANCE_DELAY_MS : WRONG_ADVANCE_DELAY_MS;
    const timer = window.setTimeout(onNext, delay);
    return () => window.clearTimeout(timer);
  }, [checked, isCorrect, isRequestingReview, reviewResult, onNext]);

  // 入力欄は幅固定。文字が増えたら実物の入力欄同様、末尾（カーソル側）が
  // 見えるように自動で右へスクロールする。
  useEffect(() => {
    const el = answerFieldRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [picked]);

  if (!board) return null;

  // 現在のラウンド（＝選んだ文字数の位置）の選択肢。正答の文字数ぶんの
  // ラウンドを使い切ってもパネルを消さず、先頭から繰り返す（消えた瞬間が
  // 文字数のヒントにならないようにするため）。
  const currentRound = board.rounds[picked.length % board.rounds.length] ?? [];
  const rows = [currentRound.slice(0, 4), currentRound.slice(4)];

  const answeredRowClass = !checked
    ? "slot-box"
    : isCorrect
    ? "border-[#f5f5f5] bg-[#1c1c1c] text-[#f5f5f5]"
    : "border-[#ff5a5a] bg-[#1f0a0a] text-[#ff5a5a]";

  return (
    <div>
      {/* 選んだ文字を差し込む固定サイズの解答欄（総文字数は出さない）。
          幅は固定のまま、文字が増えると入力欄のように末尾へ自動スクロールする。 */}
      <div
        ref={answerFieldRef}
        className={`no-scrollbar mx-auto flex h-12 w-full max-w-[280px] items-center overflow-x-auto whitespace-nowrap rounded-md border px-3 text-lg font-bold tracking-widest ${answeredRowClass}`}
      >
        <span>{picked.join("")}</span>
        {!checked && (
          <span className="ml-0.5 shrink-0 text-[#9a9a9a]">
            <span className="animate-pulse">▍</span>
          </span>
        )}
      </div>

      {/* 現在ラウンドの選択肢（8択）。1文字選ぶと次ラウンドへ入れ替わる */}
      {!checked && (
        <div className="mt-3 space-y-3" role="group" aria-label="文字盤">
          {rows.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-3">
              {row.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={isCheckingAnswer}
                  onClick={() => setPicked((prev) => [...prev, tile.char])}
                  className="tile-key h-16 w-16 rounded-md text-2xl font-bold transition-transform"
                  aria-label={`文字 ${tile.char}`}
                >
                  {tile.char}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 操作列: 1文字戻す・決定（送信） / 判定後は結果（正解は即・不正解は3秒後に自動で次へ） */}
      <div className="mt-2.5 min-h-[3rem]">
        {!checked ? (
          <div className="flex items-center justify-center gap-2">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={skipDisabled}
                aria-label="この問題をわからないとして次へ"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-[#ff5a5a] text-xl font-bold text-[#ff5a5a] transition hover:bg-[#ff5a5a]/15 disabled:opacity-40"
              >
                ?
              </button>
            )}
            <button
              type="button"
              disabled={picked.length === 0 || isCheckingAnswer}
              onClick={() => setPicked((prev) => prev.slice(0, -1))}
              className="brass-btn flex h-12 w-24 items-center justify-center gap-1 rounded-md text-base font-bold disabled:opacity-40"
            >
              ⌫ 戻す
            </button>
            <button
              type="button"
              disabled={picked.length === 0 || isCheckingAnswer}
              onClick={handleSubmit}
              className="brass-btn flex h-12 w-32 items-center justify-center gap-1 rounded-md text-base font-bold disabled:opacity-40"
            >
              決定 ✓
            </button>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div
              key="tile-result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isCorrect ? (
                <div className="flex h-12 items-center justify-center rounded-md border-2 border-[#f5f5f5] bg-[#1c1c1c] text-base font-bold text-[#f5f5f5]">
                  ◯ 正解！
                </div>
              ) : (
                <>
                  <div className="mb-2 rounded-lg border-2 border-[#ff5a5a] bg-[#1f0a0a] px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-[#ff8a8a]">正解: </span>
                    <span className="text-sm font-bold text-[#ff5a5a]">
                      {normalizedAnswers.join(" / ") || board.answer}
                    </span>
                    {!reviewResult && answerStatus !== "skipped" && (
                      <div className="mt-2 flex flex-col items-center gap-1">
                        <button
                          type="button"
                          onClick={onRequestAiReview}
                          disabled={isRequestingReview}
                          className="brass-btn flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-50"
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
                          <p className="text-xs text-[#7d7d7d]">審議には少し時間がかかります。そのままお待ちください。</p>
                        )}
                      </div>
                    )}
                    {reviewResult && !reviewResult.approved && (
                      <div className="mt-2 rounded-lg border border-[#9a9a9a]/50 bg-[#0a0a0a] px-3 py-2 text-xs text-[#e6e6e6]">
                        AI審議: 不承認（{reviewResult.score}点）{reviewResult.feedback ? `— ${reviewResult.feedback}` : ""}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onNext}
                    className="brass-btn flex h-12 w-full items-center justify-center rounded-md text-base font-bold"
                  >
                    次へ →
                  </button>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
