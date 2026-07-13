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
}

/**
 * みんはや式の文字盤回答（スマホ固定）。
 * 1文字選ぶごとに選択肢（8択）が入れ替わり、正答の文字数ぶん繰り返す。
 * 総文字数（残りスロット数）は伏せる。全文字を選び終えると自動で判定する。
 */
export default function TileAnswerBoard({
  board,
  resetKey,
  checked,
  isCorrect,
  isCheckingAnswer,
  normalizedAnswers,
  onSubmit,
  onNext,
}: TileAnswerBoardProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const submittedRef = useRef<boolean>(false);

  useEffect(() => {
    setPicked([]);
    submittedRef.current = false;
  }, [resetKey]);

  // 全文字を選び終えたら自動判定（1回だけ）
  useEffect(() => {
    if (!board || checked || isCheckingAnswer || submittedRef.current) return;
    if (picked.length !== board.answerChars.length) return;
    submittedRef.current = true;
    onSubmit(picked.join(""));
  }, [picked, board, checked, isCheckingAnswer, onSubmit]);

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
      {/* 選んだ文字の並び（総文字数は出さない。判定前は末尾に入力位置を示す枠） */}
      <div className="flex min-h-[2.5rem] flex-wrap items-center justify-center gap-1">
        {picked.map((char, i) => (
          <span
            key={i}
            className={`flex h-10 w-9 items-center justify-center rounded-md border text-lg font-bold ${answeredRowClass}`}
          >
            {char}
          </span>
        ))}
        {!checked && (
          <span className="flex h-10 w-9 items-center justify-center rounded-md border border-dashed border-[#3aa83a]/60 text-lg text-[#3aa83a]">
            <span className="animate-pulse">▍</span>
          </span>
        )}
      </div>

      {/* 現在ラウンドの選択肢（8択）。1文字選ぶと次ラウンドへ入れ替わる */}
      {!checked && (
        <div className="mt-2.5 space-y-1.5" role="group" aria-label="文字盤">
          {rows.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-1.5">
              {row.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  disabled={isCheckingAnswer}
                  onClick={() => setPicked((prev) => [...prev, tile.char])}
                  className="tile-key h-11 w-11 rounded-md text-lg font-bold transition-transform"
                  aria-label={`文字 ${tile.char}`}
                >
                  {tile.char}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 操作列: 1文字戻す / 判定後は結果と次へ */}
      <div className="mt-2.5">
        {!checked ? (
          <button
            type="button"
            disabled={picked.length === 0 || isCheckingAnswer}
            onClick={() => setPicked((prev) => prev.slice(0, -1))}
            className="brass-btn mx-auto flex h-10 w-28 items-center justify-center gap-1 rounded-md text-sm font-bold disabled:opacity-40"
          >
            ⌫ 戻す
          </button>
        ) : (
          <AnimatePresence>
            <motion.div
              key="tile-result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {!isCorrect && (
                <div className="mb-2 rounded-lg border-2 border-[#ff5a5a] bg-[#1f0a0a] px-3 py-2 text-center">
                  <span className="text-xs font-semibold text-[#ff8a8a]">正解: </span>
                  <span className="text-sm font-bold text-[#ff5a5a]">
                    {normalizedAnswers.join(" / ") || board.answer}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={onNext}
                className="brass-btn flex h-11 w-full items-center justify-center rounded-md text-sm font-bold"
              >
                次へ →
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
