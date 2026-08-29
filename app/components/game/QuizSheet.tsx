"use client";

import { AnimatePresence, motion } from "framer-motion";
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
 * 窓が進むとき（下が上へ繰り上がり、新しい設問が下に補充される）は
 * 瞬間的な差し替えにせず、コンベアのように動かす。上だった設問は
 * フェードしながら少し上へ抜け、下だった設問はそのまま上の位置へ
 * レイアウトアニメーションで滑らかに移動し、新しい設問は下からせり上がって
 * 入る。`layout` はキー（`${item.id}-${slot}` は窓が進んでも下→上では
 * 変わらない）が同じ要素だけに効くので、繰り上がる設問はその場「移動」に、
 * 抜ける設問と入る設問は enter/exit アニメーションになる。
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
    <ol className="flex flex-col gap-4">
      <AnimatePresence initial={false}>
        {visibleSlots.map((slot) => {
          const entry = entries[slot];
          if (!entry) return null;
          return (
            <motion.li
              key={`${entry.item.id}-${slot}`}
              layout="position"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
                  revealed={entry.outcome !== null}
                  outcome={entry.outcome}
                />
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ol>
  );
}
