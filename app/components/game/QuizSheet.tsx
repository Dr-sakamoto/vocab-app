"use client";

import QuestionCard from "./QuestionCard";
import TypingAnswerRow from "./TypingAnswerRow";
import { QuizEntry } from "@/lib/types";

export interface QuizSheetProps {
  entries: QuizEntry[];
  /**
   * いま画面に出す設問の添字。出題中は上下2問ぶん（lib/quizSet.ts の
   * windowSlots）、結果発表では10問すべて。番号は添字から出すので、窓が
   * 進んでも「3」「4」と1セットの通し番号が続く。
   */
  visibleSlots: number[];
  isComposing: boolean;
  onInputChange: (slot: number, value: string) => void;
  onSubmitSlot: (slot: number) => void;
  onFocusSlot: (slot: number) => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  registerInput: (slot: number, element: HTMLInputElement | null) => void;
}

/**
 * 10問の小テストの答案用紙。出題中は上下2問ずつ、結果発表では10問ぶんを描く。
 *
 * 画面遷移を挟まず、上から順に打って Enter で next へ送るだけにする。
 * 確定した回答は裏で採点に回り、正誤は設問ごとに採点が返り次第見せる
 * （随時採点＝`entry.outcome !== null` を revealed とする）。採点の待ち時間は
 * ユーザーのタイピングと重なって消える。
 *
 * 出題中に見せる数を上下2問に絞るのは、打っているあいだ紙を動かさないため。
 * 10問を縦に並べるとスマホではスクロールが要り、1問送るたびに画面が
 * ずれる。2問なら収まるので、答案は「入れ替わる」だけで動かない。
 *
 * 読み上げは「回答欄にカーソルが入ったとき」に鳴らす。設問を目で追う動きと
 * 音が一致し、戻って解き直したときも自然にもう一度聞こえる。
 */
export default function QuizSheet({
  entries,
  visibleSlots,
  isComposing,
  onInputChange,
  onSubmitSlot,
  onFocusSlot,
  onCompositionStart,
  onCompositionEnd,
  registerInput,
}: QuizSheetProps) {
  return (
    <ol className="space-y-4">
      {visibleSlots.map((slot) => {
        const entry = entries[slot];
        if (!entry) return null;
        return (
          <li key={`${entry.item.id}-${slot}`}>
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
                revealed={entry.outcome !== null}
                outcome={entry.outcome}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
