"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import QuestionCard from "./QuestionCard";
import TypingAnswerRow from "./TypingAnswerRow";
import { QuizEntry } from "@/lib/types";

export interface QuizSheetProps {
  entries: QuizEntry[];
  /** 結果発表後だけ true。答案を読むだけの面にする（判定自体は出題中から出ている） */
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

/** 答案を載せているスクロール枠。StudyScreen 側の overflow-y-auto を指す */
function findScroller(from: HTMLElement | null): HTMLElement | null {
  for (let node = from?.parentElement ?? null; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

/** 打っている行の、スクロール枠の上端からの距離 */
function offsetInScroller(scroller: HTMLElement, row: HTMLElement) {
  return row.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
}

/**
 * 10問を一枚に並べた小テストの答案用紙。
 *
 * 画面遷移を挟まず、上から順に打って Enter で next へ送るだけにする。
 * 確定した回答は裏で採点に回り、返ってきた設問から順にその場で判定が出る。
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
  const listRef = useRef<HTMLOListElement | null>(null);
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const scrollerRef = useRef<HTMLElement | null>(null);
  /** 打っている行を「画面のここ」に留めるための基準位置 */
  const anchorRef = useRef<{ slot: number; top: number } | null>(null);

  // 打っている行の位置を保ち続ける。
  //
  // 判定を随時出すようになったぶん、上の行が採点の戻り（＝ユーザーの操作と
  // 無関係なタイミング）で伸び縮みし、そのたびに下の行が押し下げられる。
  // 打っている行がその場から動かないところまでスクロールを送り返して、
  // 見ている場所を固定する。Blink/Gecko の scroll anchoring だけに頼ると
  // iOS Safari（overflow-anchor 非対応）で素通りするので、自前で持つ。
  //
  // 設問を送ったときだけは追従してよい。ここも画面の外へ出ない分しか
  // 動かさず、ペイント前に済ませて「一度ズレてから戻る」動きを消す。
  useLayoutEffect(() => {
    if (revealed) {
      anchorRef.current = null;
      return;
    }
    const row = rowRefs.current[activeSlot];
    if (!row) return;
    if (!scrollerRef.current?.isConnected) {
      scrollerRef.current = findScroller(listRef.current);
    }
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const anchor = anchorRef.current;
    if (anchor?.slot === activeSlot) {
      const drift = offsetInScroller(scroller, row) - anchor.top;
      if (Math.abs(drift) >= 1) scroller.scrollTop += drift;
    } else {
      row.scrollIntoView({ block: "nearest" });
    }
    anchorRef.current = { slot: activeSlot, top: offsetInScroller(scroller, row) };
  });

  // ユーザーが自分でスクロールしたら、そこを新しい基準にする。
  // 基準を据え置くと、次の再描画で元の位置へ引き戻してしまう。
  // scroll はバブルしないので、キャプチャで拾う。
  useEffect(() => {
    const sync = () => {
      const anchor = anchorRef.current;
      const scroller = scrollerRef.current;
      const row = anchor ? rowRefs.current[anchor.slot] : null;
      if (!anchor || !scroller || !row) return;
      anchor.top = offsetInScroller(scroller, row);
    };
    window.addEventListener("scroll", sync, true);
    return () => window.removeEventListener("scroll", sync, true);
  }, []);

  return (
    <ol ref={listRef} className="space-y-4">
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
