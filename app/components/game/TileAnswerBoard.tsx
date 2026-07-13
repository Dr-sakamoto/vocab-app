"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnswerRoundsBoard } from "@/lib/tileQuiz";

export interface TileAnswerBoardProps {
  board: AnswerRoundsBoard | null;
  /** 問題が変わったら盤面の選択状態をリセットするためのキー */
  resetKey: string;
  checked: boolean;
  isCorrect: boolean;
  isCheckingAnswer: boolean;
  /** 不正解時に表示する正答（別解含む表示用） */
  normalizedAnswers: string[];
  onSubmit: (text: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

/**
 * みんはや式の文字盤回答（スマホ固定）。
 * 1文字選ぶごとに選択肢（8択）が入れ替わり、正答の文字数ぶん繰り返す。
 * 総文字数（残りスロット数）は伏せる。全文字を選び終えると自動で判定し、
 * 正解なら即座に、不正解なら3秒後に自動で次の問題へ進む
 * （「次へ」ボタンは不正解時の待ち時間を早める手動スキップとして残す）。
 */
const CORRECT_ADVANCE_DELAY_MS = 700;
const WRONG_ADVANCE_DELAY_MS = 3000;

export default function TileAnswerBoard({
  board,
  resetKey,
  checked,
  isCorrect,
  isCheckingAnswer,
  normalizedAnswers,
  onSubmit,
  onNext,
  onSkip,
}: TileAnswerBoardProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const submittedRef = useRef<boolean>(false);
  const lastResetKeyRef = useRef<string>(resetKey);
  const answerFieldRef = useRef<HTMLDivElement>(null);

  // 「盤面リセット」と「全文字選択で自動判定」を1つの effect にまとめる。
  // 分けると、resetKey が変わった直後のコミットで reset 側が picked を
  // クリアする「前」に判定側が前の問題の picked を読んでしまい、たまたま
  // 新しい正答と文字数が一致すると前の問題の回答を新しい問題に誤って
  // 自動送信してしまう（＝前の問題の答えで新問題が即不正解になる）ため。
  useEffect(() => {
    if (lastResetKeyRef.current !== resetKey) {
      lastResetKeyRef.current = resetKey;
      setPicked([]);
      submittedRef.current = false;
      return;
    }
    if (!board || checked || isCheckingAnswer || submittedRef.current) return;
    if (picked.length !== board.answerChars.length) return;
    submittedRef.current = true;
    onSubmit(picked.join(""));
  }, [resetKey, picked, board, checked, isCheckingAnswer, onSubmit]);

  // 判定後は自動で次へ（正解はすぐ／不正解は3秒待ってから）
  useEffect(() => {
    if (!checked) return;
    const delay = isCorrect ? CORRECT_ADVANCE_DELAY_MS : WRONG_ADVANCE_DELAY_MS;
    const timer = window.setTimeout(onNext, delay);
    return () => window.clearTimeout(timer);
  }, [checked, isCorrect, onNext]);

  // 入力欄は幅固定。文字が増えたら実物の入力欄同様、末尾（カーソル側）が
  // 見えるように自動で右へスクロールする。
  useEffect(() => {
    const el = answerFieldRef.current;
    if (!el) return;
    el.scrollLeft = el.scrollWidth;
  }, [picked]);

  if (!board) return null;

  // 現在のラウンド（＝選んだ文字数の位置）の選択肢
  const currentRound = board.rounds[picked.length] ?? [];
  const rows = [currentRound.slice(0, 4), currentRound.slice(4)];

  const answeredRowClass = !checked
    ? "slot-box"
    : isCorrect
    ? "border-[#61ff5f] bg-[#0c1f0c] text-[#61ff5f]"
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
          <span className="ml-0.5 shrink-0 text-[#3aa83a]">
            <span className="animate-pulse">▍</span>
          </span>
        )}
      </div>

      {/* 現在ラウンドの選択肢（8択）。1文字選ぶと次ラウンドへ入れ替わる */}
      {!checked && (
        <div className="mt-2.5 space-y-2" role="group" aria-label="文字盤">
          {rows.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-2">
              {row.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={isCheckingAnswer}
                  onClick={() => setPicked((prev) => [...prev, tile.char])}
                  className="tile-key h-14 w-14 rounded-md text-xl font-bold transition-transform"
                  aria-label={`文字 ${tile.char}`}
                >
                  {tile.char}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 操作列: 1文字戻す / 判定後は結果（正解は即・不正解は3秒後に自動で次へ） */}
      <div className="mt-2.5 min-h-[3rem]">
        {!checked ? (
          <div className="mx-auto flex w-full max-w-[248px] flex-col gap-2">
            <button
              type="button"
              disabled={picked.length === 0 || isCheckingAnswer}
              onClick={() => setPicked((prev) => prev.slice(0, -1))}
              className="brass-btn flex h-12 w-full items-center justify-center gap-1 rounded-md text-base font-bold disabled:opacity-40"
            >
              ⌫ 戻す
            </button>
            <button
              type="button"
              disabled={isCheckingAnswer}
              onClick={onSkip}
              aria-label="この問題をわからないとして次へ"
              className="flex h-12 w-full items-center justify-center gap-1 rounded-md border-2 border-[#ff5a5a] bg-[#1f0a0a] text-sm font-bold text-[#ff5a5a] transition hover:bg-[#2a0e0e] disabled:opacity-40"
            >
              わからない
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
                <div className="flex h-12 items-center justify-center rounded-md border-2 border-[#61ff5f] bg-[#0c1f0c] text-base font-bold text-[#61ff5f]">
                  ◯ 正解！
                </div>
              ) : (
                <>
                  <div className="mb-2 rounded-lg border-2 border-[#ff5a5a] bg-[#1f0a0a] px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-[#ff8a8a]">正解: </span>
                    <span className="text-sm font-bold text-[#ff5a5a]">
                      {normalizedAnswers.join(" / ") || board.answer}
                    </span>
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
