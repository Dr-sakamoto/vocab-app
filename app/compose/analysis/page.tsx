"use client";

import { useMemo } from "react";
import { COMPOSE } from "@/lib/compose/constants";
import { findGrammarTag } from "@/lib/compose/grammarTags";
import { buildTagProgressRows } from "@/lib/compose/mastery";
import { EMPTY_PROGRESS, loadProgress, summarizeProgress } from "@/lib/compose/progress";
import type { ComposeProgress } from "@/lib/compose/types";
import { useIsClient } from "../hooks/useIsClient";
import ComposeHeader from "../components/ComposeHeader";
import DiffText from "../components/DiffText";
import MasteryBar from "../components/MasteryBar";
import TagChip from "../components/TagChip";

/** 直近の答案をいくつ見せるか。多すぎると読まれない */
const RECENT_LIMIT = 8;

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 弱点分析（`/compose/analysis`）。
 *
 * このアプリで単語アプリと最も違うのがこの画面。書いた答案は消さずに
 * 残し、「どの文法でつまずいているか」を名前と数字で見せる。
 *
 * 出す順番は、学習者が次に取る行動の順:
 *   1. いま弱いところ（＋その文法の指針）… 次のセットで何が出るか
 *   2. 全タグの習熟度                    … 全体のどこにいるか
 *   3. 直近の答案                        … 具体的に何を間違えたか
 */
export default function ComposeAnalysisPage() {
  // 保存済みの学習状態はハイドレーション後に読む（app/compose/hooks/useIsClient.ts）
  const isLoaded = useIsClient();
  const progress = useMemo<ComposeProgress>(
    () => (isLoaded ? loadProgress() : EMPTY_PROGRESS),
    [isLoaded],
  );

  const summary = summarizeProgress(progress);
  const rows = buildTagProgressRows(progress);
  const measured = rows.filter((row) => !row.untouched);
  const weakRows = measured.slice(0, COMPOSE.WEAK_TAG_DISPLAY);
  const recent = progress.history.slice(0, RECENT_LIMIT);

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 p-3">
        <ComposeHeader streakDays={0} link={{ href: "/compose", label: "出題へ戻る" }} />

        <main className="mt-4 space-y-3 pb-8">
          <div className="prompt-card p-4">
            <h1 className="text-lg text-ink-1">弱点分析</h1>
            {isLoaded && summary.totalAttempts === 0 ? (
              <p className="mt-2 text-xs text-ink-3">
                まだ答案がありません。5問書くと、どの文法でつまずいているかが出ます。
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap items-baseline gap-4 text-xs text-ink-3">
                <span className="tabular-nums">
                  通算 <span className="text-ink-1">{summary.totalAttempts}</span> 問
                </span>
                <span className="tabular-nums">
                  平均 <span className="text-ink-1">{summary.averageScore}</span> 点
                </span>
                <span className="tabular-nums">
                  直近の合格率 <span className="text-ink-1">{summary.passRate}</span>%
                </span>
                <span className="tabular-nums">
                  測定済みの文法 <span className="text-ink-1">{measured.length}</span> / {rows.length}
                </span>
              </div>
            )}
          </div>

          {weakRows.length > 0 && (
            <div className="prompt-card p-4">
              <div className="text-xs text-ink-3">いま弱いところ</div>
              <div className="mt-3 space-y-4">
                {weakRows.map((row) => (
                  <div key={row.tag.id}>
                    <MasteryBar
                      label={row.tag.label}
                      mastery={row.mastery}
                      attempts={row.stat.attempts}
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{row.tag.hint}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-ink-3">
                弱点特訓を選ぶと、ここに出ている文法を含む問題から優先して出題します。
              </p>
            </div>
          )}

          <div className="prompt-card p-4">
            <div className="text-xs text-ink-3">文法・表現ごとの習熟度</div>
            <div className="mt-3 space-y-2.5">
              {rows.map((row) => (
                <MasteryBar
                  key={row.tag.id}
                  label={row.tag.label}
                  mastery={row.mastery}
                  untouched={row.untouched}
                  attempts={row.stat.attempts}
                />
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-ink-3">
              習熟度は直近の点数を重く見た推定値です。答案が少ないうちは 50 に寄せてあり、
              解くほど実測へ近づきます。
            </p>
          </div>

          {recent.length > 0 && (
            <div className="prompt-card p-4">
              <div className="text-xs text-ink-3">直近の答案</div>
              <div className="mt-3 space-y-4">
                {recent.map((attempt) => (
                  <div key={`${attempt.promptId}-${attempt.answeredAt}`} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
                    <div className="flex items-baseline justify-between gap-2 text-[11px] text-ink-3">
                      <span>{formatDate(attempt.answeredAt)}</span>
                      <span className="tabular-nums text-ink-2">{attempt.score} 点</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-3">{attempt.question}</p>
                    <div className="mt-1.5">
                      <DiffText before={attempt.input} after={attempt.corrected || attempt.input} />
                    </div>
                    {attempt.feedback && (
                      <p className="mt-1.5 text-xs text-ink-3">{attempt.feedback}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {attempt.tags.map((tagId) => {
                        const judgement = attempt.tagJudgements.find((j) => j.id === tagId);
                        return (
                          <TagChip
                            key={tagId}
                            tagId={tagId}
                            verdict={judgement?.verdict}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoaded && measured.length > 0 && (
            <p className="px-1 text-[11px] leading-relaxed text-ink-3">
              {(() => {
                const weakest = measured[0];
                const tag = findGrammarTag(weakest.tag.id);
                return tag
                  ? `次に狙うなら「${tag.label}」。${tag.description}`
                  : null;
              })()}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
