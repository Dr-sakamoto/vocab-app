"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnswerTileBoard } from "@/lib/tileQuiz";

export interface TileAnswerBoardProps {
  board: AnswerTileBoard | null;
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
 * みんはや式の文字盤回答（スマホ既定）。
 * 正答の文字＋ダミー文字のタイルを1文字ずつタップして答えを組み立てる。
 * 全スロットが埋まった瞬間に自動で判定する。キーボードは一切出さない。
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
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const submittedRef = useRef<boolean>(false);

  useEffect(() => {
    setPickedIds([]);
    submittedRef.current = false;
  }, [resetKey]);

  const tileById = new Map(board?.tiles.map((tile) => [tile.id, tile]) ?? []);
  const pickedChars = pickedIds.map((id) => tileById.get(id)?.char ?? "");
  const slotCount = board?.answerChars.length ?? 0;

  // 全スロットが埋まったら自動判定（1回だけ）
  useEffect(() => {
    if (!board || checked || isCheckingAnswer || submittedRef.current) return;
    if (pickedIds.length !== board.answerChars.length) return;
    submittedRef.current = true;
    onSubmit(pickedIds.map((id) => tileById.get(id)?.char ?? "").join(""));
    // tileById は board から毎レンダー導出されるため依存に含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedIds, board, checked, isCheckingAnswer, onSubmit]);

  if (!board) return null;

  const slotStateClass = !checked
    ? "slot-box"
    : isCorrect
    ? "border-[#3f5d3a] bg-[#e6ead4] text-[#2c4327]"
    : "border-[#7a2a2a] bg-[#f0dcd2] text-[#5a1d1d]";

  return (
    <div>
      {/* 回答スロット */}
      <div
        className="flex flex-wrap justify-center gap-1"
        aria-label="回答欄"
        role="group"
      >
        {Array.from({ length: slotCount }, (_, i) => (
          <span
            key={i}
            className={`flex h-10 w-9 items-center justify-center rounded-md border text-lg font-bold ${slotStateClass}`}
          >
            {pickedChars[i] ?? ""}
          </span>
        ))}
      </div>

      {/* 文字タイル */}
      <div className="mt-2.5 flex flex-wrap justify-center gap-1.5" role="group" aria-label="文字盤">
        {board.tiles.map((tile) => {
          const used = pickedIds.includes(tile.id);
          return (
            <button
              key={tile.id}
              type="button"
              disabled={used || checked || isCheckingAnswer || pickedIds.length >= slotCount}
              onClick={() => setPickedIds((prev) => [...prev, tile.id])}
              className="tile-key h-11 w-11 rounded-md text-lg font-bold transition-transform"
              aria-label={`文字 ${tile.char}`}
            >
              {tile.char}
            </button>
          );
        })}
      </div>

      {/* 操作列: 1文字戻す / 判定後は結果と次へ */}
      <div className="mt-2.5">
        {!checked ? (
          <button
            type="button"
            disabled={pickedIds.length === 0 || isCheckingAnswer}
            onClick={() => setPickedIds((prev) => prev.slice(0, -1))}
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
                <div className="mb-2 rounded-lg border border-[#7a2a2a] bg-[#f0dcd2] px-3 py-2 text-center">
                  <span className="text-xs font-semibold text-[#a05252]">正解: </span>
                  <span className="text-sm font-bold text-[#5a1d1d]">
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
