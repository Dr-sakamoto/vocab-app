"use client";

import { KeyboardEvent, useState } from "react";
import { findGrammarTag } from "@/lib/compose/grammarTags";
import { getQuestionText } from "@/lib/compose/question";
import type { ComposeDirection, ComposePrompt } from "@/lib/compose/types";
import Spinner from "./Spinner";
import TagChip from "./TagChip";

interface WritingCardProps {
  prompt: ComposePrompt;
  direction: ComposeDirection;
  /** 何問目か（1始まり） */
  number: number;
  total: number;
  /** ヒント（狙いのタグと書き方の指針）を開いているか */
  hintShown: boolean;
  onRevealHint: () => void;
  onSubmit: (text: string) => void;
  /** 裏で採点が走っている件数。押すものが無い待ちなので静かに出す */
  gradingCount: number;
}

/**
 * 出題1問ぶん。設問を読んで答案を書き、確定するとすぐ次の問題へ進む。
 *
 * 画面に出さないもの:
 * - 直前の問題の点数・正誤（書いている最中に見えると手が止まる）
 * - 模範解答（読んでから書くと、それは英作文ではなく書き写し）
 *
 * 確定は Enter（IME変換中は無効）。改行が要る長い答案のために
 * Shift+Enter を空けてあるが、1文で答える問題しか無いので通常は使わない。
 */
export default function WritingCard({
  prompt,
  direction,
  number,
  total,
  hintShown,
  onRevealHint,
  onSubmit,
  gradingCount,
}: WritingCardProps) {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const submit = () => onSubmit(text);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    // IMEの変換確定のEnterでは送らない（打ち終える前に飛んでしまう）
    if (isComposing || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit();
  };

  const questionText = getQuestionText(prompt, direction);
  const isJapaneseQuestion = direction === "ja-to-en";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="prompt-card p-4">
        <div className="flex items-center justify-between text-[11px] text-ink-3">
          <span className="tabular-nums">
            {number} / {total}
          </span>
          <span>{isJapaneseQuestion ? "日本語 → 英語" : "英語 → 日本語"}</span>
        </div>

        <p className="mt-3 text-xl leading-relaxed text-ink-1 sm:text-2xl">{questionText}</p>

        {hintShown ? (
          <div className="mt-4 border-t border-line pt-3">
            <div className="flex flex-wrap gap-1.5">
              {prompt.tags.map((tagId) => (
                <TagChip key={tagId} tagId={tagId} />
              ))}
            </div>
            <ul className="mt-2 space-y-1 text-xs text-ink-3">
              {prompt.tags.map((tagId) => {
                const tag = findGrammarTag(tagId);
                return tag ? <li key={tagId}>{tag.hint}</li> : null;
              })}
            </ul>
          </div>
        ) : (
          <button
            type="button"
            onClick={onRevealHint}
            className="mt-4 text-xs text-ink-3 underline-offset-4 hover:text-ink-2 hover:underline"
          >
            ヒントを見る（狙っている文法）
          </button>
        )}
      </div>

      <div className="mt-3">
        {/* 問題ごとに key を変えて作り直しているので、答案の初期化も
            カーソルの移動も autoFocus だけで済む（effect で状態を
            触らない）。次の問題へ進むのに一度もマウスへ手を伸ばさせない。 */}
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          rows={3}
          autoFocus
          spellCheck={false}
          placeholder={isJapaneseQuestion ? "英文を書く" : "日本語に訳す"}
          aria-label="答案"
          className="compose-field w-full rounded-xl px-4 py-3 text-base leading-relaxed"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-ink-3">
            {gradingCount > 0 ? (
              <Spinner label={`採点中 ${gradingCount}件`} />
            ) : (
              "Enter で確定して次へ"
            )}
          </span>
          <button
            type="button"
            onClick={submit}
            className={`min-h-11 rounded-xl px-5 py-2.5 text-sm transition ${
              text.trim() ? "btn-accent" : "btn-quiet"
            }`}
          >
            {number === total ? "確定して講評へ" : "確定して次へ"}
          </button>
        </div>
      </div>
    </div>
  );
}
