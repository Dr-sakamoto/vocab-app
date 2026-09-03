"use client";

import { hasEdits, diffWords } from "@/lib/compose/diff";
import { getExpectedAnswers, getQuestionText } from "@/lib/compose/question";
import type { ComposeDirection, ComposeVerdict } from "@/lib/compose/types";
import type { SessionEntry } from "../hooks/useComposeSession";
import DiffText from "./DiffText";
import Spinner from "./Spinner";
import TagChip from "./TagChip";

const VERDICT_LABEL: Record<ComposeVerdict, { label: string; color: string }> = {
  pass: { label: "合格", color: "var(--positive)" },
  close: { label: "惜しい", color: "var(--warning)" },
  review: { label: "要復習", color: "var(--negative)" },
};

interface ReviewCardProps {
  entry: SessionEntry;
  direction: ComposeDirection;
  number: number;
  total: number;
  onNext: () => void;
}

/**
 * 講評1問ぶん。ここが英作文アプリの学習の本体になる。
 *
 * 並びは「自分が書いたもの → 直された点 → なぜ → 模範解答」。
 * 模範解答を先頭に置くと、そこで読み終えてしまい、自分の文の
 * どこが直されたのかを見ないまま次へ進む。
 *
 * 採点がまだ返っていないときは待つ（次へ進めない）。採点結果を
 * 読まずに飛ばせてしまうと、書くだけ書いて何も学ばないセッションが
 * 成立してしまう。
 */
export default function ReviewCard({
  entry,
  direction,
  number,
  total,
  onNext,
}: ReviewCardProps) {
  const { prompt, input, grade } = entry;
  const answers = getExpectedAnswers(prompt, direction);
  const question = getQuestionText(prompt, direction);

  if (!grade) {
    return (
      <div className="prompt-card flex min-h-40 flex-col items-center justify-center gap-3 p-6">
        <Spinner label="採点の到着を待っています" />
        <p className="text-xs text-ink-3">
          AIが添削しています。ここで待つのは、書いている間に裏で走らせた採点の残りだけです。
        </p>
      </div>
    );
  }

  const verdict = VERDICT_LABEL[grade.verdict];
  const edited = grade.corrected.trim() !== "" && hasEdits(diffWords(input, grade.corrected));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="prompt-card p-4">
          <div className="flex items-center justify-between text-[11px] text-ink-3">
            <span className="tabular-nums">
              講評 {number} / {total}
            </span>
            <span className="flex items-baseline gap-2">
              <span style={{ color: verdict.color }}>{verdict.label}</span>
              <span className="text-2xl tabular-nums text-ink-1">{grade.score}</span>
            </span>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-ink-2">{question}</p>

          <div className="mt-4">
            <div className="text-[11px] text-ink-3">あなたの答案</div>
            <p className="mt-1 text-base leading-relaxed text-ink-1">
              {input.trim() || "（未記入）"}
            </p>
          </div>

          {edited && (
            <div className="mt-4">
              <div className="text-[11px] text-ink-3">添削</div>
              <div className="mt-1">
                <DiffText before={input} after={grade.corrected} />
              </div>
              <p className="mt-2 text-base leading-relaxed text-ink-1">{grade.corrected}</p>
            </div>
          )}

          {/* AI採点が無いときの feedback は「照合で採点した」旨だけなので、
              下の注記と重複する。ここでは出さない。 */}
          {grade.aiJudged && grade.feedback && (
            <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-ink-2">
              {grade.feedback}
            </p>
          )}

          {grade.good && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--positive)" }}>
              {grade.good}
            </p>
          )}

          {grade.tags.length > 0 && (
            <div className="mt-4 space-y-1.5">
              {grade.tags.map((judgement) => (
                <div key={judgement.id} className="flex items-baseline gap-2">
                  <TagChip tagId={judgement.id} verdict={judgement.verdict} />
                  <span className="text-xs text-ink-3">{judgement.note}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-line pt-3">
            <div className="text-[11px] text-ink-3">模範解答</div>
            <ul className="mt-1 space-y-1">
              {answers.map((answer) => (
                <li key={answer} className="text-sm leading-relaxed text-ink-1">
                  {answer}
                </li>
              ))}
            </ul>
            {prompt.note && <p className="mt-2 text-xs text-ink-3">{prompt.note}</p>}
          </div>

          {!grade.aiJudged && (
            <p className="mt-3 text-[11px] text-ink-3">
              AI採点が使えなかったため、模範解答との照合で採点しています。表現の違いは点数に出ません。
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 shrink-0">
        <button
          type="button"
          onClick={onNext}
          className="btn-accent min-h-12 w-full rounded-xl px-5 py-3 text-base"
        >
          {number === total ? "セットの結果へ" : "次の講評へ"}
        </button>
      </div>
    </div>
  );
}
