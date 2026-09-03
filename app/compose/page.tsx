"use client";

import ComposeHeader from "./components/ComposeHeader";
import ReviewCard from "./components/ReviewCard";
import SessionSummary from "./components/SessionSummary";
import StartPanel from "./components/StartPanel";
import WritingCard from "./components/WritingCard";
import { useComposeSession } from "./hooks/useComposeSession";

/**
 * 英作文の出題画面（`/compose`）。
 *
 * セッションは1画面の中で start → writing → review → summary と進み、
 * 途中で画面遷移しない。分析（`/compose/analysis`）へ移れるのは、
 * セッションを始める前と終えたあとだけ。
 *
 * 学習の流れ:
 *   writing … 5問を続けて書く。確定した答案はその場で裏の採点に回り、
 *             次の問題を書いている時間と並走する（待ち時間がループから消える）
 *   review  … 全部書き終えてから、1問ずつ添削を読む。ここは削らない。
 *             英作文で学びが起きるのは、書いた文と直された文を見比べる瞬間なので
 */
export default function ComposePage() {
  const {
    phase,
    mode,
    direction,
    entries,
    writingIndex,
    reviewIndex,
    gradedCount,
    progress,
    settings,
    streakDays,
    evaluation,
    startSession,
    commitAnswer,
    revealHint,
    advanceReview,
    backToStart,
    updateSettings,
  } = useComposeSession();

  const answeredCount = entries.filter((entry) => entry.committed).length;
  const gradingCount = answeredCount - gradedCount;
  const currentEntry = entries[phase === "review" ? reviewIndex : writingIndex];

  return (
    <div className="app-shell flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-3">
        <ComposeHeader
          progress={
            phase === "writing" || phase === "review"
              ? { answered: phase === "review" ? entries.length : answeredCount, total: entries.length }
              : undefined
          }
          streakDays={streakDays}
          link={{ href: "/", label: "単語アプリ" }}
        />

        {/* 保存済みの学習状態はハイドレーション後に入るので、始める前の画面は
            「まだ何もない状態」でサーバー側から描いておく。読み込みが済むまで
            何も出さないと、開いた瞬間に空白の画面を見ることになる。 */}
        <main className="mt-4 flex min-h-0 flex-1 flex-col">
          {phase === "start" ? (
            <StartPanel
              progress={progress}
              settings={settings}
              onStart={startSession}
              onSettingsChange={updateSettings}
            />
          ) : phase === "writing" && currentEntry ? (
            <WritingCard
              key={currentEntry.prompt.id}
              prompt={currentEntry.prompt}
              direction={direction}
              number={writingIndex + 1}
              total={entries.length}
              hintShown={currentEntry.hintUsed}
              onRevealHint={() => revealHint(writingIndex)}
              onSubmit={(text) => commitAnswer(writingIndex, text)}
              gradingCount={gradingCount}
            />
          ) : phase === "review" && currentEntry ? (
            <ReviewCard
              key={currentEntry.prompt.id}
              entry={currentEntry}
              direction={direction}
              number={reviewIndex + 1}
              total={entries.length}
              onNext={advanceReview}
            />
          ) : phase === "summary" && evaluation ? (
            <SessionSummary
              evaluation={evaluation}
              streakDays={streakDays}
              onRestart={() => startSession(mode)}
              onBackToStart={backToStart}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
