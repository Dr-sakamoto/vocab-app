"use client";

import Link from "next/link";
import type { SessionEvaluation } from "@/lib/compose/sessionEvaluation";
import MasteryBar from "./MasteryBar";

interface SessionSummaryProps {
  evaluation: SessionEvaluation;
  streakDays: number;
  onRestart: () => void;
  onBackToStart: () => void;
}

/**
 * セッションの総括。
 *
 * 主役は点数ではなく「タグの習熟度がどう動いたか」。英作文は1セットの
 * 平均点では伸びが見えず、点数だけを出すと毎回同じ数字を眺めることに
 * なる。動いた文法を名指しで見せて、続ける理由をこちらから渡す。
 */
export default function SessionSummary({
  evaluation,
  streakDays,
  onRestart,
  onBackToStart,
}: SessionSummaryProps) {
  const { grade, title, message, averageScore, passCount, total, tagDeltas } = evaluation;

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="prompt-card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl text-ink-1">{grade}</span>
            <span className="text-sm text-ink-2">{title}</span>
          </div>
          <div className="text-sm tabular-nums text-ink-3">
            平均 <span className="text-ink-1">{averageScore}</span> 点 ／ 合格{" "}
            <span className="text-ink-1">{passCount}</span> / {total}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-2">{message}</p>

        {streakDays > 0 && (
          <p className="mt-1 text-xs tabular-nums text-ink-3">連続 {streakDays} 日</p>
        )}
      </div>

      {tagDeltas.length > 0 && (
        <div className="prompt-card mt-3 p-4">
          <div className="text-xs text-ink-3">今回動いた文法</div>
          <div className="mt-3 space-y-2.5">
            {tagDeltas.map((tag) => (
              <MasteryBar
                key={tag.tagId}
                label={tag.label}
                mastery={tag.after}
                delta={tag.delta}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onRestart}
          className="btn-accent min-h-12 w-full rounded-xl px-5 py-3 text-base"
        >
          もう1セット
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBackToStart}
            className="btn-quiet min-h-11 flex-1 rounded-xl px-4 py-2.5 text-sm"
          >
            モードを選ぶ
          </button>
          <Link
            href="/compose/analysis"
            className="btn-quiet flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm"
          >
            分析を見る
          </Link>
        </div>
      </div>
    </div>
  );
}
