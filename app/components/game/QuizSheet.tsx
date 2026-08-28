"use client";

import { useLayoutEffect, useRef } from "react";
import QuestionCard from "./QuestionCard";
import TypingAnswerRow from "./TypingAnswerRow";
import { QuizEntry } from "@/lib/types";

export interface QuizSheetProps {
  entries: QuizEntry[];
  /** 結果発表後だけ true。ここで初めて10問ぶんの正誤が出る */
  revealed: boolean;
  /** いま入力中の設問。読み上げとスクロール追従の基準 */
  activeSlot: number;
  isComposing: boolean;
  onInputChange: (slot: number, value: string) => void;
  onSubmitSlot: (slot: number) => void;
  onFocusSlot: (slot: number) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  registerInput: (slot: number, element: HTMLInputElement | null) => void;
}

/**
 * 10問を一枚に並べた小テストの答案用紙。
 *
 * 画面遷移も1問ごとの答え合わせも挟まず、上から順に打って Enter で next へ
 * 送るだけにする。確定した回答は裏で採点に回り、正誤は結果発表まで伏せる。
 * 採点の待ち時間はユーザーのタイピングと重なって消える。
 *
 * 読み上げは「回答欄にカーソルが入ったとき」に鳴らす。設問を目で追う動きと
 * 音が一致し、戻って解き直したときも自然にもう一度聞こえる。
 */
export default function QuizSheet({
  entries,
  revealed,
  activeSlot,
  isComposing,
  onInputChange,
  onSubmitSlot,
  onFocusSlot,
  onCompositionStart,
  onCompositionEnd,
  registerInput,
}: QuizSheetProps) {
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);

  // 次の設問へ送ったとき、その行が画面の外へ出ないところまでだけ寄せる。
  // ペイント前に合わせることで、隠れた状態が一瞬見えてから画面がズレる
  // という体感上の「割り込み」を消す。
  useLayoutEffect(() => {
    if (revealed) return;
    rowRefs.current[activeSlot]?.scrollIntoView({ block: "nearest" });
  }, [activeSlot, revealed]);

  return (
    <ol className="space-y-4">
      {entries.map((entry, slot) => (
        <li
          key={`${entry.item.id}-${slot}`}
          ref={(element) => {
            rowRefs.current[slot] = element;
          }}
        >
          <QuestionCard
            number={slot + 1}
            partOfSpeech={entry.item.partOfSpeech}
            word={entry.item.target}
            collocation={entry.item.collocation}
            answered={entry.committed}
          />
          <div className="mt-1.5">
            <TypingAnswerRow
              inputRef={(element) => registerInput(slot, element)}
              input={entry.input}
              onInputChange={(value) => onInputChange(slot, value)}
              onSubmit={() => onSubmitSlot(slot)}
              onFocus={() => onFocusSlot(slot)}
              onCompositionStart={onCompositionStart}
              onCompositionEnd={onCompositionEnd}
              isComposing={isComposing}
              committed={entry.committed}
              revealed={revealed}
              outcome={entry.outcome}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
