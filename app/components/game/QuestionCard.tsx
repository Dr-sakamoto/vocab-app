"use client";

import { speakEnglishWord } from "@/lib/speech";

export interface QuestionCardProps {
  /** 小テストの設問番号（1始まり） */
  number: number;
  partOfSpeech: string;
  word: string;
  /**
   * 句動詞の意味を固定する、頻出の目的語。`take in` に対する `nutrients` など。
   * 単語の後ろに `[ ]` で添える。訳す対象ではないことを括弧で示す。
   */
  collocation?: string;
  /**
   * 回答を確定済みか。番号の濃さだけで示し、正誤は一切出さない。
   * 1問ごとに正誤が出ると、そこで手が止まって小テストにならない。
   */
  answered?: boolean;
}

/**
 * 小テスト1問ぶんの設問行。英単語・品詞・（あれば）目的語だけを見せる。
 *
 * 配色・組みの方針:
 * - 単語に発光（drop-shadow）を掛けない。グローは字形のエッジを鈍らせ、
 *   未知語の綴りを読み取る妨げになる。
 * - 字間を詰めない。未知の綴りは「読む」より「解読する」作業に近く、
 *   詰まった字間は文字同士の混雑（crowding）で不利になる。
 * - 補助要素（番号・品詞・読み上げ）はすべて無彩色。彩度を持つのは
 *   ユーザーが次に取るべき行動だけにする。
 * - 目的語は単語より小さく淡くする。答えるべきなのは句動詞のほうで、
 *   目的語は意味を絞り込むためのアンカーでしかない。
 */
export default function QuestionCard({
  number,
  partOfSpeech,
  word,
  collocation,
  answered = false,
}: QuestionCardProps) {
  // 目的語まで含めて読み上げる。チャンクごと音で覚えるほうが、
  // 句動詞単体で覚えるより意味の想起が速い。
  const spokenText = collocation ? `${word} ${collocation}` : word;

  return (
    <div className="flex items-baseline gap-2.5">
      <span
        className={`w-5 shrink-0 text-right text-xs tabular-nums ${
          answered ? "text-ink-2" : "text-ink-3"
        }`}
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <span className="break-words font-word text-2xl leading-tight tracking-[0.01em] text-ink-1 sm:text-3xl">
          {word}
        </span>
        {collocation && (
          <span className="ml-1.5 text-base text-ink-3">[{collocation}]</span>
        )}
        <span className="ml-2 whitespace-nowrap text-[11px] tracking-[0.16em] text-ink-3">
          {partOfSpeech}
        </span>
      </div>
      <button
        type="button"
        onClick={() => speakEnglishWord(spokenText)}
        aria-label={`${word} を読み上げる`}
        className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-md text-ink-3 transition hover:bg-surface-2 hover:text-ink-2"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" />
        </svg>
      </button>
    </div>
  );
}
